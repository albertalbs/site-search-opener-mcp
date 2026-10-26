// Builds the Claude plugin:
// 1. copies the skill into plugin/skills/
// 2. bundles the local server into one file, plugin/server/site-search-opener.mjs,
//    so the plugin runs with plain `node` on Windows, macOS and Linux
// 3. writes THIRD_PARTY_NOTICES.md for the code inside that bundle
import { cp, rm, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { build } from "esbuild";

const root = new URL("../", import.meta.url);
const skill = "skill/site-search-opener-by-bestseo-tips";

await rm(new URL("plugin/skills/", root), { recursive: true, force: true });
await mkdir(new URL("plugin/skills/", root), { recursive: true });
await cp(new URL(skill + "/", root), new URL("plugin/skills/site-search-opener-by-bestseo-tips/", root), { recursive: true });

const result = await build({
  entryPoints: [new URL("src/stdio.js", root).pathname.replace(/^\/([A-Za-z]:)/, "$1")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  outfile: new URL("plugin/server/site-search-opener.mjs", root).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
  banner: { js: "// Site Search Opener MCP, bundled. Source: https://github.com/albertalbs/site-search-opener-mcp\nimport { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  legalComments: "none",
  metafile: true,
  logLevel: "warning",
});

// Collect the packages that ended up in the bundle and their licenses.
const pkgs = new Map();
for (const input of Object.keys(result.metafile.inputs)) {
  const m = input.replace(/\\/g, "/").match(/node_modules\/((?:@[^/]+\/)?[^/]+)\//);
  if (m) pkgs.set(m[1], true);
}
let notices = "# Third-party notices\n\n`plugin/server/site-search-opener.mjs` is a bundle that includes the open source packages below. " +
  "Each keeps its own license. The full license texts follow.\n\n| Package | Version | License |\n| --- | --- | --- |\n";
const texts = [];
for (const name of [...pkgs.keys()].sort()) {
  const dir = new URL("node_modules/" + name + "/", root);
  const pj = JSON.parse(await readFile(new URL("package.json", dir), "utf8"));
  const license = typeof pj.license === "string" ? pj.license : (pj.license && pj.license.type) || "see package";
  notices += `| ${name} | ${pj.version} | ${license} |\n`;
  const file = (await readdir(dir)).find((f) => /^licen[cs]e/i.test(f));
  if (file) texts.push(`## ${name} ${pj.version}\n\n\`\`\`\n${(await readFile(new URL(file, dir), "utf8")).trim()}\n\`\`\`\n`);
}
await writeFile(new URL("THIRD_PARTY_NOTICES.md", root), notices + "\n" + texts.join("\n"));
console.log(`Plugin built. Bundle includes ${pkgs.size} packages.`);
