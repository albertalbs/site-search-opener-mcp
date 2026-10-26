// Project files in the same format the web app exports and imports:
// { app: "sitesearch-opener", version: 2, projects: [{ name, own, competitors }] }

import { normalizeTarget, isValidTarget, splitTarget, dedupeTargets } from "./domains.js";
import { VERSION } from "./http.js";

// One reachability check for a domain, folder or full URL. This is a single
// request to a page the user named, like typing it into a browser, so it does
// not read robots.txt. Nothing is crawled here.
export async function checkOne(fetcher, input) {
  const raw = String(input || "").trim();
  const isUrl = /^https?:\/\//i.test(raw);
  const target = normalizeTarget(raw);
  if (!isValidTarget(target)) return { input: raw, target, status: "", ok: false, final_url: "", note: "not a valid domain, folder or URL" };
  const { host, path } = splitTarget(target);
  const first = isUrl ? raw : "https://" + host + path;

  let res = await fetcher.request(first, { method: "HEAD" });
  if (!res.ok && [0, 403, 405, 501].includes(res.status)) res = await fetcher.request(first, { maxBytes: 64_000 });
  if (res.status === 0 && !isUrl) {
    const plain = await fetcher.request("http://" + host + path, { maxBytes: 64_000 });
    if (plain.status) res = plain;
  }
  const status = res.status ? [...res.chain, res.status].join(" > ") : "error: " + res.error;
  const ok = res.status >= 200 && res.status < 300;
  let note = "";
  let finalTarget = target;
  if (ok && res.url) {
    const landed = normalizeTarget(res.url);
    const landedHost = landed.split("/")[0];
    if (landedHost !== host) {
      note = "redirects to " + landedHost;
      finalTarget = path === "/" ? landedHost : landedHost + path;
    }
  } else if (!ok) {
    note = res.status ? "did not return 200" : "could not be reached";
  }
  return { input: raw, target: finalTarget, status, ok, final_url: res.url || "", note };
}

export async function checkMany(fetcher, inputs, limit) {
  const rows = [];
  for (const x of inputs.slice(0, limit)) rows.push(await checkOne(fetcher, x));
  return rows;
}

// projects: [{ name, own: [], competitors: [] }]
// existing: an earlier project file to merge into (optional)
export async function buildProjectsFile(fetcher, projects, { validate = true, existing = null, limit = 200 } = {}) {
  const report = [];
  const out = [];
  const byName = new Map();
  if (existing && Array.isArray(existing.projects)) {
    for (const p of existing.projects) {
      const copy = { name: String(p.name || "Project"), own: dedupeTargets(p.own), competitors: dedupeTargets(p.competitors) };
      byName.set(copy.name.toLowerCase(), copy);
      out.push(copy);
    }
  }
  let checked = 0;
  for (const p of projects) {
    const name = String(p.name || "Project").trim() || "Project";
    let proj = byName.get(name.toLowerCase());
    if (!proj) { proj = { name, own: [], competitors: [] }; byName.set(name.toLowerCase(), proj); out.push(proj); }
    for (const list of ["own", "competitors"]) {
      for (const input of p[list] || []) {
        let target = normalizeTarget(input);
        if (!isValidTarget(target)) { report.push({ project: name, list, input, status: "", result: "skipped: not a valid domain" }); continue; }
        let status = "not checked";
        if (validate) {
          if (checked >= limit) { report.push({ project: name, list, input, status: "", result: "skipped: check limit reached" }); continue; }
          checked++;
          const r = await checkOne(fetcher, input);
          status = r.status;
          if (!r.ok) { report.push({ project: name, list, input, status, result: "skipped: " + r.note }); continue; }
          target = r.target;
        }
        if (list === "competitors" && proj.own.includes(target)) { report.push({ project: name, list, input, status, result: "skipped: already in own list" }); continue; }
        if (proj[list].includes(target)) { report.push({ project: name, list, input, status, result: "skipped: duplicate" }); continue; }
        if (list === "own") proj.competitors = proj.competitors.filter((t) => t !== target);
        proj[list].push(target);
        report.push({ project: name, list, input, status, result: target === normalizeTarget(input) ? "added" : "added as " + target });
      }
    }
  }
  const file = {
    app: "sitesearch-opener",
    version: 2,
    generator: "Site Search Opener MCP " + VERSION + " by bestSEO.tips (https://bestseo.tips/)",
    created: new Date().toISOString().slice(0, 10),
    projects: out,
  };
  return { file, report };
}

export function parseProjectsJson(text) {
  if (!text) return null;
  const d = typeof text === "string" ? JSON.parse(text) : text;
  if (!d || !Array.isArray(d.projects)) throw new Error("This JSON has no projects list. Export it from the web app with Export > All projects (JSON).");
  return d;
}
