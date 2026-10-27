# Changelog

## 1.1.1 (2026-10-27)

- The npm package no longer includes `THIRD_PARTY_NOTICES.md`. That file lists the licenses of code inside the plugin's bundled server, which is not part of the npm package. It stays in this repository, and NOTICE now says so.
- README: the user agent is shown without a fixed version number, so it no longer goes out of date.

## 1.1.0 (2026-10-27)

- `list-recipes` now starts with a short "start here" list: one good first recipe per team, plus how many more each team has. Ask for a team, or set `all`, for the full list.
- Published on npm as `site-search-opener-mcp`, so the install command is now `npx -y site-search-opener-mcp`.
- Listed in the official MCP Registry as `io.github.albertalbs/site-search-opener-mcp`.

## 1.0.0 (2026-10-26)

First release.

- MCP server with six tools: `list-recipes`, `run-recipe`, `site-inventory`, `google-links`, `check-urls` and `build-project-file`, plus `save-file` in the local version.
- 34 research recipes for seven teams: SEO and content, product, sales, PR, customer research, HR, and link building.
- Reads sitemap indexes, sitemaps (also `.xml.gz` and plain text), RSS and Atom feeds. Follows robots.txt (RFC 9309), including Crawl-delay.
- Falls back to Google site: search links when a site has no usable sitemap, and points to the web app at https://bestseo.tips/tools/site-search-opener/.
- Project files in the same format as the web app, with every domain checked first.
- Runs locally over stdio, or on Cloudflare Workers (free plan works).
- Agent skill and Claude Code plugin with team slash commands.
