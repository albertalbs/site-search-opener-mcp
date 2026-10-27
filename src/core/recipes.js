// Ready-made research recipes, grouped by team.
//
// Every recipe has two halves:
//   sitemap: how to filter a domain's own sitemap or feed (the main data source)
//   google:  the fallback query the user can open in their own browser
// A recipe with sitemap: null is Google-only by nature (it looks at other
// websites, like Reddit or job boards), so it always returns links.
//
// Query rule learned the hard way: never OR intitle:, inurl: or intext: terms.
// Google returns nothing for those. OR between site: terms and filetype: works.

export const TEAMS = {
  seo: "SEO and content",
  product: "Product and competitive intel",
  sales: "Sales and marketing",
  pr: "PR and brand",
  research: "Customer research",
  hr: "HR and talent",
  links: "Link building and outreach",
};

const HUBS = "(blog|resources|guides|learn|learning-center|insights|articles|library|academy|knowledge-base|glossary|hub)";
const siteGroup = (folders) => "(" + folders.map((f) => "site:{site}/" + f).join(" OR ") + ")";

export const RECIPES = [
  // SEO and content
  { id: "content-gap", team: "seo", title: "Who already covers a topic",
    finds: "Pages on each competitor whose URL or title matches your keyword.",
    scope: "competitors", keyword: "required",
    sitemap: { keyword: true },
    google: { operator: "intitle", exact: true } },
  { id: "url-taxonomy", team: "seo", title: "Content hubs and URL structure",
    finds: "How each competitor organises content: folder counts plus pages in blog, resources, guides, academy and similar hubs.",
    scope: "competitors", keyword: "optional",
    sitemap: { paths: ["/" + HUBS + "(/|$)"], folders: true },
    google: { operator: "none", exact: false, custom: siteGroup(["blog", "resources", "guides", "learn", "learning-center", "insights", "articles", "library", "academy", "knowledge-base", "glossary", "hub"]) } },
  { id: "publishing-velocity", team: "seo", title: "What competitors published lately",
    finds: "Pages added or updated in the last 90 days (change it with since).",
    scope: "competitors", keyword: "optional",
    sitemap: { sinceDays: 90, keyword: true, months: true },
    google: { operator: "none", exact: false, afterDays: 90 } },
  { id: "bofu-pages", team: "seo", title: "Comparison, alternative and review pages",
    finds: "Bottom-of-funnel pages: vs, alternatives, compare, review and best-of pages.",
    scope: "competitors", keyword: "optional",
    sitemap: { paths: ["(^|[/-])(vs|versus|alternative|alternatives|compare|comparison|review|reviews|best)([/-]|$)"], keyword: true },
    google: { operator: "none", exact: false, custom: 'allintitle:"vs" OR "alternative" OR "review" OR "best"' } },
  { id: "gated-assets", team: "seo", title: "Gated assets and downloads",
    finds: "PDFs, spreadsheets, ebooks, templates, checklists and reports.",
    scope: "competitors", keyword: "optional",
    sitemap: { paths: ["\\.(pdf|xlsx|xls|docx|pptx)$", "(ebook|e-book|whitepaper|white-paper|template|toolkit|checklist|report|download)"], keyword: true },
    google: { operator: "none", exact: false, custom: "(filetype:pdf OR filetype:xlsx OR filetype:docx)" } },
  { id: "glossary-pages", team: "seo", title: "Glossary and definition pages",
    finds: "What-is, glossary and definition pages. Good for answer-engine coverage.",
    scope: "competitors", keyword: "optional",
    sitemap: { paths: ["/(glossary|definitions?|dictionary|terms)(/|$)", "what-is"], keyword: true },
    google: { operator: "none", exact: true, custom: 'intitle:"what is"' } },
  { id: "semantic-depth", team: "seo", title: "Two concepts close together (AROUND)",
    finds: "Pages where two terms appear near each other. Give two keywords.",
    scope: "competitors", keyword: "two",
    sitemap: null,
    google: { operator: "none", exact: false, skipCore: true, custom: '"{kw1}" AROUND(5) "{kw2}"' } },
  { id: "cannibalization", team: "seo", title: "Your pages competing with each other",
    finds: "Several of your own pages targeting the same keyword.",
    scope: "own", keyword: "required",
    sitemap: { keyword: true },
    google: { operator: "intitle", exact: true } },
  { id: "refresh-candidates", team: "seo", title: "Your pages due for a refresh",
    finds: "Your pages not updated in the last 12 months.",
    scope: "own", keyword: "optional",
    sitemap: { olderThanDays: 365, keyword: true },
    google: { operator: "none", exact: false, beforeDays: 365 } },
  { id: "duplicate-content", team: "seo", title: "Duplicate copy on your site",
    finds: "Your pages that contain the exact sentence you paste.",
    scope: "own", keyword: "required",
    sitemap: null,
    google: { operator: "none", exact: true } },
  { id: "copied-content", team: "seo", title: "Your copy used on other sites",
    finds: "Other websites that use the exact sentence you paste.",
    scope: "none", keyword: "required",
    sitemap: null,
    google: { operator: "none", exact: true, bare: true, custom: "-site:{own}" } },
  { id: "subdomains", team: "seo", title: "Your indexed subdomains",
    finds: "Subdomains Google has indexed for your site, www left out.",
    scope: "own", keyword: "none",
    sitemap: null,
    google: { operator: "none", exact: false, custom: "-inurl:www" } },

  // Product and competitive intel
  { id: "feature-launches", team: "product", title: "New feature launches",
    finds: "Launch, release and announcement pages from the last 6 months.",
    scope: "competitors", keyword: "optional",
    sitemap: { sinceDays: 180, paths: ["(blog|news|press|newsroom|announc|launch|introduc|release|whats-new|what-s-new|product-update|updates)"], keyword: true },
    google: { operator: "none", exact: false, custom: '"introducing"', afterDays: 180 } },
  { id: "integrations", team: "product", title: "Integrations and partners",
    finds: "Integration, partner, marketplace and app pages.",
    scope: "competitors", keyword: "optional",
    sitemap: { paths: ["/(integrations?|partners?|marketplace|apps|connectors?|ecosystem)(/|$)"], keyword: true },
    google: { operator: "none", exact: false, custom: siteGroup(["integrations", "partners", "marketplace", "apps"]) } },
  { id: "pricing", team: "product", title: "Pricing and packaging",
    finds: "Pricing, plans and editions pages.",
    scope: "competitors", keyword: "none",
    sitemap: { paths: ["/(pricing|plans|editions|packages|buy)(/|$)"] },
    google: { operator: "none", exact: false, custom: siteGroup(["pricing", "plans"]) } },
  { id: "release-notes", team: "product", title: "Release notes and changelogs",
    finds: "Changelog, release notes and what's new pages, subdomains included.",
    scope: "competitors", keyword: "optional",
    sitemap: { paths: ["(changelog|release-notes|releases|whats-new|what-s-new|product-updates)"], keyword: true, subdomains: ["docs", "help", "changelog", "updates"] },
    google: { operator: "none", exact: false, custom: siteGroup(["changelog", "release-notes", "releases", "whats-new"]) } },
  { id: "docs-help", team: "product", title: "Docs and help center depth",
    finds: "Documentation, help, support and developer pages, subdomains included.",
    scope: "competitors", keyword: "optional",
    sitemap: { paths: ["/(docs|documentation|help|support|kb|knowledge-base|developers?|api)(/|$)"], keyword: true, subdomains: ["docs", "help", "support", "developers"], folders: true },
    google: { operator: "none", exact: false, custom: siteGroup(["docs", "help", "support", "developers"]) } },
  { id: "security-trust", team: "product", title: "Security and compliance pages",
    finds: "Security, trust, privacy and compliance pages (SOC 2, ISO 27001, GDPR, HIPAA).",
    scope: "competitors", keyword: "none",
    sitemap: { paths: ["/(security|trust|compliance|privacy|gdpr|soc-?2|iso-?27001|hipaa)(/|-|$)"], subdomains: ["trust", "security"] },
    google: { operator: "none", exact: false, custom: siteGroup(["security", "trust", "compliance"]) } },

  // Sales and marketing
  { id: "case-studies", team: "sales", title: "Case studies and proof points",
    finds: "Case study, customer story and testimonial pages. Add an industry as the keyword to narrow it.",
    scope: "competitors", keyword: "optional",
    sitemap: { paths: ["(case-stud|customers?|customer-stor|success-stor|stories|testimonials)"], keyword: true },
    google: { operator: "none", exact: false, custom: siteGroup(["case-studies", "case-study", "customers", "customer-stories", "success-stories", "stories"]) } },
  { id: "comparison-pages", team: "sales", title: "Competitor pages that name you",
    finds: "vs, alternative and compare pages. Use your brand as the keyword.",
    scope: "competitors", keyword: "optional",
    sitemap: { paths: ["(^|[/-])(vs|versus|alternative|alternatives|compare|comparison)([/-]|$)"], keyword: true },
    google: { operator: "none", exact: true, custom: "intitle:vs" } },
  { id: "webinars-events", team: "sales", title: "Webinars and events",
    finds: "Webinar, event, on-demand and conference pages.",
    scope: "competitors", keyword: "optional",
    sitemap: { paths: ["/(webinars?|events?|on-demand|conferences?|summit|workshops?)(/|-|$)"], keyword: true },
    google: { operator: "none", exact: false, custom: siteGroup(["webinars", "events"]) } },
  { id: "review-sites", team: "sales", title: "Reviews on G2, Capterra and similar",
    finds: "Review pages for a product or brand on the big review sites.",
    scope: "none", keyword: "required",
    sitemap: null,
    google: { operator: "none", exact: true, bare: true, custom: "(site:g2.com OR site:capterra.com OR site:trustradius.com OR site:gartner.com)" } },

  // PR and brand
  { id: "newsroom", team: "pr", title: "Competitor newsroom and press pages",
    finds: "Press, news, newsroom and media pages.",
    scope: "competitors", keyword: "optional",
    sitemap: { paths: ["/(press|news|newsroom|media|press-releases?|in-the-news)(/|-|$)"], keyword: true, months: true },
    google: { operator: "none", exact: false, custom: siteGroup(["press", "news", "newsroom"]) } },
  { id: "brand-mentions", team: "pr", title: "Brand mentions on other sites",
    finds: "Pages that mention a brand, outside your own site.",
    scope: "none", keyword: "required",
    sitemap: null,
    google: { operator: "none", exact: true, bare: true, custom: "-site:{own}" } },
  { id: "press-wires", team: "pr", title: "Press releases on newswires",
    finds: "Press releases on PR Newswire, Business Wire and GlobeNewswire.",
    scope: "none", keyword: "required",
    sitemap: null,
    google: { operator: "none", exact: true, bare: true, custom: "(site:prnewswire.com OR site:businesswire.com OR site:globenewswire.com)" } },

  // Customer research
  { id: "forum-threads", team: "research", title: "Reddit and Quora threads",
    finds: "Discussions about a topic, product or pain point.",
    scope: "none", keyword: "required",
    sitemap: null,
    google: { operator: "none", exact: true, bare: true, custom: "(site:reddit.com OR site:quora.com)" } },
  { id: "help-center-topics", team: "research", title: "Competitor help articles on a problem",
    finds: "Help and support articles that match your keyword. Shows what customers struggle with.",
    scope: "competitors", keyword: "required",
    sitemap: { paths: ["/(docs|help|support|kb|knowledge-base|faq|community)(/|$)"], keyword: true, subdomains: ["help", "support", "docs", "community"] },
    google: { operator: "intitle", exact: true, custom: siteGroup(["help", "support", "docs"]) } },

  // HR and talent
  { id: "careers-pages", team: "hr", title: "Competitor careers pages",
    finds: "Careers, jobs and hiring pages, subdomains included.",
    scope: "competitors", keyword: "optional",
    sitemap: { paths: ["/(careers?|jobs?|join-us|join|work-with-us|hiring|vacancies|openings)(/|-|$)"], keyword: true, subdomains: ["careers", "jobs"] },
    google: { operator: "none", exact: false, custom: siteGroup(["careers", "jobs"]) } },
  { id: "hiring-signals", team: "hr", title: "Open roles on job boards",
    finds: "Job posts for a company on Greenhouse, Lever, Ashby and LinkedIn. Use the company name.",
    scope: "none", keyword: "required",
    sitemap: null,
    google: { operator: "none", exact: true, bare: true, custom: "(site:boards.greenhouse.io OR site:jobs.lever.co OR site:jobs.ashbyhq.com OR site:linkedin.com/jobs)" } },

  // Link building and outreach
  { id: "guest-post-sites", team: "links", title: "Sites that accept guest posts",
    finds: "Write-for-us pages on your topic.",
    scope: "none", keyword: "required",
    sitemap: null,
    google: { operator: "none", exact: true, bare: true, custom: '"write for us"' } },
  { id: "sponsored-post-sites", team: "links", title: "Sites that run sponsored posts",
    finds: "Pages on your topic that carry a sponsored post label.",
    scope: "none", keyword: "required",
    sitemap: null,
    google: { operator: "none", exact: true, bare: true, custom: '"sponsored post"' } },
  { id: "resource-pages", team: "links", title: "Resource pages to pitch",
    finds: "Resource and links pages on your topic.",
    scope: "none", keyword: "required",
    sitemap: null,
    google: { operator: "none", exact: true, bare: true, custom: "inurl:resources" } },
  { id: "infographic-sites", team: "links", title: "Sites that publish infographics",
    finds: "Infographic pages on your topic.",
    scope: "none", keyword: "required",
    sitemap: null,
    google: { operator: "none", exact: true, bare: true, custom: "intitle:infographic" } },
  { id: "social-profiles", team: "links", title: "Social profiles of a person",
    finds: "LinkedIn, X and Facebook profiles for a name.",
    scope: "none", keyword: "required",
    sitemap: null,
    google: { operator: "none", exact: true, bare: true, custom: "(site:linkedin.com/in OR site:x.com OR site:twitter.com OR site:facebook.com)" } },
];

