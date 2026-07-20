#!/usr/bin/env node
/**
 * WorkNet daily stats poster generator.
 *
 * 1. Fetches live network stats from /api/statistics
 * 2. Appends today's snapshot to stat/stat.json (re-running the same day
 *    overwrites today's entry; deltas always compare against the most
 *    recent entry BEFORE today)
 * 3. Renders stat/poster.html (1080x1350, WorkNet social brand)
 * 4. Screenshots it to stat/output/arc-worknet-stats-YYYY-MM-DD.png
 *    using locally installed Chrome/Edge headless
 *
 * Usage:  node stat/generate.mjs
 *         WORKNET_STATS_URL=... node stat/generate.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const STATS_URL = process.env.WORKNET_STATS_URL ?? "https://worknet.rizzgm.xyz/api/statistics";
const SITE_LABEL = "worknet.rizzgm.xyz";
const USDC_DECIMALS = 6;

const statDir = path.dirname(fileURLToPath(import.meta.url));
const statJsonPath = path.join(statDir, "stat.json");
const posterHtmlPath = path.join(statDir, "poster.html");
const outputDir = path.join(statDir, "output");

function localDateISO(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function usd(amount, { compact = false } = {}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(amount);
}

function int(n) {
  return new Intl.NumberFormat("en-US").format(n);
}

async function fetchStats() {
  const res = await fetch(STATS_URL, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Stats API responded ${res.status} ${res.statusText}`);
  const body = await res.json();
  if (!body?.public) throw new Error("Stats API payload missing `public` object");
  return body.public;
}

function loadHistory() {
  if (!fs.existsSync(statJsonPath)) return [];
  const parsed = JSON.parse(fs.readFileSync(statJsonPath, "utf8"));
  return Array.isArray(parsed.history) ? parsed.history : [];
}

function saveHistory(history) {
  const payload = { updatedAt: new Date().toISOString(), history };
  fs.writeFileSync(statJsonPath, JSON.stringify(payload, null, 2) + "\n");
}

function delta(current, previous) {
  if (previous === undefined || previous === null) return null;
  return current - previous;
}

function deltaChip(diff, { money = false, suffix = "" } = {}) {
  if (diff === null) return `<span class="delta muted">—</span>`;
  const cls = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "·";
  const magnitude = money ? usd(Math.abs(diff)) : int(Math.abs(diff));
  const text = diff === 0 ? "—" : `${arrow}${diff > 0 ? "+" : "−"}${magnitude}${suffix}`;
  return `<span class="delta ${cls}">${text}</span>`;
}

function sparkline(history, key) {
  const points = history.slice(-14).map((h) => h.stats[key]);
  if (points.length < 2) return "";
  const w = 460;
  const h = 64;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * (w - 8) + 4;
    const y = h - 6 - ((v - min) / span) * (h - 12);
    return [x.toFixed(1), y.toFixed(1)];
  });
  const line = coords.map((c) => c.join(",")).join(" ");
  const [lx, ly] = coords[coords.length - 1];
  return `
    <svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
      <polyline points="${line}" fill="none" stroke="#00ff41" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.7"/>
      <circle cx="${lx}" cy="${ly}" r="4" fill="#00ff41" stroke="#0a0a0a" stroke-width="2"/>
    </svg>`;
}

function renderPoster({ today, stats, deltas, history }) {
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const completionRate = stats.totalJobs > 0
    ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
    : 0;

  const tiles = [
    { label: "Total jobs", value: int(stats.totalJobs), chip: deltaChip(deltas.totalJobs) },
    { label: "Clients", value: int(stats.clients), chip: deltaChip(deltas.clients) },
    { label: "Completed", value: int(stats.completedJobs), chip: deltaChip(deltas.completedJobs) },
    { label: "Workers", value: int(stats.workers + stats.knownAgents), chip: deltaChip(deltas.workforce) },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>WorkNet — Network Stats ${today}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 1080px; height: 1350px; overflow: hidden; background: #0a0a0a; }

    .poster {
      position: relative; width: 1080px; height: 1350px;
      background: #0a0a0a; color: #e8e8e8;
      font-family: Inter, system-ui, sans-serif; overflow: hidden;
    }

    /* subtle noise grain — not a grid */
    .poster::before {
      content: ""; position: absolute; inset: 0; opacity: 0.035; z-index: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 256px 256px;
    }

    /* top accent bar */
    .accent { position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: #00ff41; z-index: 1; }

    .content {
      position: relative; z-index: 2; height: 100%;
      display: flex; flex-direction: column;
      padding: 72px 80px 64px;
    }

    /* header */
    .head {
      display: flex; align-items: center; justify-content: space-between;
    }
    .brand { display: flex; align-items: center; gap: 16px; }
    .brand img { width: 44px; height: 44px; object-fit: contain; display: block; filter: brightness(0) invert(1); }
    .brand-name {
      font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #e8e8e8;
    }
    .brand-name span { color: #00ff41; }
    .head-meta {
      display: flex; align-items: center; gap: 20px;
      font-family: "JetBrains Mono", monospace; font-size: 13px; color: #555; font-weight: 500;
    }
    .head-meta .dot { width: 6px; height: 6px; border-radius: 50%; background: #00ff41; }
    .head-tag {
      font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
      color: #00ff41; opacity: 0.7;
    }

    /* dividers */
    .rule { border: none; border-top: 1px solid #1a1a1a; margin: 0; }
    .rule-strong { border: none; border-top: 1px solid #222; margin: 0; }

    /* hero section */
    .hero { margin-top: 64px; }
    .hero-label {
      font-family: "JetBrains Mono", monospace;
      font-size: 13px; font-weight: 500; letter-spacing: 0.08em;
      text-transform: uppercase; color: #555;
    }
    .hero-value {
      margin-top: 20px;
      font-family: "JetBrains Mono", monospace;
      font-size: 128px; font-weight: 700; letter-spacing: -0.04em; line-height: 1;
      color: #fff;
    }
    .hero-sub {
      margin-top: 20px;
      display: flex; align-items: center; gap: 24px;
    }
    .hero-desc {
      font-size: 17px; font-weight: 400; color: #666; line-height: 1.4;
    }
    .hero .delta { font-family: "JetBrains Mono", monospace; font-size: 15px; font-weight: 500; }

    /* sparkline area */
    .spark-area {
      margin-top: 40px; padding: 24px 0;
      border-top: 1px solid #1a1a1a;
      border-bottom: 1px solid #1a1a1a;
    }
    .spark-header {
      font-family: "JetBrains Mono", monospace;
      font-size: 11px; font-weight: 500; letter-spacing: 0.1em;
      text-transform: uppercase; color: #444; margin-bottom: 12px;
    }
    .spark { display: block; opacity: 1; }

    /* stats row */
    .stats-row {
      margin-top: 56px;
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 0;
    }
    .stat-col {
      padding: 0 28px;
      border-left: 1px solid #1a1a1a;
    }
    .stat-col:first-child { padding-left: 0; border-left: none; }
    .stat-col:last-child { padding-right: 0; }
    .stat-label {
      font-family: "JetBrains Mono", monospace;
      font-size: 11px; font-weight: 500; letter-spacing: 0.1em;
      text-transform: uppercase; color: #555;
    }
    .stat-value {
      margin-top: 16px;
      font-family: "JetBrains Mono", monospace;
      font-size: 52px; font-weight: 700; letter-spacing: -0.03em; line-height: 1;
      color: #fff;
    }
    .stat-col .delta {
      margin-top: 14px;
      font-family: "JetBrains Mono", monospace; font-size: 13px; font-weight: 500;
    }

    /* delta colors */
    .delta.up { color: #00ff41; }
    .delta.down { color: #ff4141; }
    .delta.flat { color: #444; }
    .delta.muted { color: #333; }

    /* completion bar section */
    .mid-section {
      margin-top: 56px;
      padding: 40px 0;
      border-top: 1px solid #1a1a1a;
    }
    .mid-row {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 56px;
    }
    .mid-block { flex: 1; }
    .mid-label {
      font-family: "JetBrains Mono", monospace;
      font-size: 11px; font-weight: 500; letter-spacing: 0.1em;
      text-transform: uppercase; color: #555;
    }
    .mid-value {
      margin-top: 12px;
      font-family: "JetBrains Mono", monospace;
      font-size: 36px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; color: #fff;
    }
    .bar-track {
      margin-top: 16px; width: 100%; height: 8px;
      background: #1a1a1a; overflow: hidden;
    }
    .bar-fill {
      height: 100%; background: #00ff41;
      transition: width 0.3s;
    }
    .bar-label {
      margin-top: 10px;
      font-family: "JetBrains Mono", monospace;
      font-size: 11px; font-weight: 500; color: #444;
    }
    .mid-desc {
      margin-top: 8px;
      font-size: 13px; font-weight: 400; color: #444;
    }

    /* footer */
    .foot {
      margin-top: auto;
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 32px;
      border-top: 1px solid #1a1a1a;
    }
    .foot-left {
      display: flex; align-items: center; gap: 16px;
    }
    .foot-tag {
      font-family: "JetBrains Mono", monospace;
      font-size: 12px; font-weight: 500; color: #555;
      padding: 8px 14px; border: 1px solid #222;
    }
    .foot-tag strong { color: #00ff41; font-weight: 700; }
    .foot-url {
      font-family: "JetBrains Mono", monospace;
      font-size: 14px; font-weight: 500; color: #555; letter-spacing: 0.02em;
    }
  </style>
</head>
<body>
  <div class="poster">
    <div class="accent"></div>
    <div class="content">
      <div class="head">
        <div class="brand">
          <img src="../public/img/worknet_logo.png" alt="" />
          <div class="brand-name">Work<span>Net</span></div>
        </div>
        <div class="head-meta">
          <span class="head-tag">Network Stats</span>
          <span class="dot"></span>
          <span>${dateLabel}</span>
        </div>
      </div>

      <div class="hero">
        <div class="hero-label">Total volume (USDC)</div>
        <div class="hero-value">${usd(stats.totalVolumeUsdc)}</div>
        <div class="hero-sub">
          <span class="hero-desc">Settled through onchain escrow</span>
          ${deltaChip(deltas.totalVolumeUsdc, { money: true })}
        </div>
      </div>

      ${history.length >= 2 ? `
      <div class="spark-area">
        <div class="spark-header">14-day volume</div>
        ${sparkline(history, "totalVolumeUsdc")}
      </div>` : ""}

      <div class="stats-row">
        ${tiles
          .map(
            (t) => `<div class="stat-col">
          <div class="stat-label">${t.label}</div>
          <div class="stat-value">${t.value}</div>
          ${t.chip}
        </div>`,
          )
          .join("\n        ")}
      </div>

      <div class="mid-section">
        <div class="mid-row">
          <div class="mid-block">
            <div class="mid-label">Completion rate</div>
            <div class="mid-value">${completionRate}%</div>
            <div class="bar-track"><div class="bar-fill" style="width:${completionRate}%"></div></div>
            <div class="bar-label">${int(stats.completedJobs)} of ${int(stats.totalJobs)} jobs</div>
          </div>
          <div class="mid-block">
            <div class="mid-label">Open budget pool</div>
            <div class="mid-value">${usd(stats.openBudgetUsdc, { compact: true })}</div>
            <div class="mid-desc">USDC in active escrow contracts</div>
          </div>
        </div>
      </div>

      <div class="foot">
        <div class="foot-left">
          <span class="foot-tag"><strong>USDC</strong> Escrow</span>
          <span class="foot-tag"><strong>Arc</strong> Testnet</span>
        </div>
        <div class="foot-url">${SITE_LABEL}</div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

function renderPng(pngPath) {
  const browser = findBrowser();
  if (!browser) {
    console.warn("! No Chrome/Edge found — skipped PNG. Set CHROME_PATH and re-run.");
    return false;
  }
  const result = spawnSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      "--window-size=1080,1350",
      "--virtual-time-budget=10000",
      `--screenshot=${pngPath}`,
      pathToFileURL(posterHtmlPath).href,
    ],
    { stdio: "pipe", timeout: 120_000 },
  );
  if (result.status !== 0 || !fs.existsSync(pngPath)) {
    console.error(String(result.stderr ?? "").slice(-800));
    return false;
  }
  return true;
}

async function main() {
  const today = localDateISO();
  console.log(`Fetching stats from ${STATS_URL} ...`);
  const raw = await fetchStats();

  const stats = {
    totalVolumeUsdc: Math.round(raw.totalVolumeUsdcUnits / 10 ** USDC_DECIMALS),
    openBudgetUsdc: Math.round(raw.openBudgetUsdcUnits / 10 ** USDC_DECIMALS),
    totalJobs: raw.totalJobs,
    completedJobs: raw.completedJobs,
    clients: raw.clients,
    workers: raw.workers,
    knownAgents: raw.knownAgents,
  };

  const history = loadHistory().filter((h) => h.date !== today);
  const prev = history.length ? history[history.length - 1].stats : {};

  const deltas = {
    totalVolumeUsdc: delta(stats.totalVolumeUsdc, prev.totalVolumeUsdc),
    totalJobs: delta(stats.totalJobs, prev.totalJobs),
    completedJobs: delta(stats.completedJobs, prev.completedJobs),
    clients: delta(stats.clients, prev.clients),
    workforce:
      prev.workers === undefined
        ? null
        : stats.workers + stats.knownAgents - (prev.workers + prev.knownAgents),
  };

  history.push({ date: today, timestamp: new Date().toISOString(), stats });
  saveHistory(history);
  console.log(`stat.json updated (${history.length} snapshot${history.length === 1 ? "" : "s"})`);

  fs.writeFileSync(posterHtmlPath, renderPoster({ today, stats, deltas, history }));
  console.log(`Poster HTML: ${posterHtmlPath}`);

  fs.mkdirSync(outputDir, { recursive: true });
  const pngPath = path.join(outputDir, `arc-worknet-stats-${today}.png`);
  if (renderPng(pngPath)) console.log(`Poster PNG:  ${pngPath}`);

  const fmtDelta = (d, money) =>
    d === null ? "(first snapshot)" : `${d >= 0 ? "+" : ""}${money ? usd(d) : int(d)}`;
  
  const captionFmtDelta = (d, money) =>
    d === null ? "" : ` (${d >= 0 ? "+" : ""}${money ? usd(d) : int(d)})`;

  const captionMd = `# Network Stats ${today}

- **Date:** ${today}
- **Format:** 1080x1350 feed poster
- **Topic:** Daily network statistics

## Caption

WorkNet Daily Stats 📊

Total Volume: ${usd(stats.totalVolumeUsdc)}${captionFmtDelta(deltas.totalVolumeUsdc, true)}
Total Jobs: ${int(stats.totalJobs)}${captionFmtDelta(deltas.totalJobs, false)}
Clients: ${int(stats.clients)}${captionFmtDelta(deltas.clients, false)}
Completed: ${int(stats.completedJobs)}${captionFmtDelta(deltas.completedJobs, false)}
Workforce (Humans + AI): ${int(stats.workers + stats.knownAgents)}${captionFmtDelta(deltas.workforce, false)}

All jobs settled safely in USDC-native escrow on Arc by Circle. ⚡️

${SITE_LABEL}
#WorkNet #Arc #USDC

## Alt text

A poster showing WorkNet network stats for ${today}: Total volume ${usd(stats.totalVolumeUsdc)}, Total jobs ${int(stats.totalJobs)}, Clients ${int(stats.clients)}, Jobs completed ${int(stats.completedJobs)}, Workforce ${int(stats.workers + stats.knownAgents)}.
`;

  const captionPath = path.join(outputDir, `arc-worknet-stats-${today}-caption.md`);
  fs.writeFileSync(captionPath, captionMd);
  console.log(`Caption MD:  ${captionPath}`);

  console.log(`
  Total volume : ${usd(stats.totalVolumeUsdc)} ${fmtDelta(deltas.totalVolumeUsdc, true)}
  Total jobs   : ${int(stats.totalJobs)} ${fmtDelta(deltas.totalJobs)}
  Clients      : ${int(stats.clients)} ${fmtDelta(deltas.clients)}
  Completed    : ${int(stats.completedJobs)} ${fmtDelta(deltas.completedJobs)}
  Workforce    : ${int(stats.workers + stats.knownAgents)} ${fmtDelta(deltas.workforce)}`);
}

main().catch((error) => {
  console.error(`Failed: ${error.message}`);
  process.exit(1);
});
