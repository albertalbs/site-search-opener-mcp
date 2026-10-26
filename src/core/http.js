// Polite HTTP for sitemap and feed reading.
// - Says who it is in the User-Agent, never pretends to be a browser.
// - One request at a time per site, with a gap between requests.
// - Follows redirects by hand so it can refuse private network hosts.
// - Caps how much it downloads.

import { isPublicHost } from "./domains.js";

export const VERSION = "1.0.0";
export const ROBOTS_TOKEN = "SiteSearchOpenerMCP";
export const USER_AGENT = `${ROBOTS_TOKEN}/${VERSION} (+https://github.com/albertalbs/site-search-opener-mcp)`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Fetcher {
  constructor(opts = {}) {
    this.allowPrivate = Boolean(opts.allowPrivate);
    this.minDelayMs = opts.minDelayMs ?? 1000;
    this.maxDelayMs = opts.maxDelayMs ?? 10000;
    this.timeoutMs = opts.timeoutMs ?? 15000;
    this.maxRedirects = opts.maxRedirects ?? 5;
    this.fetchImpl = opts.fetchImpl || globalThis.fetch.bind(globalThis);
    this.nextSlot = new Map(); // host -> time when the next request may start
    this.hostDelay = new Map(); // host -> delay in ms (Crawl-delay aware)
    this.requests = 0;
    this.maxRequests = opts.maxRequests ?? 2000;
  }

  setCrawlDelay(host, seconds) {
    const ms = Math.min(this.maxDelayMs, Math.max(this.minDelayMs, Math.round(Number(seconds) * 1000) || 0));
    this.hostDelay.set(host, ms);
  }

  async waitTurn(host) {
    const delay = this.hostDelay.get(host) ?? this.minDelayMs;
    const now = Date.now();
    const start = Math.max(now, this.nextSlot.get(host) || 0);
    this.nextSlot.set(host, start + delay);
    if (start > now) await sleep(start - now);
  }

  checkUrl(u) {
    let url;
    try { url = new URL(u); } catch { return "not a valid URL"; }
    if (url.protocol !== "https:" && url.protocol !== "http:") return "only http and https are allowed";
    if (!this.allowPrivate && !isPublicHost(url.hostname)) return "private or local addresses are not allowed";
    return "";
  }

  // Returns { ok, status, url, chain, headers, text, truncated, error }
  async request(u, { method = "GET", maxBytes = 2_000_000, accept = "*/*" } = {}) {
    const chain = [];
    let current = u;
    for (let hop = 0; hop <= this.maxRedirects; hop++) {
      const bad = this.checkUrl(current);
      if (bad) return { ok: false, status: 0, url: current, chain, error: bad };
      if (++this.requests > this.maxRequests) return { ok: false, status: 0, url: current, chain, error: "request budget for this call used up" };
      const host = new URL(current).host;
      await this.waitTurn(host);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      let res;
      try {
        res = await this.fetchImpl(current, {
          method, redirect: "manual", signal: ctrl.signal,
          headers: { "user-agent": USER_AGENT, accept, "accept-language": "en" },
        });
      } catch (e) {
        clearTimeout(timer);
        const msg = e && e.name === "AbortError" ? "timed out" : (e && e.cause && e.cause.code) || (e && e.message) || "network error";
        return { ok: false, status: 0, url: current, chain, error: String(msg) };
      }
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        clearTimeout(timer);
        chain.push(res.status);
        try { await res.body?.cancel(); } catch {}
        current = new URL(res.headers.get("location"), current).toString();
        continue;
      }
      if (method === "HEAD") {
        clearTimeout(timer);
        return { ok: res.ok, status: res.status, url: current, chain, headers: res.headers, text: "" };
      }
      try {
        const { text, truncated } = await readBody(res, maxBytes, current);
        clearTimeout(timer);
        return { ok: res.ok, status: res.status, url: current, chain, headers: res.headers, text, truncated };
      } catch (e) {
        clearTimeout(timer);
        return { ok: false, status: res.status, url: current, chain, error: "could not read the response: " + (e && e.message) };
      }
    }
    return { ok: false, status: 0, url: current, chain, error: "too many redirects" };
  }
}

async function readBody(res, maxBytes, url) {
  if (!res.body) return { text: "", truncated: false };
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0, truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    chunks.push(value);
    if (size >= maxBytes) { truncated = true; try { await reader.cancel(); } catch {} break; }
  }
  let bytes = concat(chunks, Math.min(size, maxBytes));
  // .xml.gz sitemaps arrive as raw gzip, not as Content-Encoding
  if (bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b && typeof DecompressionStream !== "undefined") {
    bytes = await gunzip(bytes, maxBytes * 8);
  }
  const type = (res.headers.get("content-type") || "").toLowerCase();
  const charset = (type.match(/charset=([\w-]+)/) || [])[1] || "utf-8";
  let text;
  try { text = new TextDecoder(charset).decode(bytes); } catch { text = new TextDecoder("utf-8").decode(bytes); }
  return { text, truncated };
}

function concat(chunks, limit) {
  const out = new Uint8Array(limit);
  let off = 0;
  for (const c of chunks) {
    const n = Math.min(c.byteLength, limit - off);
    out.set(c.subarray(0, n), off);
    off += n;
    if (off >= limit) break;
  }
  return out;
}

async function gunzip(bytes, maxOut) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const reader = stream.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    let r;
    try { r = await reader.read(); } catch { break; } // a cut-off gzip still gives us the first part
    if (r.done) break;
    chunks.push(r.value);
    size += r.value.byteLength;
    if (size >= maxOut) { try { await reader.cancel(); } catch {} break; }
  }
  return concat(chunks, Math.min(size, maxOut));
}
