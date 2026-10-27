// End-to-end through the MCP protocol, with a fake internet so the tests are
// fast and never touch real websites.
import { test } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";

const today = new Date().toISOString().slice(0, 10);

const SITES = {
  "https://rival-one.com/robots.txt": "User-agent: *\nDisallow: /private/\nSitemap: https://rival-one.com/sitemap_index.xml\n",
  "https://rival-one.com/sitemap_index.xml": `<sitemapindex><sitemap><loc>https://rival-one.com/post-sitemap.xml</loc></sitemap><sitemap><loc>https://rival-one.com/page-sitemap.xml.gz</loc></sitemap></sitemapindex>`,
  "https://rival-one.com/post-sitemap.xml": `<urlset>
    <url><loc>https://www.rival-one.com/blog/maintenance-backlog-guide/</loc><lastmod>${today}</lastmod></url>
    <url><loc>https://rival-one.com/blog/shift-handover/</loc><lastmod>2025-02-01</lastmod></url>
    <url><loc>https://rival-one.com/private/secret-page/</loc></url>
    <url><loc>https://other-site.com/blog/not-ours/</loc></url>
  </urlset>`,
  "https://rival-one.com/page-sitemap.xml.gz": gzipSync(`<urlset><url><loc>https://rival-one.com/case-studies/acme/</loc></url><url><loc>https://rival-one.com/pricing/</loc></url></urlset>`),
  "https://rival-one.com/": `<html><head><link rel="alternate" type="application/rss+xml" href="/feed/"></head></html>`,
  "https://rival-one.com/feed/": `<rss><channel><item><title>Maintenance backlog guide</title><link>https://www.rival-one.com/blog/maintenance-backlog-guide/</link><description>How to shrink it</description><pubDate>${new Date().toUTCString()}</pubDate></item></channel></rss>`,
  "https://www.rival-one.com/blog/maintenance-backlog-guide/": `<html><head><title>The backlog guide</title><meta name="description" content="Shrink your backlog"></head></html>`,
  "https://rival-one.com/case-studies/acme/": `<html><head><title>Acme case study</title></head></html>`,
  // rival-two has no sitemap and no feed
  "https://rival-two.com/": "<html><head><title>Rival two</title></head></html>",
  // rival-three blocks everything
  "https://rival-three.com/robots.txt": "User-agent: *\nDisallow: /\n",
};

async function fakeFetch(url, init = {}) {
  const u = String(url);
  if (u === "https://www.rival-one.com/robots.txt") return new Response("", { status: 404 });
  if (u === "https://www.rival-one.com/") return new Response("", { status: 301, headers: { location: "https://rival-one.com/" } });
  if (u === "https://redirector.com/") return new Response("", { status: 301, headers: { location: "https://new-home.com/" } });
  if (u === "https://new-home.com/") return new Response("ok", { status: 200 });
  if (u === "https://evil.com/") return new Response("", { status: 302, headers: { location: "http://169.254.169.254/latest/" } });
  if (!(u in SITES)) return new Response("not found", { status: 404 });
  const body = init.method === "HEAD" ? null : SITES[u];
  return new Response(body, { status: 200, headers: { "content-type": u.endsWith(".gz") ? "application/gzip" : "text/html; charset=utf-8" } });
}

async function connect() {
  const server = createServer({ mode: "local", fetchImpl: fakeFetch, minDelayMs: 0 });
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" });
  await Promise.all([server.connect(a), client.connect(b)]);
  return client;
}
const textOf = (r) => r.content.map((c) => c.text).join("\n");

