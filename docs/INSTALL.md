# Install guide

There are four ways to use Site Search Opener in an AI app. Pick the one that fits.

| Way | Best for | What you get |
| --- | --- | --- |
| [A. Claude Code plugin](#a-claude-code-plugin) | Claude Code users | Server, skill and slash commands in two commands |
| [B. Local MCP server](#b-local-mcp-server) | Claude Desktop, Claude Code, Gemini CLI, Codex, Cursor, VS Code, Windsurf | The tools, running on your own computer |
| [C. Skill only](#c-skill-only) | Any app that reads Agent Skills | The know-how. Pair it with B or D for the tools |
| [D. Hosted on Cloudflare](#d-hosted-on-cloudflare) | claude.ai on the web, ChatGPT, Gemini Enterprise, whole teams | Your own copy on Cloudflare's free plan |

Nothing in this guide sends anything to bestseo.tips. Local installs run on your computer. Hosted installs run in your own Cloudflare account.

After installing, check it works by asking your AI app: **"List the Site Search Opener recipes."**

---

## Before you start (for B)

You need **Node.js 18.17 or newer**. Check with:

```bash
node -v
```

If it is missing or older, install the LTS version from https://nodejs.org and restart your computer or terminal.

Then get the server one of two ways:

**Option 1: download once (recommended).** Starts fast and works offline.

1. Download the ZIP from https://github.com/albertalbs/site-search-opener-mcp (green Code button, then Download ZIP) and unzip it somewhere permanent, for example `C:/Tools/site-search-opener-mcp` or `~/tools/site-search-opener-mcp`.
   Or, if you have Git:
   ```bash
   git clone https://github.com/albertalbs/site-search-opener-mcp.git
   ```
2. The server is the single file `plugin/server/site-search-opener.mjs` inside that folder. You do not need `npm install`.

In the steps below, replace `PATH_TO_SERVER` with the full path to that file, for example:
- Windows: `C:/Tools/site-search-opener-mcp/plugin/server/site-search-opener.mjs` (forward slashes are fine)
- macOS or Linux: `/Users/you/tools/site-search-opener-mcp/plugin/server/site-search-opener.mjs`

The command to run is:

```
node PATH_TO_SERVER
```

**Option 2: npx from GitHub.** Needs Git as well. Always runs the latest version, but the first start takes a few seconds.

```
npx -y github:albertalbs/site-search-opener-mcp
```

On Windows, some apps need `cmd /c` in front: the command becomes `cmd` and the arguments `/c npx -y github:albertalbs/site-search-opener-mcp`.

---

## A. Claude Code plugin

1. Open Claude Code and run:
   ```
   /plugin marketplace add albertalbs/site-search-opener-mcp
   ```
2. Then:
   ```
   /plugin install site-search-opener@bestseo-tips
   ```
3. Restart Claude Code. Type `/site-search-opener:` to see the commands.

The plugin brings the server, the skill and these commands: `:seo`, `:product`, `:sales`, `:pr`, `:research`, `:hr`, `:links`, `:build-project`, `:inventory`, `:search-links` and `:help`. It needs Node.js 18.17 or newer.

To update later: `/plugin marketplace update bestseo-tips`.

---

## B. Local MCP server

### Claude Desktop (Windows and macOS)

1. Open Claude Desktop, go to **Settings > Developer > Edit Config**. This opens `claude_desktop_config.json`.
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add the server inside `mcpServers` (keep any servers already there):
   ```json
   {
     "mcpServers": {
       "site-search-opener": {
         "command": "node",
         "args": ["PATH_TO_SERVER"]
       }
     }
   }
   ```
3. Save, then quit Claude Desktop fully (also from the system tray on Windows) and open it again.
4. The tools appear under the tools icon in the chat box. The team prompts appear in the **+** menu.

To add the skill as well, see [C. Skill only](#c-skill-only).

### Claude Code (without the plugin)

```bash
claude mcp add --scope user site-search-opener -- node PATH_TO_SERVER
```

`--scope user` makes it available in every project. Check with `claude mcp list`. Prompts show up as `/mcp__site-search-opener__seo` and so on.

### Gemini CLI

```bash
gemini mcp add site-search-opener node PATH_TO_SERVER
```

Or add it by hand to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "site-search-opener": {
      "command": "node",
      "args": ["PATH_TO_SERVER"]
    }
  }
}
```

Restart Gemini CLI and run `/mcp` to see the tools.

### OpenAI Codex CLI

```bash
codex mcp add site-search-opener -- node PATH_TO_SERVER
```

Or add it to `~/.codex/config.toml`:

```toml
[mcp_servers.site-search-opener]
command = "node"
args = ["PATH_TO_SERVER"]
```

### Cursor

Add to `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project):

```json
{
  "mcpServers": {
    "site-search-opener": {
      "command": "node",
      "args": ["PATH_TO_SERVER"]
    }
  }
}
```

Then check **Settings > MCP** and switch the server on.

### VS Code with GitHub Copilot

Add to `.vscode/mcp.json` in your project, or run **MCP: Open User Configuration** from the command palette for all projects:

```json
{
  "servers": {
    "site-search-opener": {
      "type": "stdio",
      "command": "node",
      "args": ["PATH_TO_SERVER"]
    }
  }
}
```

Open Copilot Chat in Agent mode and pick the tools from the tools button.

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "site-search-opener": {
      "command": "node",
      "args": ["PATH_TO_SERVER"]
    }
  }
}
```

### Settings for the local server

Set these as environment variables, or in your app's MCP config under `"env"`:

| Variable | What it does | Default |
| --- | --- | --- |
| `SSO_OUTPUT_DIR` | Where `save-file` puts files | `Documents/Site Search Opener` in your home folder |
| `SSO_ALLOW_PRIVATE` | Set to `1` to allow local and private network addresses, for testing a site on your own machine | off |

---

## C. Skill only

The skill folder is `skill/site-search-opener-by-bestseo-tips` in this repository. It teaches the AI when and how to use the tools, how to build a project from your memory and past chats, and what to do when the tools are not connected. Copy the whole folder, not just SKILL.md.

| App | Where the folder goes |
| --- | --- |
| Claude Code | `~/.claude/skills/` (all projects) or `.claude/skills/` (one project) |
| Claude Desktop and claude.ai | Zip the folder, then **Settings > Capabilities > Skills > Upload skill** |
| OpenAI Codex CLI | `~/.agents/skills/` or `.agents/skills/` |
| Gemini CLI | `~/.gemini/skills/` or `~/.agents/skills/`, or run `gemini skills install <path-to-folder>` |
| Cursor | `~/.cursor/skills/`, `~/.agents/skills/` or `.cursor/skills/` |
| VS Code with GitHub Copilot | `.github/skills/` in your project, or `~/.copilot/skills/` |

`~/.agents/skills/` is read by Codex, Gemini CLI and Cursor, so one copy there covers all three.

Restart the app after copying. Menu names in apps change from time to time; if a menu above looks different, look for "Skills" in the app's settings.

The skill works on its own too. Without the server it builds Google links by hand and points you to the web app, and it offers to help you install the server.

---

## D. Hosted on Cloudflare

Apps that run in the browser, like claude.ai and ChatGPT, cannot start a program on your computer. They need an internet address. Host your own copy on Cloudflare's free plan; it takes about ten minutes. See **[HOSTING-CLOUDFLARE.md](HOSTING-CLOUDFLARE.md)**.

Once you have your address, `https://site-search-opener-mcp.<your-account>.workers.dev/mcp/<your-access-key>`:

