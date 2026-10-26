// Builds a page inventory for one domain from its own sitemaps and feeds.
// Every file and page is checked against robots.txt before it is fetched.

import { splitTarget, hostMatches } from "./domains.js";
import { loadRobots } from "./robots.js";
import { parseFeed, feedLinksFromHtml, pageMeta } from "./feeds.js";
import { cleanKeywords } from "./queries.js";

// Local runs can read big sites. Cloudflare's free tier allows about 10 ms
// of CPU per request, so the hosted version reads less.
export const LOCAL_LIMITS = { maxSitemaps: 30, maxUrls: 50000, maxBytes: 20_000_000, maxRows: 1000, maxChecks: 100 };
export const REMOTE_LIMITS = { maxSitemaps: 4, maxUrls: 5000, maxBytes: 2_000_000, maxRows: 300, maxChecks: 20 };
// Workers Paid plan: far more outgoing requests and CPU per call
export const REMOTE_PAID_LIMITS = { maxSitemaps: 12, maxUrls: 20000, maxBytes: 8_000_000, maxRows: 500, maxChecks: 50 };

const XML_ACCEPT = "application/xml,text/xml,application/rss+xml,application/atom+xml,text/plain;q=0.9,*/*;q=0.5";

export function makeContext(fetcher, limits) {
  return { fetcher, limits, robots: new Map(), docs: new Map() };
}

function robotsFor(ctx, url) {
  return loadRobots(ctx.fetcher, new URL(url).origin, ctx.robots);
}

async function readDoc(ctx, url) {
  if (ctx.docs.has(url)) return ctx.docs.get(url);
  let doc;
  const robots = await robotsFor(ctx, url);
  if (robots.state === "unreachable") doc = { url, error: "robots.txt could not be read, so this site was left alone" };
  else if (!robots.allows(url)) doc = { url, error: "blocked by robots.txt" };
  else {
    const res = await ctx.fetcher.request(url, { maxBytes: ctx.limits.maxBytes, accept: XML_ACCEPT });
    doc = res.ok
      ? { url, finalUrl: res.url, parsed: parseFeed(res.text), truncated: res.truncated }
      : { url, error: res.error || "HTTP " + res.status };
  }
  ctx.docs.set(url, doc);
  return doc;
}

async function sitemapsForHost(ctx, host, notes) {
  const robots = await robotsFor(ctx, "https://" + host + "/");
  if (robots.state === "unreachable") {
    notes.push(`${host}: robots.txt could not be read (${robots.error}), so the site was left alone.`);
    return { robots, sitemaps: [] };
  }
  if (robots.sitemaps.length) return { robots, sitemaps: robots.sitemaps };
  for (const p of ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml"]) {
    const u = "https://" + host + p;
    const doc = await readDoc(ctx, u);
    if (doc.parsed && (doc.parsed.kind === "sitemapindex" || doc.parsed.entries.length)) return { robots, sitemaps: [u] };
  }
  return { robots, sitemaps: [] };
}

async function feedsForTarget(ctx, host, path, robots, haveSitemaps) {
  const page = "https://" + host + path;
  const feeds = [];
  if (robots.allows(page)) {
    const res = await ctx.fetcher.request(page, { maxBytes: 400_000, accept: "text/html,*/*" });
    if (res.ok) feeds.push(...feedLinksFromHtml(res.text, res.url));
  }
  if (!feeds.length && !haveSitemaps) {
    for (const p of ["/feed", "/rss.xml", "/feed.xml", "/atom.xml"]) {
      const u = "https://" + host + p;
      const doc = await readDoc(ctx, u);
      if (doc.parsed && doc.parsed.entries.length) { feeds.push(u); break; }
    }
  }
  return feeds;
}

function scoreChild(url, hints) {
  const u = url.toLowerCase();
  let s = 0;
  for (const h of hints) if (u.includes(h)) s += 2;
  if (/(image|video)/.test(u)) s -= 1;
  return s;
}

