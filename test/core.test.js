import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeTarget, isValidTarget, isPublicHost, hostMatches } from "../src/core/domains.js";
import { buildQueries, searchUrl } from "../src/core/queries.js";
import { parseRobots, rulesFor, isAllowed } from "../src/core/robots.js";
import { parseFeed, feedLinksFromHtml, pageMeta } from "../src/core/feeds.js";
import { filterEntries, folderCounts } from "../src/core/inventory.js";
import { RECIPES, TEAMS, APP_PRESETS, googleOptions } from "../src/core/recipes.js";

test("normalizeTarget matches the web app", () => {
  assert.equal(normalizeTarget("https://www.Example.com/"), "example.com");
  assert.equal(normalizeTarget("example.com/blog"), "example.com/blog/");
  assert.equal(normalizeTarget("http://example.com/en/?x=1#top"), "example.com/en/");
  assert.equal(normalizeTarget("  tulip.co/ "), "tulip.co");
  assert.ok(isValidTarget("example.com/blog/"));
  assert.ok(!isValidTarget("localhost"));
  assert.ok(!isValidTarget("exa mple.com"));
});

test("private hosts are refused", () => {
  for (const h of ["localhost", "127.0.0.1", "10.1.2.3", "192.168.0.1", "172.20.0.5", "169.254.169.254", "::1", "router.local"]) {
    assert.equal(isPublicHost(h), false, h);
  }
  assert.ok(isPublicHost("example.com"));
  assert.ok(isPublicHost("8.8.8.8"));
  assert.ok(hostMatches("www.example.com", "example.com", false));
  assert.ok(!hostMatches("docs.example.com", "example.com", false));
  assert.ok(hostMatches("docs.example.com", "example.com", true));
});

test("queries follow the app, and inurl: is never OR-ed", () => {
  const q1 = buildQueries({ keywords: ["onboarding checklist"], operator: "intitle", exact: true, targets: ["a.com"] });
  assert.deepEqual(q1, [{ target: "a.com", query: 'site:a.com intitle:"onboarding checklist"' }]);
  const q2 = buildQueries({ keywords: ["a", "b"], operator: "intitle", exact: true, targets: ["x.com"] });
  assert.equal(q2[0].query, 'site:x.com (intitle:"a" OR intitle:"b")');
  const q3 = buildQueries({ keywords: ["blog", "guides"], operator: "inurl", exact: false, targets: ["x.com"] });
  assert.equal(q3.length, 2);
  assert.ok(q3.every((q) => !q.query.includes(" OR ")));
  const q4 = buildQueries({ keywords: [], operator: "none", exact: false, custom: "(site:{site}/blog OR site:{site}/guides)", targets: ["x.com"] });
  assert.equal(q4[0].query, "(site:x.com/blog OR site:x.com/guides)");
  const q5 = buildQueries({ keywords: ["Acme"], operator: "none", exact: true, bare: true, custom: "-site:{own}", own: [] });
  assert.equal(q5[0].query, '"Acme"');
  assert.match(searchUrl('site:x.com "a b"'), /^https:\/\/www\.google\.com\/search\?q=site%3Ax\.com%20%22a%20b%22$/);
});

test("robots.txt follows RFC 9309", () => {
  const p = parseRobots([
    "User-agent: *", "Disallow: /private/", "Allow: /private/ok", "Disallow: /*.pdf$", "",
    "User-agent: SiteSearchOpenerMCP", "Disallow: /no-bots/", "Crawl-delay: 3", "",
    "Sitemap: https://example.com/sitemap_index.xml",
  ].join("\n"));
  assert.deepEqual(p.sitemaps, ["https://example.com/sitemap_index.xml"]);
  const own = rulesFor(p);
  assert.equal(own.crawlDelay, 3);
  assert.equal(isAllowed(own.rules, "/no-bots/page"), false);
  assert.equal(isAllowed(own.rules, "/private/x"), true, "our own group replaces the * group");
  const star = rulesFor(p, "SomeOtherBot");
  assert.equal(isAllowed(star.rules, "/private/x"), false);
  assert.equal(isAllowed(star.rules, "/private/ok"), true, "longer Allow wins");
  assert.equal(isAllowed(star.rules, "/file.pdf"), false);
  assert.equal(isAllowed(star.rules, "/file.pdf?x=1"), true);
  assert.equal(isAllowed(star.rules, "/robots.txt"), true);
  assert.equal(isAllowed([{ allow: false, pattern: "/a" }, { allow: true, pattern: "/a" }], "/a"), true, "Allow wins a tie");
});

