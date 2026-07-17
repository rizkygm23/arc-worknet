# WorkNet — Social Post Style Guide

Single source of truth for every social visual (X/Twitter, IG, posters).
Reference implementations: `../public/img/x-banner.html` (banner) and `../stat/poster.html` (daily stats poster).

## 1. Brand name

- Product name is **WorkNet** — never "ArcWorkNet" or "Arc WorkNet".
- Wordmark markup: `Work<span>Net</span>` — "Work" in ink `#151515`, "Net" in brand green `#0f7a3e`.
- "Arc" only appears as ecosystem context ("Arc Ecosystem", "on Arc by Circle", "Arc Testnet Live"), never as part of the product name.
- Site URL shown on every visual: `worknet.rizzgm.xyz`.

## 2. Color palette (light social theme)

| Token | Hex | Use |
|---|---|---|
| Background | `#f9faf6` | Poster/banner background — always solid, never gradient |
| Surface | `#ffffff` | Cards, tiles, chips, logo box |
| Border green | `rgba(15, 122, 62, 0.30)` | Card/frame borders (0.40 for chips, 0.25 for footer hairline) |
| Brand green | `#0f7a3e` | Rail, corner brackets, accent dots, "Net" in wordmark, positive deltas, chip keywords, sparklines |
| Muted green | `#3d7a64` | Eyebrow labels, tile labels (uppercase) |
| Ink | `#151515` | Headlines, big numbers |
| Body | `#4a4f4c` | Taglines, descriptions |
| Chip text | `#2a2f2c` | Chip body text, step text |
| Faint | `#6e756f` | Dates, URL, de-emphasized text |
| Down red | `#dc2626` | Negative deltas only |
| Grid lines | `rgba(15, 122, 62, 0.10)` | 48px background grid |

Rules:
- **Light background only** (`#f9faf6`) — never dark mode. No gradients, no glows, no shadows.
- Green carries the brand; red is reserved for "down" states.
- Text is never pure black or a saturated color — use the tokens above.
- These tokens match the app's own light theme (`../tokens.css`), so posts look native to the product.

## 3. Typography

Load via Google Fonts:
`https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap`

| Role | Font | Weight | Size guide | Notes |
|---|---|---|---|---|
| Wordmark / hero numbers / headlines | Plus Jakarta Sans | 800 | 40–148px | `letter-spacing: -0.03em; line-height: ~1` |
| Tile values | Plus Jakarta Sans | 800 | 48–64px | `letter-spacing: -0.02em` |
| Eyebrow / labels | Inter | 600 | 13–17px | `text-transform: uppercase; letter-spacing: 0.14–0.16em; color: #8bb59e` |
| Tagline / body | Inter | 500 | 18–21px | `color: #aebbb4; line-height: 1.35` |
| Chips / badges | Inter | 600–700 | 13–16px | |
| Date / URL | Inter | 600 | 14–15px | `color: #6f8579; letter-spacing: 0.04–0.06em` |

## 4. Signature layout elements (use on every post)

Every WorkNet visual has these five elements — copy the CSS from `../stat/poster.html`:

1. **Grid background** — 48px grid of `rgba(15,122,62,0.10)` 1px lines at `opacity: 0.4`.
2. **Left rail** — 8px solid `#2e5749` strip on the left edge, full height.
3. **Frame** — 1px border `rgba(15,122,62,0.30)` inset 28px, with four 20×20px corner brackets (2px `#0f7a3e`).
4. **Logo box** — `../public/img/worknet_logo.png` inside a bordered square on `#0a0f0c`.
5. **Footer** — hairline top border `rgba(15,122,62,0.25)`, chips on the left, `worknet.rizzgm.xyz` on the right.

Component patterns:
- **Chip:** bordered box (`1px solid rgba(15,122,62,0.40)`) on `#ffffff`, keyword in `#0f7a3e` + rest in `#2a2f2c`. No border-radius (sharp corners everywhere except the eyebrow dot).
- **Eyebrow:** 9px round `#0f7a3e` dot + uppercase label.
- **Delta badge:** `▲ +value vs last` in `#0f7a3e` (up) / `▼` in `#dc2626` (down), same chip styling.
- Corners are **sharp** (no border-radius) — this is part of the look.

## 5. Canvas sizes

| Format | Size | Use |
|---|---|---|
| Feed poster (portrait) | 1080×1350 | Daily stats, announcements — best feed real estate |
| Square | 1080×1080 | IG grid, quotes |
| X banner | 1500×500 | Profile header |
| Wide card | 1200×675 | Link-preview style posts |

Always render PNG at 2× (`--force-device-scale-factor=2`).

## 6. Voice & copy (captions)

- Tone: confident, builder-to-builder, no hype words ("revolutionary", "game-changing").
- Lead with the number or the fact, not with adjectives.
- Product terms: **USDC-native escrow**, **humans + AI agents**, **on Arc by Circle**, **Arc Testnet**.
- Keep X captions under ~240 chars; 1–3 relevant tags max (e.g. `@circle`, `#Arc`, `#USDC`); always end with the URL.
- Bahasa: captions in English (audience is the global Arc ecosystem).