// hints: words that suggest which child sitemaps to read first
export async function collect(ctx, target, { subdomains = [], hints = [] } = {}) {
  const { host, path } = splitTarget(target);
  const notes = [];
  const found = new Map();
  const read = [];
  const skipped = [];
  const hosts = [host, ...subdomains.map((s) => s + "." + host)];

  const queue = [];
  const seen = new Set();
  let robotsState = "";
  for (const h of hosts) {
    const r = await sitemapsForHost(ctx, h, h === host ? notes : []);
    if (h === host) robotsState = r.robots.state;
    for (const s of r.sitemaps) if (!seen.has(s)) { seen.add(s); queue.push({ url: s, lastmod: "" }); }
  }
  const mainRobots = await robotsFor(ctx, "https://" + host + "/");
  const feeds = mainRobots.state === "unreachable" ? [] : await feedsForTarget(ctx, host, path, mainRobots, queue.length > 0);

  const accept = (u) => {
    let x;
    try { x = new URL(u); } catch { return false; }
    if (!hostMatches(x.hostname, host, subdomains.length > 0)) return false;
    return path === "/" || x.pathname.toLowerCase().startsWith(path);
  };
  const add = (e) => {
    if (!accept(e.url)) return;
    const prev = found.get(e.url);
    if (!prev) found.set(e.url, { ...e });
    else {
      if (!prev.title && e.title) prev.title = e.title;
      if (!prev.description && e.description) prev.description = e.description;
      if (!prev.lastmod && e.lastmod) prev.lastmod = e.lastmod;
    }
  };

  let budget = ctx.limits.maxSitemaps;
  while (queue.length && budget > 0 && found.size < ctx.limits.maxUrls) {
    queue.sort((a, b) => scoreChild(b.url, hints) - scoreChild(a.url, hints) || (b.lastmod || "").localeCompare(a.lastmod || ""));
    const item = queue.shift();
    budget--;
    const doc = await readDoc(ctx, item.url);
    if (doc.error) { skipped.push(item.url + ": " + doc.error); continue; }
    read.push(item.url + (doc.truncated ? " (cut at the size limit)" : ""));
    if (doc.parsed.kind === "sitemapindex") {
      for (const c of doc.parsed.children) if (!seen.has(c.url)) { seen.add(c.url); queue.push(c); }
      continue;
    }
    for (const e of doc.parsed.entries) add(e);
  }
  if (queue.length) notes.push(`${queue.length} more sitemap file(s) were not read because of the limit of ${ctx.limits.maxSitemaps} per domain.`);
  if (found.size >= ctx.limits.maxUrls) notes.push(`Stopped at ${ctx.limits.maxUrls} URLs.`);

  const feedsRead = [];
  for (const f of feeds.slice(0, 3)) {
    const doc = await readDoc(ctx, f);
    if (doc.error) { skipped.push(f + ": " + doc.error); continue; }
    feedsRead.push(f);
    for (const e of doc.parsed.entries) add(e);
  }

  // A sitemap can list pages that robots.txt asks bots to stay out of.
  // Those are left out of the results, not just left unfetched.
  let entries = [...found.values()];
  const origins = [...new Set(entries.map((e) => new URL(e.url).origin))];
  const rulesByOrigin = new Map();
  for (const o of origins) rulesByOrigin.set(o, await robotsFor(ctx, o + "/"));
  const before = entries.length;
  entries = entries.filter((e) => {
    const r = rulesByOrigin.get(new URL(e.url).origin);
    return r && r.state !== "unreachable" && r.allows(e.url);
  });
  if (entries.length < before) notes.push(`${before - entries.length} listed page(s) are disallowed by robots.txt and were left out.`);
  return { target, robots: robotsState, sitemapsRead: read, feedsRead, skipped, entries, notes };
}

function words(s) {
  return String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function matchesKeyword(entry, kwWordLists) {
  let path = entry.url;
  try { path = decodeURIComponent(new URL(entry.url).pathname); } catch {}
  const tokens = words(path + " " + (entry.title || ""));
  const has = (w) => tokens.some((t) => t === w || (w.length >= 4 && t.startsWith(w)));
  return kwWordLists.some((list) => list.every(has));
}

// f: { paths: string[], keywords: string[], since, olderThan }
export function filterEntries(entries, f = {}) {
  const res = (f.paths || []).map((p) => new RegExp(p, "i"));
  const kw = cleanKeywords(f.keywords).map((k) => words(k.replace(/"/g, ""))).filter((l) => l.length);
  let noDate = 0;
  const out = entries.filter((e) => {
    let pathname = "";
    try { pathname = decodeURIComponent(new URL(e.url).pathname).toLowerCase(); } catch { pathname = e.url; }
    if (res.length && !res.some((r) => r.test(pathname))) return false;
    if (kw.length && !matchesKeyword(e, kw)) return false;
    if (f.since || f.olderThan) {
      if (!e.lastmod) { noDate++; return false; }
      if (f.since && e.lastmod < f.since) return false;
      if (f.olderThan && e.lastmod >= f.olderThan) return false;
    }
    return true;
  });
  out.sort((a, b) => (b.lastmod || "").localeCompare(a.lastmod || "") || a.url.localeCompare(b.url));
  return { rows: out, noDate };
}

export function folderCounts(entries, basePath = "/") {
  const counts = new Map();
  for (const e of entries) {
    let p;
    try { p = new URL(e.url).pathname.toLowerCase(); } catch { continue; }
    if (basePath !== "/" && p.startsWith(basePath)) p = p.slice(basePath.length - 1);
    const seg = p.split("/").filter(Boolean)[0];
    const key = seg ? "/" + seg + "/" : "/ (home)";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([folder, count]) => ({ folder, count }));
}

export function monthCounts(entries) {
  const counts = new Map();
  for (const e of entries) if (e.lastmod) counts.set(e.lastmod.slice(0, 7), (counts.get(e.lastmod.slice(0, 7)) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12).map(([month, count]) => ({ month, count }));
}

// Adds HTTP status, and title plus description when asked, to the first rows.
export async function enrich(ctx, rows, { status = false, titles = false, max = 25 } = {}) {
  const n = Math.min(rows.length, max, ctx.limits.maxChecks);
  for (let i = 0; i < n; i++) {
    const row = rows[i];
    const robots = await robotsFor(ctx, row.url);
    if (robots.state === "unreachable" || !robots.allows(row.url)) { row.status = "not checked (robots.txt)"; continue; }
    let res;
    if (titles && !(row.title && row.description)) {
      res = await ctx.fetcher.request(row.url, { maxBytes: 150_000, accept: "text/html,*/*" });
      if (res.ok && res.text) {
        const m = pageMeta(res.text);
        if (!row.title) row.title = m.title;
        if (!row.description) row.description = m.description;
      }
    } else {
      res = await ctx.fetcher.request(row.url, { method: "HEAD" });
      if (!res.ok && [403, 405, 501].includes(res.status)) res = await ctx.fetcher.request(row.url, { maxBytes: 16_000 });
    }
    row.status = res.status ? [...res.chain, res.status].join(" > ") : "error: " + res.error;
  }
  return n;
}
