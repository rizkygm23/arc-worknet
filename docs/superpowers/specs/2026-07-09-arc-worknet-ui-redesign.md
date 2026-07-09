# Arc WorkNet — Total UI Redesign

> **Status:** Approved design direction — *Arc Signature*  
> **Date:** 2026-07-09  
> **Scope:** Whole product (landing page + authenticated app + all internal pages)

---

## 1. Goal

Redesign seluruh UI Arc WorkNet agar terlihat **premium, intentional, dan memiliki identitas brand yang kuat** — bukan seperti output UI generik ("AI slop"). Perubahan tetap mempertahankan kemudahan penggunaan untuk marketplace escrow USDC yang melibatkan manusia dan AI agents.

---

## 2. Design Principles

1. **Brand-first, not template-first.** Setiap elemen visual harus bisa ditelusuri kembali ke identitas Arc WorkNet: escrow, trust, USDC, Arc chain, manusia & agen.
2. **Restraint over decoration.** Efek visual hanya digunakan untuk mendukung hierarki dan feedback, bukan untuk mengisi ruang.
3. **Clarity through hierarchy.** Typography, spacing, dan warna dibuat sedemikian rupa sehingga pengguna tahu apa yang utama, sekunder, dan interaktif dalam 1 detik.
4. **Human + machine.** UI harus terasa profesional dan teknis, tetapi tidak dingin — cocok untuk client, worker, maupun agent owner.
5. **Consistency across surfaces.** Landing page dan app dashboard menggunakan bahasa visual yang sama (tokens, type scale, radius, shadow).

---

## 3. Visual Identity

### 3.1 Mood

Premium, tenang, tepercaya, onchain-aware tanpa terlihat "crypto bro".

### 3.2 Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background primary | `#F9FAF6` | Page background, warm off-white |
| Surface | `#FFFFFF` | Cards, panels, inputs |
| Brand primary | `#0F7A3E` | Primary buttons, active nav, links, success |
| Brand hover | `#0B5C2E` | Primary button hover |
| Brand soft | `#D4F5E0` | Hover backgrounds, success badges, highlights |
| Brand accent | `#B9F246` | Lime accent for secondary CTAs / promo (very limited) |
| Ink | `#151515` | Primary text |
| Ink secondary | `#4A4F4C` | Body text, descriptions |
| Muted | `#6E756F` | Captions, placeholders, disabled |
| Hairline | `#E3E5E0` | Borders, dividers |
| Border input | `#D8DAD5` | Form input borders |
| Warning | `#D4A017` | Warning states |
| Error | `#DC2626` | Error states |
| Onchain / info | `#4F46E5` | Arcscan links, chain metadata |

### 3.3 Typography

- **Display / headings:** `Plus Jakarta Sans` (Google Fonts), weight 600–700, letter-spacing `-0.02em`.
- **Body:** `Inter`, weight 400/500, line-height `1.55`.
- **Mono:** `JetBrains Mono` untuk label, wallet addresses, status metadata.

**Type scale**

| Token | Size | Line-height | Weight | Usage |
|-------|------|-------------|--------|-------|
| Display | 48px | 56px | 700 | Landing hero headline |
| H1 | 32px | 40px | 700 | Page title |
| H2 | 24px | 32px | 600 | Panel title, section heading |
| H3 | 18px | 24px | 600 | Card title, subsection |
| Body | 15px | 24px | 400 | Paragraphs |
| Body small | 13px | 20px | 500 | Secondary text |
| Caption mono | 11px | 16px | 500 | Labels, uppercase, tracking `0.04em` |

### 3.4 Geometry

- **Radius scale:** `sm` 8px (inputs, small buttons), `md` 12px (cards), `lg` 16px (panels), `xl` 24px (hero/search), `pill` 9999px.
- **Shadows:** sangat subtle, warm grey:
  - `sm`: `0 1px 2px rgba(15,23,18,0.04), 0 4px 12px rgba(15,23,18,0.06)`
  - `md`: `0 8px 24px rgba(15,23,18,0.08)`
  - `lg`: `0 16px 40px rgba(15,23,18,0.10)`
- **Spacing:** 4px base scale, section gaps 64–96px on landing.

---

## 4. Layout & Shell

### 4.1 App Shell

- **Sidebar** lebar 260px, background sama dengan page (`#F9FAF6`) agar ringan.
- **Nav link aktif:** pill dengan background brand-soft + teks brand-primary.
- **Nav link inactive:** muted, hover subtle warm-grey background.
- **Sidebar head:** logo mark + wordmark "Arc WorkNet".
- **Wallet panel:** compact address pill + balance; popover tetap ada dengan visual lebih rapi.
- **Mobile:** floating bottom bar untuk 4 item utama (Jobs, Workers, Wallet, Menu), menggantikan hamburger-only top bar.

### 4.2 Page Header

- Eyebrow mono uppercase dengan icon kontekstual.
- Title H1 32px, line-height tight.
- Actions di kanan: secondary button + primary CTA, semua dengan icon.

### 4.3 Landing Page Structure

1. **Hero:** full-width warm off-white, headline besar, subhead, CTA row, stats/social proof, SVG abstract geometric di kanan.
2. **Problem:** 3 card border halus dengan icon stroke.
3. **How it works:** horizontal stepper dengan garis penghubung.
4. **Marketplace:** 2-column layout (for clients / for workers + agents).
5. **Why Arc:** grid 2x2 card dengan icon filled soft.
6. **Job teaser:** 2–3 job card dengan hover lift.
7. **Final CTA:** dark band `#0B2E1A` dengan teks putih.
8. **Footer:** minimal 3-column, border top.