test("lists tools and prompts", async () => {
  const c = await connect();
  const tools = (await c.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(tools, ["build-project-file", "check-urls", "google-links", "list-recipes", "run-recipe", "site-inventory"]);
  const prompts = (await c.listPrompts()).prompts.map((p) => p.name);
  for (const p of ["seo", "product", "sales", "pr", "research", "hr", "links", "build-project", "inventory", "search-links"]) assert.ok(prompts.includes(p), p);
  const msg = await c.getPrompt({ name: "seo", arguments: { keyword: "backlog" } });
  assert.match(msg.messages[0].content.text, /content-gap/);
});

test("run-recipe reads sitemaps, respects robots, falls back to links", async () => {
  const c = await connect();
  const r = await c.callTool({ name: "run-recipe", arguments: { recipe: "content-gap", keywords: ["maintenance backlog"], targets: ["rival-one.com", "rival-two.com", "rival-three.com"], format: "json" } });
  const d = JSON.parse(textOf(r));
  const one = d.domains.find((x) => x.target === "rival-one.com");
  assert.equal(one.matched, 1);
  assert.equal(d.rows[0].url, "https://www.rival-one.com/blog/maintenance-backlog-guide/");
  assert.equal(d.rows[0].title, "Maintenance backlog guide", "title from the RSS feed");
  assert.equal(d.rows[0].status, "200");
  assert.ok(!JSON.stringify(d).includes("secret-page"), "robots.txt disallowed page is filtered out of details");
  assert.ok(!JSON.stringify(d.rows).includes("other-site.com"), "only the domain's own pages");
  const two = d.domains.find((x) => x.target === "rival-two.com");
  assert.equal(two.reason, "no sitemap or feed found");
  const three = d.domains.find((x) => x.target === "rival-three.com");
  assert.ok(three.reason, "blocked site is not read");
  const links = d.fallback_links.map((l) => l.target).sort();
  assert.deepEqual(links, ["rival-three.com", "rival-two.com"]);
  assert.ok(d.fallback_links.every((l) => l.url.startsWith("https://www.google.com/search?q=site%3A")));
});

test("gzip sitemaps and folder counts", async () => {
  const c = await connect();
  const r = await c.callTool({ name: "run-recipe", arguments: { recipe: "case-studies", targets: ["rival-one.com"], format: "json" } });
  const d = JSON.parse(textOf(r));
  assert.equal(d.rows.length, 1);
  assert.equal(d.rows[0].url, "https://rival-one.com/case-studies/acme/");
  assert.equal(d.rows[0].title, "Acme case study", "title fetched from the page");
  const inv = await c.callTool({ name: "site-inventory", arguments: { target: "rival-one.com", page_details: 0 } });
  const t = textOf(inv);
  assert.match(t, /\/blog\/ \| 2/);
  assert.doesNotMatch(t, /private/, "private section is never listed");
});

test("Google-only recipes give links with an explanation", async () => {
  const c = await connect();
  const r = await c.callTool({ name: "run-recipe", arguments: { recipe: "forum-threads", keywords: ["maintenance backlog"] } });
  const t = textOf(r);
  assert.match(t, /site%3Areddit\.com%20OR%20site%3Aquora\.com/);
  assert.match(t, /opens in your own browser/);
  assert.match(t, /bestseo\.tips\/tools\/site-search-opener/);
  const bad = await c.callTool({ name: "run-recipe", arguments: { recipe: "forum-threads" } });
  assert.equal(bad.isError, true);
});

test("google-links and build-project-file", async () => {
  const c = await connect();
  const g = await c.callTool({ name: "google-links", arguments: { keywords: ["blog", "guides"], operator: "inurl", targets: ["a.com"] } });
  assert.equal((textOf(g).match(/\]\(https:\/\/www\.google\.com/g) || []).length, 2, "one link per inurl keyword");
  const p = await c.callTool({ name: "build-project-file", arguments: {
    projects: [
      { name: "Rivals", own: ["https://www.rival-one.com/"], competitors: ["rival-two.com", "redirector.com", "nowhere.com", "rival-one.com", "evil.com"] },
      { name: "Second", own: [], competitors: ["rival-two.com"] },
    ],
  } });
  const t = textOf(p);
  const json = JSON.parse(t.slice(t.indexOf("```json") + 7, t.lastIndexOf("```")));
  assert.equal(json.app, "sitesearch-opener");
  assert.equal(json.version, 2);
  const rivals = json.projects.find((x) => x.name === "Rivals");
  assert.deepEqual(rivals.own, ["rival-one.com"]);
  assert.deepEqual(rivals.competitors, ["rival-two.com", "new-home.com"], "redirect followed, dead and duplicate dropped");
  assert.match(t, /nowhere\.com \| 404/);
  assert.match(t, /evil\.com/);
  assert.doesNotMatch(JSON.stringify(json), /169\.254/, "redirect to a private address is refused");
  assert.equal(json.projects.length, 2);
});

test("list-recipes starts short, and shows everything on request", async () => {
  const c = await connect();
  const short = textOf(await c.callTool({ name: "list-recipes", arguments: {} }));
  assert.match(short, /## Start here/);
  assert.equal((short.match(/^- [a-z-]+: /gm) || []).length, 7, "seven starter recipes");
  assert.match(short, /SEO and content: 12 recipes/);
  const full = textOf(await c.callTool({ name: "list-recipes", arguments: { all: true } }));
  assert.equal((full.match(/^- [a-z-]+: /gm) || []).length, 34);
  const sales = textOf(await c.callTool({ name: "list-recipes", arguments: { team: "sales" } }));
  assert.equal((sales.match(/^- [a-z-]+: /gm) || []).length, 4);
});

test("run-recipe takes domains from a project file", async () => {
  const c = await connect();
  const file = JSON.stringify({ app: "sitesearch-opener", version: 2, projects: [{ name: "P", own: ["mine.com"], competitors: ["rival-one.com"] }] });
  const r = await c.callTool({ name: "run-recipe", arguments: { recipe: "pricing", project_json: file, format: "json" } });
  const d = JSON.parse(textOf(r));
  assert.equal(d.rows[0].url, "https://rival-one.com/pricing/");
});
