# Contributing

Thanks for helping. Recipes for new teams and use cases are the most useful additions.

## Set up

```bash
git clone https://github.com/albertalbs/site-search-opener-mcp.git
cd site-search-opener-mcp
npm install
npm test
```

## Adding a recipe

1. Add it to `src/core/recipes.js`. Give it an `id`, a `team`, a short `title`, what it `finds`, the `scope`, whether it needs a `keyword`, the `sitemap` filter and the `google` fallback.
2. Google fallback rule: never OR `intitle:`, `inurl:` or `intext:` terms. Google returns nothing for those. OR between `site:` terms and between `filetype:` terms is fine. The tests check this.
3. Run `npm run docs:recipes` to refresh the recipe docs.
4. Run `npm run build` to refresh the plugin bundle and skill copy.
5. Run `npm test`.

## Ground rules for changes

- The server reads only what sites publish for crawlers: robots.txt, sitemaps and feeds, plus page heads when asked. Keep it that way.
- No code that searches Google or reads Google results, and nothing that gets around bot checks or CAPTCHAs.
- Keep `src/server.js` and `src/core/` free of Node-only modules so the Cloudflare Worker keeps working. File access belongs in `src/stdio.js`.
- Plain, short wording in tool output and docs.

## Pull requests

Describe what changed and why, and include the test output. Small pull requests get reviewed faster.

By contributing, you agree that your contribution is licensed under the Apache License 2.0.
