#!/usr/bin/env node
// Local version: runs on your own computer and talks to your AI app over stdio.

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { mkdir, writeFile, access } from "node:fs/promises";
import { homedir } from "node:os";
import { join, basename, extname } from "node:path";
import { createServer } from "./server.js";

const outputDir = process.env.SSO_OUTPUT_DIR || join(homedir(), "Documents", "Site Search Opener");

async function freeName(dir, name) {
  const ext = extname(name);
  const stem = name.slice(0, name.length - ext.length);
  for (let i = 0; i < 1000; i++) {
    const candidate = join(dir, i ? `${stem}-${i + 1}${ext}` : name);
    try { await access(candidate); } catch { return candidate; }
  }
  throw new Error("Could not find a free file name.");
}

const server = createServer({
  mode: "local",
  allowPrivate: process.env.SSO_ALLOW_PRIVATE === "1",
  extend(srv) {
    srv.registerTool("save-file", {
      title: "Save a file",
      description: `Saves a project file, CSV or Markdown table to your computer, in ${outputDir}. Existing files are never overwritten; a number is added instead.`,
      inputSchema: {
        file_name: z.string().min(1).max(120).describe("For example competitor-pages.csv or projects.json"),
        content: z.string().max(20_000_000),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    }, async ({ file_name, content }) => {
      const name = basename(file_name).replace(/[<>:"|?*\x00-\x1f]/g, "-");
      const ext = extname(name).toLowerCase();
      if (![".json", ".csv", ".md", ".txt"].includes(ext)) {
        return { content: [{ type: "text", text: "Only .json, .csv, .md and .txt files can be saved." }], isError: true };
      }
      await mkdir(outputDir, { recursive: true });
      const path = await freeName(outputDir, name);
      await writeFile(path, content, "utf8");
      return { content: [{ type: "text", text: `Saved to ${path}` }] };
    });
  },
});

await server.connect(new StdioServerTransport());
