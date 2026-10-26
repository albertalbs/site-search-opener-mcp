// Hosted version for Cloudflare Workers (free plan is enough).
// Each team deploys its own copy, so requests never touch bestseo.tips.
//
// Your MCP address:  https://<worker-name>.<your-account>.workers.dev/mcp/<ACCESS_KEY>
// Set the key once:  npx wrangler secret put ACCESS_KEY

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/cfworker";
import { createServer } from "../src/server.js";
import { VERSION } from "../src/core/http.js";

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function keyFromRequest(request, url) {
  const parts = url.pathname.split("/").filter(Boolean); // ["mcp", "<key>"]
  if (parts[0] === "mcp" && parts[1]) return decodeURIComponent(parts[1]);
  const auth = request.headers.get("authorization") || "";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(`Site Search Opener MCP ${VERSION} is running. Connect your AI app to /mcp/<your key>.\n`, { headers: { "content-type": "text/plain" } });
    }
    if (!url.pathname.startsWith("/mcp")) return new Response("Not found\n", { status: 404 });

    const expected = env.ACCESS_KEY || "";
    if (expected.length < 16) {
      return new Response("Set an ACCESS_KEY of at least 16 characters first: npx wrangler secret put ACCESS_KEY\n", { status: 503 });
    }
    if (!timingSafeEqual(keyFromRequest(request, url), expected)) return new Response("Unauthorized\n", { status: 401 });

    // Stateless: a fresh server and transport for every request.
    const server = createServer({
      mode: "remote",
      paidPlan: env.PAID_PLAN === "1", // set this var only on the Workers Paid plan
      jsonSchemaValidator: new CfWorkerJsonSchemaValidator(),
    });
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await server.connect(transport);
    return transport.handleRequest(request);
  },
};
