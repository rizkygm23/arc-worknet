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
  if (diff === null) return `<span class="delta flat">first snapshot</span>`;
  const cls = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "●";
  const magnitude = money ? usd(Math.abs(diff)) : int(Math.abs(diff));
  const text = diff === 0 ? "no change" : `${arrow} ${diff > 0 ? "+" : "-"}${magnitude}${suffix}`;
  return `<span class="delta ${cls}">${text} <em>vs last</em></span>`;
}

function sparkline(history, key) {
  const points = history.slice(-14).map((h) => h.stats[key]);
  if (points.length < 2) return "";
  const w = 360;
  const h = 72;
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
      <polyline points="${line}" fill="none" stroke="#0f7a3e" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${lx}" cy="${ly}" r="5" fill="#0f7a3e" stroke="#f9faf6" stroke-width="2"/>
    </svg>`;
}

function renderPoster({ today, stats, deltas, history }) {
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tiles = [
    { label: "Total jobs", value: int(stats.totalJobs), chip: deltaChip(deltas.totalJobs) },
    { label: "Clients", value: int(stats.clients), chip: deltaChip(deltas.clients) },
    { label: "Jobs completed", value: int(stats.completedJobs), chip: deltaChip(deltas.completedJobs) },
    { label: "Workers & agents", value: int(stats.workers + stats.knownAgents), chip: deltaChip(deltas.workforce) },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>WorkNet — Network Stats ${today}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 1080px; height: 1350px; overflow: hidden; background: #f9faf6; }
    .poster {
      position: relative; width: 1080px; height: 1350px;
      background: #f9faf6; color: #151515;
      font-family: Inter, system-ui, sans-serif; overflow: hidden;
    }
    .gridbg {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(to right, rgba(15, 122, 62, 0.10) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(15, 122, 62, 0.10) 1px, transparent 1px);
      background-size: 48px 48px; opacity: 0.4;
    }
    .rail { position: absolute; top: 0; left: 0; width: 8px; height: 100%; background: #0f7a3e; }
    .frame { position: absolute; inset: 28px; border: 1px solid rgba(15, 122, 62, 0.30); }
    .frame b { position: absolute; width: 20px; height: 20px; border: 2px solid #0f7a3e; }
    .frame b:nth-child(1) { top: -1px; left: -1px; border-right: 0; border-bottom: 0; }
    .frame b:nth-child(2) { top: -1px; right: -1px; border-left: 0; border-bottom: 0; }
    .frame b:nth-child(3) { bottom: -1px; left: -1px; border-right: 0; border-top: 0; }
    .frame b:nth-child(4) { bottom: -1px; right: -1px; border-left: 0; border-top: 0; }

    .content {
      position: relative; z-index: 2; height: 100%;
      display: flex; flex-direction: column;
      padding: 84px 88px 96px;
    }
    .head { display: flex; align-items: center; gap: 20px; }
    .logo-wrap {
      width: 84px; height: 84px; display: grid; place-items: center;
      border: 1px solid rgba(15, 122, 62, 0.35); background: #ffffff; flex: 0 0 auto;
    }
    .logo-wrap img { width: 62px; height: 62px; object-fit: contain; display: block; }
    .head-copy { display: flex; flex-direction: column; gap: 6px; }
    .eyebrow {
      display: inline-flex; align-items: center; gap: 10px;
      font-size: 14px; font-weight: 600; letter-spacing: 0.16em;
      text-transform: uppercase; color: #3d7a64;
    }
    .eyebrow i { width: 9px; height: 9px; border-radius: 999px; background: #0f7a3e; font-style: normal; }
    .wordmark {
      font-family: "Plus Jakarta Sans", Inter, sans-serif;
      font-size: 40px; font-weight: 800; letter-spacing: -0.03em; line-height: 1;
    }
    .wordmark span { color: #0f7a3e; }
    .date { margin-left: auto; text-align: right; font-size: 15px; font-weight: 600; color: #6e756f; letter-spacing: 0.04em; }

    .hero { margin-top: 96px; }
    .hero .label {
      font-size: 17px; font-weight: 600; letter-spacing: 0.14em;
      text-transform: uppercase; color: #3d7a64;
    }
    .hero .value {
      margin-top: 14px;
      font-family: "Plus Jakarta Sans", Inter, sans-serif;
      font-size: 148px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; color: #151515;
    }
    .hero .sub { margin-top: 16px; font-size: 20px; font-weight: 500; color: #4a4f4c; }
    .hero-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
    .spark { display: block; margin-bottom: 10px; opacity: 0.9; }

    .delta {
      display: inline-flex; align-items: center; gap: 8px;
      margin-top: 18px; height: 40px; padding: 0 16px;
      border: 1px solid rgba(15, 122, 62, 0.40); background: #ffffff;
      font-size: 16px; font-weight: 700; letter-spacing: 0.02em;
    }
    .delta em { font-style: normal; font-weight: 600; color: #6e756f; }
    .delta.up { color: #0f7a3e; }
    .delta.down { color: #dc2626; }
    .delta.flat { color: #4a4f4c; }

    .tiles { margin-top: 92px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .tile { border: 1px solid rgba(15, 122, 62, 0.30); background: #ffffff; padding: 30px 32px 26px; }
    .tile .label {
      font-size: 14px; font-weight: 600; letter-spacing: 0.14em;
      text-transform: uppercase; color: #3d7a64;
    }
    .tile .value {
      margin-top: 12px;
      font-family: "Plus Jakarta Sans", Inter, sans-serif;
      font-size: 58px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; color: #151515;
    }
    .tile .delta { margin-top: 16px; height: 32px; padding: 0 12px; font-size: 13px; }

    .footer {
      margin-top: auto; padding-top: 28px;
      border-top: 1px solid rgba(15, 122, 62, 0.25);
      display: flex; align-items: center; justify-content: space-between;
    }
    .chips { display: flex; gap: 12px; }
    .chip {
      display: inline-flex; align-items: center; height: 36px; padding: 0 14px;
      border: 1px solid rgba(15, 122, 62, 0.40); background: #ffffff;
      color: #2a2f2c; font-size: 13px; font-weight: 600;
    }
    .chip strong { color: #0f7a3e; margin-right: 6px; font-weight: 700; }
    .url { font-size: 15px; font-weight: 600; letter-spacing: 0.06em; color: #6e756f; }
  </style>
</head>
<body>
  <div class="poster">
    <div class="gridbg"></div>
    <div class="rail"></div>
    <div class="frame"><b></b><b></b><b></b><b></b></div>
    <div class="content">
      <div class="head">
        <div class="logo-wrap"><img src="../public/img/worknet_logo.png" alt="WorkNet" /></div>
        <div class="head-copy">
          <div class="eyebrow"><i></i> Network stats</div>
          <div class="wordmark">Work<span>Net</span></div>
        </div>
        <div class="date">${dateLabel}</div>
      </div>

      <div class="hero">
        <div class="label">Total volume</div>
        <div class="hero-row">
          <div class="value">${usd(stats.totalVolumeUsdc)}</div>
          ${sparkline(history, "totalVolumeUsdc")}
        </div>
        <div class="sub">USDC settled through WorkNet escrow</div>
        ${deltaChip(deltas.totalVolumeUsdc, { money: true })}
      </div>

      <div class="tiles">
        ${tiles
          .map(
            (t) => `<div class="tile">
          <div class="label">${t.label}</div>
          <div class="value">${t.value}</div>
          ${t.chip}
        </div>`,
          )
          .join("\n        ")}
      </div>

      <div class="footer">
        <div class="chips">
          <span class="chip"><strong>USDC</strong> Native Escrow</span>
          <span class="chip"><strong>Arc</strong> Testnet Live</span>
          <span class="chip"><strong>Humans</strong> + Agents</span>
        </div>
        <div class="url">${SITE_LABEL}</div>
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
