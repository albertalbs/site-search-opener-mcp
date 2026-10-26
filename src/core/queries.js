// Builds Google site: queries the same way the web app does, plus one fix
// the app does not have yet: Google returns nothing for an OR group of inurl:
// terms (tested Oct 2026), so several keywords with inurl: become one query
// per keyword instead of one OR group.

import { normalizeTarget } from "./domains.js";

export const OPERATORS = ["intitle", "allintitle", "inurl", "allinurl", "intext", "allintext", "none"];
export const TOOL_PAGE = "https://bestseo.tips/tools/site-search-opener/";

export function coreFor(k, op, exact) {
  if (op === "none") return exact ? '"' + k + '"' : k;
  if (op.indexOf("all") === 0) return op + ":" + (exact ? k.split(" ").map((w) => '"' + w + '"').join(" ") : k);
  return op + ":" + (exact ? '"' + k + '"' : k);
}

export function cleanKeywords(input) {
  const raw = Array.isArray(input) ? input : String(input == null ? "" : input).split(/[\n,]+/);
  return raw.map((s) => String(s).trim().replace(/\s+/g, " ")).filter(Boolean);
}

function fill(template, vars) {
  return template.replace(/\{(kw|kw1|kw2|own|site|year|since)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
}

// opts: { keywords, operator, exact, targets, exclude, filetype, custom, after, before, own }
// Returns [{ target, query }]. target is "" for queries that run once (bare).
export function buildQueries(opts) {
  const op = OPERATORS.includes(opts.operator) ? opts.operator : "intitle";
  const exact = opts.exact !== false;
  let kws = cleanKeywords(opts.keywords);
  if (op.indexOf("all") === 0) kws = kws.slice(0, 1);
  const quoted = (k) => exact && k.indexOf('"') === -1;
  const cores = kws.map((k) => coreFor(k, op, quoted(k)));

  // one group per query, except inurl:, which Google cannot OR
  let groups;
  if (cores.length > 1 && op === "inurl") groups = cores;
  else if (cores.length > 1) groups = ["(" + cores.join(" OR ") + ")"];
  else groups = [cores[0] || ""];

  const excl = cleanKeywords(opts.exclude).flatMap((w) => w.split(" ")).filter(Boolean).map((w) => "-" + w).join(" ");
  const ft = opts.filetype ? "filetype:" + String(opts.filetype).replace(/^\./, "") : "";
  const after = opts.after ? "after:" + opts.after : "";
  const before = opts.before ? "before:" + opts.before : "";
  const vars = {
    kw: kws[0] || "", kw1: kws[0] || "", kw2: kws[1] || kws[0] || "",
    own: (opts.own || [])[0] ? normalizeTarget(opts.own[0]).split("/")[0] : "",
    year: String(new Date().getFullYear()), since: opts.after || "",
  };
  // an empty {own} leaves a bare "-site:" behind, which would break the query
  const custom = opts.custom
    ? fill(String(opts.custom).trim().replace(/\s+/g, " "), vars).replace(/-site:(?=\s|$)/g, "").replace(/\s+/g, " ").trim()
    : "";
  const skipCore = Boolean(opts.skipCore);
  const out = [];

  for (const core of groups) {
    const tail = [skipCore ? "" : core, excl, ft, custom, after, before].filter(Boolean).join(" ");
    if (opts.bare) {
      if (tail.trim()) out.push({ target: "", query: tail.trim() });
      continue;
    }
    for (const raw of opts.targets || []) {
      const t = normalizeTarget(raw);
      if (!t) continue;
      // {site} in the template means "folder group per domain", no site: prefix
      if (custom.includes("{site}")) {
        out.push({ target: t, query: tail.split("{site}").join(t.replace(/\/+$/, "")).trim() });
      } else {
        out.push({ target: t, query: ("site:" + t + (tail ? " " + tail : "")).trim() });
      }
    }
  }
  return out;
}

export function searchUrl(query, engine) {
  const q = encodeURIComponent(query);
  return engine === "bing" ? "https://www.bing.com/search?q=" + q : "https://www.google.com/search?q=" + q;
}
