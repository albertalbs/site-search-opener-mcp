// Domain rules shared with the Site Search Opener web app.
// normalizeTarget and isValidTarget are kept identical to the app, so a
// project file made here imports cleanly at bestseo.tips and back.

export function normalizeTarget(s) {
  s = String(s == null ? "" : s).trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[?#]/)[0];
  s = s.replace(/[\s,;]+/g, "");
  const body = s.replace(/\/+$/, "");
  return body.indexOf("/") > -1 ? body + "/" : body;
}

export function isValidTarget(s) {
  if (!s || s.length > 120 || s.indexOf(" ") > -1) return false;
  const parts = s.split("/");
  const host = parts[0];
  if (host.indexOf(".") < 0 || host.charAt(0) === "." || host.charAt(host.length - 1) === ".") return false;
  if (!/^[a-z0-9.-]+$/.test(host)) return false;
  if (parts.length > 1 && !/^[a-z0-9._~!$&'()*+,;=:@\/%-]*$/i.test(parts.slice(1).join("/"))) return false;
  return true;
}

// "example.com/blog/" -> { host: "example.com", path: "/blog/" }
export function splitTarget(target) {
  const t = normalizeTarget(target);
  const i = t.indexOf("/");
  return i < 0 ? { host: t, path: "/" } : { host: t.slice(0, i), path: t.slice(i) };
}

export function dedupeTargets(list) {
  const out = [];
  for (const x of list || []) {
    const t = normalizeTarget(x);
    if (t && isValidTarget(t) && !out.includes(t)) out.push(t);
  }
  return out;
}

// Same host, or its www twin. Subdomains only when asked.
export function hostMatches(urlHost, targetHost, includeSubdomains) {
  const h = urlHost.toLowerCase().replace(/^www\./, "");
  if (h === targetHost) return true;
  return Boolean(includeSubdomains) && h.endsWith("." + targetHost);
}

// Keeps the tool from being pointed at a home router, a cloud metadata
// endpoint or anything else on a private network. Local test servers can be
// allowed with SSO_ALLOW_PRIVATE=1.
export function isPublicHost(host) {
  host = String(host || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost")) return false;
  if (/\.(local|internal|lan|home|corp|intranet)$/.test(host)) return false;
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0 || a >= 224) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    return true;
  }
  if (host.includes(":")) {
    if (host === "::1" || host === "::") return false;
    if (/^(fc|fd|fe8|fe9|fea|feb)/.test(host)) return false;
    if (host.startsWith("::ffff:")) return isPublicHost(host.slice(7));
  }
  return true;
}
