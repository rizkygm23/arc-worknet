#!/usr/bin/env node
/**
 * Render a designer post HTML file to PNG at 2x using local Chrome/Edge.
 *
 * Usage:  node designer/render.mjs designer/output/post_1/post.html [WxH]
 *         node designer/render.mjs designer/output/post_1/post.html 1080x1350
 *
 * Size defaults to 1080x1350. The PNG is written next to the HTML file
 * with the same basename (post.html -> post.png).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [, , htmlArg, sizeArg] = process.argv;
if (!htmlArg) {
  console.error("Usage: node designer/render.mjs <path/to/post.html> [WxH]");
  process.exit(1);
}

const htmlPath = path.resolve(htmlArg);
if (!fs.existsSync(htmlPath)) {
  console.error(`Not found: ${htmlPath}`);
  process.exit(1);
}

const [w, h] = (sizeArg ?? "1080x1350").split("x").map(Number);
if (!w || !h) {
  console.error(`Bad size "${sizeArg}" — expected e.g. 1080x1350`);
  process.exit(1);
}

const pngPath = htmlPath.replace(/\.html?$/i, ".png");

const candidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) {
  console.error("No Chrome/Edge found — set CHROME_PATH and re-run.");
  process.exit(1);
}

const result = spawnSync(
  browser,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=2",
    `--window-size=${w},${h}`,
    "--virtual-time-budget=10000",
    `--screenshot=${pngPath}`,
    pathToFileURL(htmlPath).href,
  ],
  { stdio: "pipe", timeout: 120_000 },
);

if (result.status !== 0 || !fs.existsSync(pngPath)) {
  console.error(String(result.stderr ?? "").slice(-800));
  process.exit(1);
}
console.log(`PNG: ${pngPath} (${w * 2}x${h * 2})`);
