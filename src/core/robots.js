// robots.txt, following RFC 9309.
// - Our group is the one naming SiteSearchOpenerMCP, else the "*" group.
// - The longest matching rule wins. On a tie, Allow wins.
// - 4xx on robots.txt means no rules. 5xx or no answer means stay away.

import { ROBOTS_TOKEN } from "./http.js";

export function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  let lastWasAgent = false;
  for (let line of String(text || "").split(/\r?\n/)) {
    line = line.replace(/#.*$/, "").trim();
    if (!line) continue;
    const i = line.indexOf(":");
    if (i < 1) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) { current = { agents: [], rules: [], crawlDelay: null }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (key === "sitemap") { if (value) sitemaps.push(value); continue; }
    if (!current) continue;
    if (key === "allow" || key === "disallow") {
      if (value) current.rules.push({ allow: key === "allow", pattern: value });
    } else if (key === "crawl-delay") {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) current.crawlDelay = n;
    }
  }
  return { groups, sitemaps };
}

export function rulesFor(parsed, token = ROBOTS_TOKEN) {
  const t = token.toLowerCase();
  let picked = parsed.groups.filter((g) => g.agents.includes(t));
  if (!picked.length) picked = parsed.groups.filter((g) => g.agents.includes("*"));
  const rules = picked.flatMap((g) => g.rules);
  const delays = picked.map((g) => g.crawlDelay).filter((d) => d != null);
  return { rules, crawlDelay: delays.length ? Math.max(...delays) : null };
}

function toRegex(pattern) {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp("^" + body + (anchored ? "$" : ""));
}

function safeDecode(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

export function isAllowed(rules, pathAndQuery) {
  if (pathAndQuery === "/robots.txt") return true;
  const target = safeDecode(pathAndQuery);
  let best = null;
  for (const r of rules) {
    const re = toRegex(safeDecode(r.pattern));
    if (!re.test(target)) continue;
    const len = r.pattern.length;
    if (!best || len > best.len || (len === best.len && r.allow && !best.allow)) best = { len, allow: r.allow };
  }
  return best ? best.allow : true;
}

// Fetches and caches robots.txt per origin.
// Returns { state: "found" | "none" | "unreachable", rules, crawlDelay, sitemaps, allows(url) }
export async function loadRobots(fetcher, origin, cache) {
  if (cache && cache.has(origin)) return cache.get(origin);
  const res = await fetcher.request(origin + "/robots.txt", { maxBytes: 512_000, accept: "text/plain,*/*" });
  let info;
  if (res.ok) {
    const parsed = parseRobots(res.text);
    const { rules, crawlDelay } = rulesFor(parsed);
    info = { state: "found", rules, crawlDelay, sitemaps: parsed.sitemaps };
  } else if (res.status >= 400 && res.status < 500) {
    info = { state: "none", rules: [], crawlDelay: null, sitemaps: [] };
  } else {
    info = { state: "unreachable", rules: [{ allow: false, pattern: "/" }], crawlDelay: null, sitemaps: [], error: res.error || "HTTP " + res.status };
  }
  info.allows = (u) => {
    const url = new URL(u);
    return isAllowed(info.rules, url.pathname + url.search);
  };
  if (info.crawlDelay != null) fetcher.setCrawlDelay(new URL(origin).host, info.crawlDelay);
  if (cache) cache.set(origin, info);
  return info;
}
