# designer/ — WorkNet Social Post Workshop

Everything needed to generate branded WorkNet social posts. Written so an agent can produce a new post end-to-end without extra context.

## Folder layout

```
designer/
├── README.md            ← you are here (workflow)
├── STYLE_GUIDE.md       ← brand rules: colors, fonts, layout, voice — READ FIRST
├── render.mjs           ← HTML → PNG converter (headless Chrome, 2x)
└── output/
    ├── post_1/
    │   ├── post.html    ← the design (self-contained HTML)
    │   ├── post.png     ← rendered image, ready to publish
    │   └── caption.md   ← post caption + metadata
    ├── post_2/
    │   └── ...
    └── ...
```

## How to generate a new post (agent workflow)

1. **Read `STYLE_GUIDE.md`** — brand name is **WorkNet** (never "ArcWorkNet"), dark theme, green accents, sharp corners, the five signature layout elements.
2. **Pick the next folder name**: look at `output/`, take the highest `post_N`, create `post_(N+1)/`.
3. **Write `post.html`**:
   - Start by copying the structure of an existing post (e.g. `output/post_1/post.html`) or `../stat/poster.html`.
   - Fixed pixel canvas — set `html, body { width: <W>px; height: <H>px; overflow: hidden; }` to the target size (default 1080×1350; see size table in the style guide).
   - Self-contained: inline all CSS. Fonts from Google Fonts. Logo via relative path `../../../public/img/worknet_logo.png`.
   - If the post shows network stats, take the real numbers from `../stat/stat.json` (latest entry) — never invent numbers.
4. **Render the PNG**:
   ```bash
   node designer/render.mjs designer/output/post_2/post.html 1080x1350
   ```
   (run from the repo root; size argument must match the canvas size in the HTML)
5. **Look at the PNG** — check for text overflow, label collisions, wrong branding. Fix the HTML and re-render until clean.
6. **Write `caption.md`** using this template:

   ```markdown
   # post_2 — <short title>

   - **Date:** YYYY-MM-DD
   - **Format:** 1080x1350 feed poster
   - **Topic:** <what this post is about>

   ## Caption

   <the caption text, ready to copy-paste>

   ## Alt text

   <one-sentence image description for accessibility>
   ```

## Rules

- Never write "ArcWorkNet" / "Arc WorkNet" — the product is **WorkNet**. "Arc" is only the ecosystem/chain name.
- Never edit an already-published `post_N/` — create a new one.
- Real data only: stats come from `../stat/stat.json` or `https://worknet.rizzgm.xyz/api/statistics`.
- Every visual ends with the URL `worknet.rizzgm.xyz` in the footer.

## Related

- Daily stats poster is automated separately: `node stat/generate.mjs` (see `../stat/README.md`).
- Profile banner source: `../public/img/x-banner.html` (1500×500).