// One good first recipe per team, shown before the full list so new users
// are not met with 34 options at once.
export const STARTERS = ["content-gap", "feature-launches", "case-studies", "brand-mentions", "forum-threads", "hiring-signals", "guest-post-sites"];

// The matching option in the web app's "Select Prebuilt Own or Competitor
// Research Search Opener" dropdown, for users who want to click instead.
export const APP_PRESETS = {
  "content-gap": "Identify content gaps in competitor domains",
  "url-taxonomy": "Identify content resources and URL taxonomy",
  "publishing-velocity": "Track competitor content publishing velocity",
  "bofu-pages": "Reverse-engineer BOFU title patterns",
  "gated-assets": "Identify gated assets and downloads",
  "case-studies": "Find case studies and proof points",
  "semantic-depth": "Audit semantic depth with AROUND",
  "brand-mentions": "Filter out a brand domain",
  "sponsored-post-sites": "Find sponsored-post opportunities",
  "social-profiles": "Find social profiles for outreach",
  "infographic-sites": "Find sites to pitch infographics",
  "duplicate-content": "Find duplicate content on your site",
  subdomains: "Show indexed subdomains, exclude www",
};

export function getRecipe(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

export function recipesByTeam(team) {
  return team ? RECIPES.filter((r) => r.team === team) : RECIPES.slice();
}

function daysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

// Turns a recipe's google half into options for buildQueries().
export function googleOptions(recipe, { keywords, targets, own, since, until } = {}) {
  const g = recipe.google;
  return {
    keywords: recipe.keyword === "none" ? [] : keywords,
    operator: g.operator,
    exact: g.exact,
    custom: g.custom || "",
    bare: Boolean(g.bare),
    skipCore: Boolean(g.skipCore),
    targets: g.bare ? [] : targets,
    own,
    after: since || (g.afterDays ? daysAgo(g.afterDays) : ""),
    before: until || (g.beforeDays ? daysAgo(g.beforeDays) : ""),
  };
}
