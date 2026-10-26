# Host your own copy on Cloudflare (free plan)

This gives you an internet address for Site Search Opener, so browser-based AI apps like claude.ai, ChatGPT and Gemini Enterprise can use it. It runs in **your** Cloudflare account. Nothing goes through bestseo.tips.

Time: about ten minutes. Cost: free on Cloudflare's Workers free plan.

## What you need

- A free Cloudflare account: https://dash.cloudflare.com/sign-up
- Node.js 18.17 or newer: https://nodejs.org
- Git, or download the ZIP from GitHub instead

## Steps

1. Get the code and install it:
   ```bash
   git clone https://github.com/albertalbs/site-search-opener-mcp.git
   cd site-search-opener-mcp
   npm install
   ```

2. Log in to Cloudflare. A browser window opens; approve it.
   ```bash
   npx wrangler login
   ```

3. Deploy:
   ```bash
   npx wrangler deploy
   ```
   At the end you get an address like `https://site-search-opener-mcp.<your-account>.workers.dev`.

4. Make an access key. Any long random text works. This prints one:
   ```bash
   node -e "console.log(crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', ''))"
   ```

5. Save it as a secret on your Worker. Paste the key when asked:
   ```bash
   npx wrangler secret put ACCESS_KEY
   ```

6. Check it is running. Open this in your browser:
   ```
   https://site-search-opener-mcp.<your-account>.workers.dev/health
   ```
   You should see "Site Search Opener MCP ... is running".

7. Your MCP address is:
   ```
   https://site-search-opener-mcp.<your-account>.workers.dev/mcp/<your-access-key>
   ```
   Add it to your AI apps as shown in [INSTALL.md, section D](INSTALL.md#d-hosted-on-cloudflare).

Treat the address like a password, because the key is part of it. Anyone with it can use your copy (only to read public sitemaps, but still). Share it with your team only.

## Without the command line

Use Cloudflare's deploy button. It copies the repository to your GitHub account and deploys it:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/albertalbs/site-search-opener-mcp)

Then add the key in the dashboard: **Workers & Pages > site-search-opener-mcp > Settings > Variables and Secrets > Add**, type **Secret**, name `ACCESS_KEY`, and paste a long random value. Continue from step 6.

## Free plan limits

Cloudflare's free plan allows about 100,000 requests a day, plenty for a team. The tighter limit is 50 outgoing requests per call. Reading one site's robots.txt, sitemaps and feed takes about 8 to 10 requests, so the hosted version:

- reads up to **4 domains per call** (the AI can run several calls in a row)
- reads up to 4 sitemap files per domain
- does not fetch page titles by default

For bigger runs, use the local version, which has none of these limits.

### On the Workers Paid plan

If your account is on the Workers Paid plan, set a plain variable `PAID_PLAN` with the value `1` (dashboard: Settings > Variables and Secrets, type Text). The hosted version then reads up to 15 domains per call, more sitemap files, and fetches titles for the top pages.

## Updating

```bash
git pull
npx wrangler deploy
```

Your access key stays as it was.

## Changing the key

Run `npx wrangler secret put ACCESS_KEY` again with a new value, then update the address in your AI apps.

## Removing it

```bash
npx wrangler delete
```
