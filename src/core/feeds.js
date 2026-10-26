// Reads sitemaps, RSS and Atom feeds.
// Light regex parsing on purpose: these files are machine-made and regular,
// and a full XML parser would blow the CPU budget on Cloudflare's free tier.

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeText(s) {
  if (!s) return "";
  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
  // RSS descriptions often carry escaped HTML, which only shows up after decoding
  s = s.replace(/<\/?[a-z][^>]*>/gi, " ");
  return s.replace(/\s+/g, " ").trim();
}

function tag(block, name) {
  const re = new RegExp("<(?:[\\w.-]+:)?" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?" + name + ">", "i");
  const m = block.match(re);
  return m ? m[1] : "";
}

function blocks(text, name) {
  const re = new RegExp("<(?:[\\w.-]+:)?" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?" + name + ">", "gi");
  const out = [];
  let m;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

export function toDate(s) {
  s = decodeText(s);
  if (!s) return "";
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : "";
}

function clip(s, n) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "..." : s;
}

// Returns { kind, entries: [{url, lastmod, title, description}], children: [{url, lastmod}] }
export function parseFeed(text) {
  text = String(text || "").replace(/^\uFEFF/, "");
  const head = text.slice(0, 2000).toLowerCase();

  if (head.includes("<sitemapindex")) {
    const children = blocks(text, "sitemap").map((b) => ({ url: decodeText(tag(b, "loc")), lastmod: toDate(tag(b, "lastmod")) })).filter((c) => c.url);
    return { kind: "sitemapindex", entries: [], children };
  }
  if (head.includes("<urlset")) {
    const entries = blocks(text, "url").map((b) => ({
      url: decodeText(tag(b, "loc")),
      lastmod: toDate(tag(b, "lastmod")),
      // only news:title is a page title; image:title and video:title describe media
      title: clip(decodeText((b.match(/<news:title[^>]*>([\s\S]*?)<\/news:title>/i) || [])[1] || ""), 200),
      description: "",
    })).filter((e) => e.url);
    return { kind: "urlset", entries, children: [] };
  }
  if (head.includes("<rss") || head.includes("<rdf:rdf") || head.includes("<channel")) {
    const entries = blocks(text, "item").map((b) => {
      let link = decodeText(tag(b, "link"));
      if (!link) { const g = decodeText(tag(b, "guid")); if (/^https?:\/\//.test(g)) link = g; }
      return {
        url: link,
        lastmod: toDate(tag(b, "pubDate") || tag(b, "date") || tag(b, "updated")),
        title: clip(decodeText(tag(b, "title")), 200),
        description: clip(decodeText(tag(b, "description")), 300),
      };
    }).filter((e) => e.url);
    return { kind: "rss", entries, children: [] };
  }
  if (head.includes("<feed")) {
    const entries = blocks(text, "entry").map((b) => {
      let link = "";
      for (const m of b.matchAll(/<link\b([^>]*)\/?>/gi)) {
        const attrs = m[1];
        const href = (attrs.match(/href\s*=\s*["']([^"']+)["']/i) || [])[1];
        const rel = ((attrs.match(/rel\s*=\s*["']([^"']+)["']/i) || [])[1] || "alternate").toLowerCase();
        if (href && rel === "alternate") { link = decodeText(href); break; }
        if (href && !link) link = decodeText(href);
      }
      return {
        url: link,
        lastmod: toDate(tag(b, "updated") || tag(b, "published")),
        title: clip(decodeText(tag(b, "title")), 200),
        description: clip(decodeText(tag(b, "summary") || tag(b, "content")), 300),
      };
    }).filter((e) => e.url);
    return { kind: "atom", entries, children: [] };
  }
  // plain text sitemap: one URL per line
  if (!head.includes("<")) {
    const entries = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => /^https?:\/\//i.test(l))
      .map((url) => ({ url, lastmod: "", title: "", description: "" }));
    if (entries.length) return { kind: "text", entries, children: [] };
  }
  return { kind: "unknown", entries: [], children: [] };
}

// Feed links declared in a page's <head>.
export function feedLinksFromHtml(html, baseUrl) {
  const out = [];
  for (const m of String(html || "").matchAll(/<link\b[^>]*>/gi)) {
    const t = m[0];
    if (!/rel\s*=\s*["'][^"']*alternate/i.test(t)) continue;
    if (!/type\s*=\s*["']application\/(rss|atom)\+xml/i.test(t)) continue;
    const href = (t.match(/href\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (!href) continue;
    try { out.push(new URL(decodeText(href), baseUrl).toString()); } catch {}
  }
  return [...new Set(out)];
}

// <title> and meta description from the first part of a page.
export function pageMeta(html) {
  html = String(html || "");
  const title = clip(decodeText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || ""), 200);
  let description = "";
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const t = m[0];
    const name = ((t.match(/(?:name|property)\s*=\s*["']([^"']+)["']/i) || [])[1] || "").toLowerCase();
    if (name !== "description" && name !== "og:description") continue;
    const content = (t.match(/content\s*=\s*["']([^"']*)["']/i) || [])[1] || "";
    if (content && (name === "description" || !description)) description = clip(decodeText(content), 300);
    if (name === "description" && description) break;
  }
  return { title, description };
}
