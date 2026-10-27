# Site Search Opener MCP

Research your own site and many competitor sites from inside your AI app. Ask a question in plain words, and get a table of real pages: URL, title, description, last modified date and HTTP status.

It reads what websites publish for search engines: their sitemaps and RSS or Atom feeds. It checks robots.txt first, goes slowly, and says who it is. When a site has nothing to read, you get Google search links to open in your own browser instead.

Works with Claude (Desktop, Code and claude.ai), ChatGPT, Gemini CLI, Gemini Enterprise, OpenAI Codex, Cursor, VS Code with GitHub Copilot, Windsurf and any other app that supports MCP.

This is the AI companion to the free **[Site Search Opener web app](https://bestseo.tips/tools/site-search-opener/)** by bestSEO.tips. Project files move between the two.

- [Install guide](docs/INSTALL.md)
- [All recipes](docs/RECIPES.md)
- [Host your own copy on Cloudflare](docs/HOSTING-CLOUDFLARE.md)

---

## What you can ask

> Which of my competitors have pages about maintenance backlog? Show me a table.

> How is competitor.com's content organised? Which folders are biggest?

> What did my competitors publish in the last 90 days?

> Find case studies on rival-a.com and rival-b.com for the food industry.

> Build a project file from the competitors we talked about before, and check they all work.

> Which of my own pages haven't been updated in a year?

> Is anyone on Reddit talking about our product category? Give me links.

## How it works

1. **You ask in plain words.** The AI picks a recipe, such as `content-gap` or `case-studies`, and your domains.
2. **The server reads each site's own files.** robots.txt first, then the sitemaps it lists (or the usual places, like `/sitemap.xml`), then the site's RSS or Atom feed. Pages that robots.txt asks bots to avoid are left out.
3. **You get a table.** Matching pages with URL, title, description, date and HTTP status, plus folder counts or pages per month for some recipes.
4. **No sitemap? You get links.** If a site has no usable sitemap, blocks bots, or nothing matched, the server makes Google site: search links for that site. They open in your browser, the same as typing the search yourself.

What it never does:

- It never searches Google or reads Google results. The links are for you to click.
- It never tries to get past a CAPTCHA, a bot check or a robots.txt rule.
- It never sends your data to bestseo.tips or anyone else. The local version runs on your computer. The hosted version runs in your own Cloudflare account.

Site owners can opt out at any time by adding this to their robots.txt:

```
User-agent: SiteSearchOpenerMCP
Disallow: /
```

## Install

| Way | For | Guide |
| --- | --- | --- |
| Claude Code plugin | Claude Code | `/plugin marketplace add albertalbs/site-search-opener-mcp`, then `/plugin install site-search-opener@bestseo-tips` |
| Local MCP server | Claude Desktop, Claude Code, Gemini CLI, Codex, Cursor, VS Code, Windsurf | [Install guide, section B](docs/INSTALL.md#b-local-mcp-server) |
| Skill | Claude, Codex, Gemini CLI, Cursor, Copilot | [Install guide, section C](docs/INSTALL.md#c-skill-only) |
| Hosted on Cloudflare (free) | claude.ai, ChatGPT, Gemini Enterprise, teams | [Hosting guide](docs/HOSTING-CLOUDFLARE.md) |

The quickest local setup: install Node.js 18.17 or newer, and point your app at:

```
npx -y site-search-opener-mcp
```

Prefer no downloads at start-up? Download this repository once and use `node <folder>/plugin/server/site-search-opener.mjs` instead.

## Tools

| Tool | What it does |
| --- | --- |
| `list-recipes` | Shows a start-here list of recipes, or every recipe for a team |
| `run-recipe` | Runs a recipe across your domains and returns one table, with search links for sites that have no sitemap data |
| `site-inventory` | Lists one site's pages from its sitemap and feeds, with filters for keyword, URL text and dates |
| `google-links` | Makes Google (or Bing) site: search links for you to open |
| `check-urls` | Checks domains or URLs work (HTTP 200) and shows redirects |
| `build-project-file` | Checks your own and competitor domains and builds a project file for the web app |
| `save-file` | Saves a CSV, JSON or Markdown file on your computer (local version only) |

## Recipes

34 recipes for seven teams. Not sure where to begin? Start with one of these:

| Team | Start here | What it finds |
| --- | --- | --- |
| SEO and content | `content-gap` | Competitor pages whose URL or title matches your keyword |
| Product | `feature-launches` | Launch and announcement pages from the last 6 months |
| Sales and marketing | `case-studies` | Case studies and customer stories, narrowed by industry if you like |
| PR and brand | `brand-mentions` | Pages that mention a brand outside its own site |
| Customer research | `forum-threads` | Reddit and Quora discussions on a topic |
| HR and talent | `hiring-signals` | Open roles for a company on the big job boards |
| Link building | `guest-post-sites` | Write-for-us pages on your topic |

Everything, by team:

| Team | Recipes |
| --- | --- |
| SEO and content | content gap, URL structure, publishing activity, comparison pages, gated assets, glossary pages, cannibalization, refresh candidates |
| Product | feature launches, integrations, pricing, release notes, docs depth, security and compliance pages |
| Sales and marketing | case studies, pages that name you, webinars, review sites |
| PR and brand | newsroom pages, brand mentions, press releases |
| Customer research | Reddit and Quora threads, competitor help articles |
| HR and talent | careers pages, open roles on job boards |
| Link building | guest post sites, sponsored posts, resource pages, infographics, social profiles |

The full list, with what each one reads, is in [docs/RECIPES.md](docs/RECIPES.md).

## Slash commands

In Claude Code with the plugin, type `/site-search-opener:` and pick one:

| Command | Use it for |
| --- | --- |
| `:seo` `:product` `:sales` `:pr` `:research` `:hr` `:links` | Research for that team. Add what you need, for example `/site-search-opener:sales case studies food industry` |
| `:build-project` | Collect your domains from this chat, memory and past chats, check them, and make a project file |
| `:inventory` | List one site's pages, for example `/site-search-opener:inventory competitor.com pricing` |
| `:search-links` | Make search links for a keyword |
| `:help` | A short explanation and the list of commands |

Other apps show the same commands as MCP prompts, usually in a prompt or attachment menu.

## Projects and the web app

A project is a named list of your own domains and competitor domains, in the same JSON format the web app uses:

```json
{
  "app": "sitesearch-opener",
  "version": 2,
  "projects": [
    { "name": "HR software", "own": ["linkedin.com"], "competitors": ["indeed.com", "xing.com"] }
  ]
}
```

- Ask the AI to build one. It can collect domains you mentioned before, check each one returns HTTP 200, and follow redirects.
- Import it in the web app: open https://bestseo.tips/tools/site-search-opener/, go to Settings, then Export/Import Projects, then Import.
- Export from the web app and hand the file to the AI, so it uses the same lists.

## Limits

| | Local | Hosted, Cloudflare free plan |
| --- | --- | --- |
| Domains per call | 30 | 4 |
| Sitemap files per domain | 30 | 4 |
| Pages with title and status fetched | 10 per domain by default, up to 100 | off by default, up to 20 |
| Domain checks per call | 200 | 12 |

The local version waits at least one second between requests to the same site, longer if the site's robots.txt asks for a Crawl-delay.

## Privacy and safety

- The server only fetches public `http` and `https` addresses. It refuses local and private network addresses, and redirects that lead to them.
- Requests carry the user agent `SiteSearchOpenerMCP/1.0 (+https://github.com/albertalbs/site-search-opener-mcp)`.
- Downloads are capped in size and time.
- Text from websites is passed to the AI as data, and the AI is told not to follow instructions inside it.

See [SECURITY.md](SECURITY.md) for more.

## Questions

**Why doesn't it just search Google for me?**
Google's terms do not allow automated searches, and it blocks them. Sitemaps are published so machines can read them, so that is what this tool reads. For Google results, it gives you the links.

**Does it use bestseo.tips servers?**
No. The local version runs on your computer. The hosted version runs in your Cloudflare account. bestseo.tips only hosts the web app.

**Why does a site show links instead of a table?**
Either the site has no sitemap or feed the tool can find, robots.txt asks bots to stay away, or nothing matched your filters. The links still let you check it yourself.

**Why do I need a project file?**
You don't, but it saves typing the same 20 competitors every time, and the web app reads the same file.

## Development

```bash
npm install
npm test                 # unit tests and MCP protocol tests
npm run build            # rebuilds plugin/server/site-search-opener.mjs and copies the skill
npm run docs:recipes     # rebuilds docs/RECIPES.md from src/core/recipes.js
npx wrangler dev         # runs the Cloudflare version locally
```

Layout:

```
src/core/      shared logic: domains, queries, recipes, robots.txt, feeds, inventory, projects
src/server.js  the MCP server, shared by local and hosted versions
src/stdio.js   local version (adds save-file)
worker/        Cloudflare Workers version
skill/         the Agent Skill
plugin/        the Claude Code plugin (commands, skill copy, bundled server)
docs/          install, hosting and recipe guides
test/          tests, with a fake internet so they never touch real sites
```

Contributions are welcome, especially new recipes. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License and credits

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

If you share or build on this project, keep the NOTICE file with it, as the license asks. A link back is appreciated.

Created by **Albert Adaikkalam**, [bestSEO.tips](https://bestseo.tips/). LinkedIn: https://www.linkedin.com/in/albertalbs/

Third-party packages in the bundled server are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