test("feeds: sitemap index, urlset, RSS, Atom, text", () => {
  const idx = parseFeed('<?xml version="1.0"?><sitemapindex xmlns="x"><sitemap><loc>https://a.com/post-sitemap.xml</loc><lastmod>2026-09-01T10:00:00+00:00</lastmod></sitemap></sitemapindex>');
  assert.equal(idx.kind, "sitemapindex");
  assert.deepEqual(idx.children, [{ url: "https://a.com/post-sitemap.xml", lastmod: "2026-09-01" }]);
  const us = parseFeed('<urlset><url><loc>https://a.com/x?a=1&amp;b=2</loc><lastmod>2026-08-02</lastmod><image:image><image:title>Photo</image:title></image:image></url><url><loc><![CDATA[https://a.com/y]]></loc><news:news><news:title>Big &amp; News</news:title></news:news></url></urlset>');
  assert.equal(us.entries[0].url, "https://a.com/x?a=1&b=2");
  assert.equal(us.entries[0].title, "", "image titles are not page titles");
  assert.equal(us.entries[1].title, "Big & News");
  const rss = parseFeed('<rss><channel><atom:link href="https://a.com/feed" rel="self"/><item><title><![CDATA[Hello <b>world</b>]]></title><link>https://a.com/hello</link><description>&lt;p&gt;Intro text&lt;/p&gt;</description><pubDate>Tue, 01 Sep 2026 08:00:00 +0000</pubDate></item></channel></rss>');
  assert.deepEqual(rss.entries[0], { url: "https://a.com/hello", lastmod: "2026-09-01", title: "Hello world", description: "Intro text" });
  const atom = parseFeed('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Post</title><link rel="alternate" href="https://a.com/post"/><updated>2026-07-04T00:00:00Z</updated><summary>Sum</summary></entry></feed>');
  assert.equal(atom.entries[0].url, "https://a.com/post");
  const txt = parseFeed("https://a.com/1\nhttps://a.com/2\n");
  assert.equal(txt.entries.length, 2);
  assert.deepEqual(feedLinksFromHtml('<link rel="alternate" type="application/rss+xml" href="/feed/">', "https://a.com/"), ["https://a.com/feed/"]);
  assert.deepEqual(pageMeta('<title>T &amp; T</title><meta name="description" content="D">'), { title: "T & T", description: "D" });
});

test("filters: keyword, paths, dates, folders", () => {
  const e = [
    { url: "https://a.com/blog/maintenance-backlog-guide", lastmod: "2026-09-01", title: "" },
    { url: "https://a.com/case-studies/acme", lastmod: "2025-01-01", title: "How Acme cut downtime" },
    { url: "https://a.com/pricing", lastmod: "", title: "" },
  ];
  assert.equal(filterEntries(e, { keywords: ["maintenance backlog"] }).rows.length, 1);
  assert.equal(filterEntries(e, { keywords: ["downtime"] }).rows.length, 1, "matches the title too");
  assert.equal(filterEntries(e, { paths: ["(case-stud|customers?)"] }).rows.length, 1);
  const since = filterEntries(e, { since: "2026-01-01" });
  assert.equal(since.rows.length, 1);
  assert.equal(since.noDate, 1);
  assert.deepEqual(folderCounts(e).map((f) => f.folder).sort(), ["/blog/", "/case-studies/", "/pricing/"]);
});

test("recipes are complete and never OR intitle, inurl or intext", () => {
  const ids = new Set();
  for (const r of RECIPES) {
    assert.ok(!ids.has(r.id), "unique id " + r.id);
    ids.add(r.id);
    assert.ok(TEAMS[r.team], r.id + " team");
    assert.ok(["competitors", "own", "none"].includes(r.scope), r.id + " scope");
    assert.ok(["required", "optional", "none", "two"].includes(r.keyword), r.id + " keyword");
    const custom = r.google.custom || "";
    assert.ok(!/(intitle|inurl|intext):\S+\s+OR\s+(intitle|inurl|intext):/i.test(custom), r.id + " has an OR group of operators");
    for (const p of (r.sitemap && r.sitemap.paths) || []) new RegExp(p, "i");
    const qs = buildQueries(googleOptions(r, { keywords: ["alpha", "beta"], targets: ["x.com"], own: ["mine.com"] }));
    assert.ok(qs.length > 0, r.id + " builds a query");
    assert.ok(qs.every((q) => !q.query.includes("{")), r.id + " leaves no placeholder");
  }
  for (const k of Object.keys(APP_PRESETS)) assert.ok(ids.has(k), "preset maps to a recipe: " + k);
});