---

## 5. Components

### 5.1 Buttons

- **Primary:** solid brand-primary, white text, radius 10px, height 44px, icon leading.
- **Secondary:** white bg, border hairline, ink text, hover bg warm-grey.
- **Ghost:** ink text, underline on hover, no background.
- **Focus:** ring brand-primary/20.

### 5.2 Cards & Panels

- **Card:** border 1px hairline, radius 12px, padding 24px, shadow sangat subtle saat hover.
- **Panel:** sama dengan card, lebih menonjol sebagai section utama.
- **Stat card:** icon di atas, angka besar (H2), label mono caption.

### 5.3 Badges & Status

- Pill dengan dot, warna semantic:
  - `open` / `submitted` → neutral
  - `funded` → brand-soft
  - `completed` → success-soft
  - `revision_requested` / `funding_pending` → warning-soft
  - `disputed` / `rejected` / `cancelled` → error-soft

### 5.4 Forms

- Input height 44px, border `#D8DAD5`, focus ring brand-primary/20.
- Label mono uppercase kecil di atas input.
- Select & search dengan icon di kiri.

### 5.5 Job Row

- Grid: kiri (title + tags + actor), tengah (budget + status), kanan (save + action).
- Hover: border lebih gelap + bg warm grey.
- Mobile: stacked card.

---

## 6. Page-Level Changes

### 6.1 Dashboard

- Stat grid responsif (4 → 2 kolom di mobile).
- Panel "For you" dengan matched skill tags (brand-soft).
- "Active work" dengan job row baru.
- Rail kanan: "Next actions" dan "Latest tx" lebih compact.

### 6.2 Jobs Page

- Filter bar: search rounded-xl, filter chips, clear filter.
- Empty state: icon + title + description + action.
- Saved toggle: outline style, active filled.

### 6.3 Job Detail

- Header: category eyebrow + title + status badge + CTA row.
- 2-column layout: main + rail.
- Escrow timeline dengan stepper visual.
- Application cards: header avatar + actions, pitch di bawah.
- Messages: bubble chat style (mine vs others).

### 6.4 Wallet

- Balance cards: spendable vs escrowed.
- Network warning sebagai banner.
- Action cards: deposit/withdraw/browse jobs.

### 6.5 Onboarding

- 3-step wizard dengan progress stepper diperindah.
- Role selection: card besar dengan icon + hint, selected state brand-soft border.
- Form fields lebih bernapas, bottom sticky buttons.

### 6.6 Settings / Admin / Workers / Applications / Agents

- Konsisten ke pola panel + table/card.
- Admin tables: header mono, row hover, status badge.

---

## 7. Motion & Interaction

- Transisi: 150–250ms `cubic-bezier(0.16, 1, 0.3, 1)`.
- Hover pada card: border + shadow, **bukan scale** (hindari layout shift).
- Landing scroll reveal tetap ada tetapi diperhalus.
- Toast masuk dari bawah dengan fade + slide.
- Sidebar drawer mobile: slide dari kanan.
- `prefers-reduced-motion`: disable scroll reveal dan scale animations.

---

## 8. Responsive & Accessibility

### Responsive breakpoints

- Mobile: < 640px
- Tablet: 640–1023px
- Desktop: 1024px+

### Key behavior

- Sidebar → bottom bar + drawer.
- Stat grid → 2 kolom di tablet/mobile.
- Job row → stacked card di mobile.
- Landing typography scale down 20–30% di mobile.

### Accessibility

- Kontras teks minimum 4.5:1.
- Focus ring visible di semua elemen interaktif.
- Semua ikon dari Lucide (SVG), **tidak ada emoji sebagai ikon UI**.
- Label terasosiasi dengan input.
- Reduced motion dihormati.

---

## 9. Anti-Patterns / No AI Slop Checklist

- [ ] Tidak ada emoji sebagai ikon UI.
- [ ] Tidak ada ilustrasi 3D generik di landing.
- [ ] Tidak ada shadow arbitrary atau warna yang tidak ada di token.
- [ ] Tidak ada button radius campur aduk (hanya 8px / 10px / pill).
- [ ] Tidak ada teks body di bawah 15px.
- [ ] Tidak ada hover yang menyebabkan layout shift.
- [ ] Tidak ada `cursor: default` pada elemen klik.
- [ ] Tidak ada border putih/transparent yang tidak terlihat di light mode.

---

## 10. Implementation Notes

- Semua perubahan styling lewat `tokens.css` dan `globals.css`.
- Landing page styles di `landing.css` diperbarui.
- Komponen React diperbarui untuk memakai class/className yang konsisten (tidak menambah library UI baru).
- Tidak menambah dependency baru; font dari Google Fonts di-load via `next/font` jika memungkinkan, atau CSS import.
- Supabase schema dan smart contract flow **tidak berubah**.

---

## 11. Open Decisions

1. Apakah akan menambahkan dark mode? (Tidak dalam scope awal; desain ini light-first.)
2. Apakah akan membuat custom SVG hero illustration atau memakai abstract CSS/SVG sederhana? (Direkomendasikan: CSS/SVG sederhana agar tidak generik.)
3. Apakah akan mengganti logo menjadi SVG mark, atau tetap wordmark saja? (Direkomendasikan: buat simple geometric mark.)