### claude.ai (web, desktop and mobile)

1. **Settings > Connectors > Add custom connector.**
2. Name: `Site Search Opener`. URL: your address. Add.
3. In a chat, open the tools menu and switch the connector on.

Custom connectors need a paid Claude plan. On Team and Enterprise plans, an owner may need to add it first.

### ChatGPT

1. **Settings > Apps and Connectors > Advanced settings**, and turn on **Developer mode**.
2. Back in Apps and Connectors, choose **Create**. Name: `Site Search Opener`. MCP server URL: your address. Authentication: none (the key is in the address).
3. In a chat, pick the connector from the tools menu.

Developer mode is available on paid ChatGPT plans. Menu names may differ slightly between versions.

### Gemini Enterprise

An admin adds it as a custom MCP server connector with your address. Gemini Enterprise needs a Streamable HTTP address over HTTPS, which is what the Cloudflare version provides. The feature is off by default until an admin turns it on.

### Local apps can use the hosted copy too

Most local apps from section B also accept a URL instead of a command. For example in Claude Code:

```bash
claude mcp add --transport http site-search-opener https://site-search-opener-mcp.<your-account>.workers.dev/mcp/<your-access-key>
```

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| The tools do not show up | Restart the app fully. Check `node -v` is 18.17 or newer. Check the path to `site-search-opener.mjs` is complete and correct. |
| `spawn npx ENOENT` on Windows | Use Option 1 (`node PATH_TO_SERVER`), or put `cmd /c` in front of npx. |
| A site shows search links instead of data | The site has no usable sitemap, blocks bots in robots.txt, or nothing matched. Open the links, or try `site-inventory` with fewer filters. |
| "That is N domains" on the hosted version | Cloudflare's free plan allows 4 domains per call. Ask for smaller groups, or run the local version. |
| Hosted address returns 401 | The access key in the address does not match the `ACCESS_KEY` secret. |
| Hosted address returns 503 | `ACCESS_KEY` is not set or is shorter than 16 characters. |
