// Small helpers to turn rows into Markdown tables and CSV.

function cell(v, max) {
  let s = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
  if (max && s.length > max) s = s.slice(0, max - 3).trimEnd() + "...";
  return s.replace(/\|/g, "\\|");
}

export function markdownTable(rows, cols, maxRows = 50) {
  if (!rows.length) return "";
  const head = "| " + cols.map((c) => c.label).join(" | ") + " |";
  const sep = "| " + cols.map(() => "---").join(" | ") + " |";
  const body = rows.slice(0, maxRows).map((r) => "| " + cols.map((c) => cell(r[c.key], c.max)).join(" | ") + " |");
  const more = rows.length > maxRows ? [`\n${rows.length - maxRows} more row(s) not shown. Ask for CSV or JSON to get all of them.`] : [];
  return [head, sep, ...body].join("\n") + more.join("");
}

function csvCell(v) {
  const s = String(v == null ? "" : v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function csv(rows, cols) {
  return [cols.map((c) => csvCell(c.label)).join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c.key])).join(","))].join("\n");
}

export const PAGE_COLS = [
  { key: "domain", label: "Domain" },
  { key: "url", label: "URL" },
  { key: "title", label: "Title", max: 100 }, // tables are clipped, CSV and JSON stay full
  { key: "description", label: "Description", max: 160 },
  { key: "lastmod", label: "Last modified" },
  { key: "status", label: "HTTP status" },
];
