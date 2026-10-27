// Writes the recipe catalog from src/core/recipes.js into
// docs/RECIPES.md and the skill's references/recipes.md, so they never drift.
import { writeFile } from "node:fs/promises";
import { RECIPES, TEAMS, APP_PRESETS, STARTERS } from "../src/core/recipes.js";

const kw = { required: "needed", optional: "optional", none: "none", two: "two keywords" };
const scope = { competitors: "competitors", own: "your own", none: "not needed" };

let md = "# Recipes\n\nGenerated from `src/core/recipes.js`. Run `npm run docs:recipes` after changing recipes.\n\n" +
  "Source **sitemap** means the recipe reads each site's own sitemap and feeds, and falls back to Google links when a site has none. " +
  "Source **links** means the recipe looks at other websites, so it always gives Google links for you to open.\n";

md += "\n## Start here\n\nOne good first recipe per team. `list-recipes` shows these first.\n\n| Team | Recipe | What it finds |\n| --- | --- | --- |\n";
for (const id of STARTERS) {
  const r = RECIPES.find((x) => x.id === id);
  md += `| ${TEAMS[r.team]} | \`${r.id}\` | ${r.finds} |\n`;
}

for (const [team, label] of Object.entries(TEAMS)) {
  md += `\n## ${label}\n\n| Recipe | What it finds | Source | Keyword | Domains | Web app preset |\n| --- | --- | --- | --- | --- | --- |\n`;
  for (const r of RECIPES.filter((x) => x.team === team)) {
    md += `| \`${r.id}\` | ${r.finds} | ${r.sitemap ? "sitemap" : "links"} | ${kw[r.keyword]} | ${scope[r.scope]} | ${APP_PRESETS[r.id] || ""} |\n`;
  }
}

await writeFile(new URL("../docs/RECIPES.md", import.meta.url), md);
await writeFile(new URL("../skill/site-search-opener-by-bestseo-tips/references/recipes.md", import.meta.url), md);
console.log(`Wrote ${RECIPES.length} recipes.`);
