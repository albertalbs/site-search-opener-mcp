# Recipes

Generated from `src/core/recipes.js`. Run `npm run docs:recipes` after changing recipes.

Source **sitemap** means the recipe reads each site's own sitemap and feeds, and falls back to Google links when a site has none. Source **links** means the recipe looks at other websites, so it always gives Google links for you to open.

## SEO and content

| Recipe | What it finds | Source | Keyword | Domains | Web app preset |
| --- | --- | --- | --- | --- | --- |
| `content-gap` | Pages on each competitor whose URL or title matches your keyword. | sitemap | needed | competitors | Identify content gaps in competitor domains |
| `url-taxonomy` | How each competitor organises content: folder counts plus pages in blog, resources, guides, academy and similar hubs. | sitemap | optional | competitors | Identify content resources and URL taxonomy |
| `publishing-velocity` | Pages added or updated in the last 90 days (change it with since). | sitemap | optional | competitors | Track competitor content publishing velocity |
| `bofu-pages` | Bottom-of-funnel pages: vs, alternatives, compare, review and best-of pages. | sitemap | optional | competitors | Reverse-engineer BOFU title patterns |
| `gated-assets` | PDFs, spreadsheets, ebooks, templates, checklists and reports. | sitemap | optional | competitors | Identify gated assets and downloads |
| `glossary-pages` | What-is, glossary and definition pages. Good for answer-engine coverage. | sitemap | optional | competitors |  |
| `semantic-depth` | Pages where two terms appear near each other. Give two keywords. | links | two keywords | competitors | Audit semantic depth with AROUND |
| `cannibalization` | Several of your own pages targeting the same keyword. | sitemap | needed | your own |  |
| `refresh-candidates` | Your pages not updated in the last 12 months. | sitemap | optional | your own |  |
| `duplicate-content` | Your pages that contain the exact sentence you paste. | links | needed | your own | Find duplicate content on your site |
| `copied-content` | Other websites that use the exact sentence you paste. | links | needed | not needed |  |
| `subdomains` | Subdomains Google has indexed for your site, www left out. | links | none | your own | Show indexed subdomains, exclude www |

## Product and competitive intel

| Recipe | What it finds | Source | Keyword | Domains | Web app preset |
| --- | --- | --- | --- | --- | --- |
| `feature-launches` | Launch, release and announcement pages from the last 6 months. | sitemap | optional | competitors |  |
| `integrations` | Integration, partner, marketplace and app pages. | sitemap | optional | competitors |  |
| `pricing` | Pricing, plans and editions pages. | sitemap | none | competitors |  |
| `release-notes` | Changelog, release notes and what's new pages, subdomains included. | sitemap | optional | competitors |  |
| `docs-help` | Documentation, help, support and developer pages, subdomains included. | sitemap | optional | competitors |  |
| `security-trust` | Security, trust, privacy and compliance pages (SOC 2, ISO 27001, GDPR, HIPAA). | sitemap | none | competitors |  |

## Sales and marketing

| Recipe | What it finds | Source | Keyword | Domains | Web app preset |
| --- | --- | --- | --- | --- | --- |
| `case-studies` | Case study, customer story and testimonial pages. Add an industry as the keyword to narrow it. | sitemap | optional | competitors | Find case studies and proof points |
| `comparison-pages` | vs, alternative and compare pages. Use your brand as the keyword. | sitemap | optional | competitors |  |
| `webinars-events` | Webinar, event, on-demand and conference pages. | sitemap | optional | competitors |  |
| `review-sites` | Review pages for a product or brand on the big review sites. | links | needed | not needed |  |

## PR and brand

| Recipe | What it finds | Source | Keyword | Domains | Web app preset |
| --- | --- | --- | --- | --- | --- |
| `newsroom` | Press, news, newsroom and media pages. | sitemap | optional | competitors |  |
| `brand-mentions` | Pages that mention a brand, outside your own site. | links | needed | not needed | Filter out a brand domain |
| `press-wires` | Press releases on PR Newswire, Business Wire and GlobeNewswire. | links | needed | not needed |  |

## Customer research

| Recipe | What it finds | Source | Keyword | Domains | Web app preset |
| --- | --- | --- | --- | --- | --- |
| `forum-threads` | Discussions about a topic, product or pain point. | links | needed | not needed |  |
| `help-center-topics` | Help and support articles that match your keyword. Shows what customers struggle with. | sitemap | needed | competitors |  |

## HR and talent

| Recipe | What it finds | Source | Keyword | Domains | Web app preset |
| --- | --- | --- | --- | --- | --- |
| `careers-pages` | Careers, jobs and hiring pages, subdomains included. | sitemap | optional | competitors |  |
| `hiring-signals` | Job posts for a company on Greenhouse, Lever, Ashby and LinkedIn. Use the company name. | links | needed | not needed |  |

## Link building and outreach

| Recipe | What it finds | Source | Keyword | Domains | Web app preset |
| --- | --- | --- | --- | --- | --- |
| `guest-post-sites` | Write-for-us pages on your topic. | links | needed | not needed |  |
| `sponsored-post-sites` | Pages on your topic that carry a sponsored post label. | links | needed | not needed | Find sponsored-post opportunities |
| `resource-pages` | Resource and links pages on your topic. | links | needed | not needed |  |
| `infographic-sites` | Infographic pages on your topic. | links | needed | not needed | Find sites to pitch infographics |
| `social-profiles` | LinkedIn, X and Facebook profiles for a name. | links | needed | not needed | Find social profiles for outreach |
