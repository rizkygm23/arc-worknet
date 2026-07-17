# stat/ — Daily Network Stats Poster

Generates a branded 1080×1350 stat poster (PNG) from live WorkNet data, for daily social posting.

## Usage

```bash
node stat/generate.mjs
```

That's it — one command does everything:

1. Fetches live stats from `https://worknet.rizzgm.xyz/api/statistics`
2. Appends today's snapshot to `stat.json` (running twice in one day just refreshes today's entry)
3. Computes deltas vs the previous snapshot (▲ +$17,618 vs last, etc.)
4. Writes `poster.html` (WorkNet social brand — matches `public/img/x-banner.html`)
5. Screenshots it at 2× to `output/arc-worknet-stats-YYYY-MM-DD.png` via headless Chrome/Edge

## Files

| File | Purpose |
|---|---|
| `generate.mjs` | The generator script |
| `stat.json` | Snapshot history — do not edit by hand; deltas are computed from it |
| `poster.html` | Latest rendered poster (regenerated each run) |
| `output/*.png` | Daily PNGs ready to post (2160×2700 @2x) |

## Config

- `WORKNET_STATS_URL` — override the stats endpoint (e.g. localhost during dev)
- `CHROME_PATH` — path to a Chrome/Edge binary if not auto-detected

The poster shows: total volume (hero + 14-day sparkline), total jobs, clients, jobs completed, workers & agents — each with its change since the previous snapshot.
