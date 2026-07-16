# Design System Inspired by Upwork

## 1. Visual Theme & Atmosphere

Upwork's design system embodies a modern, professional yet approachable marketplace aesthetic. The visual identity combines vibrant, energetic green accents with a clean, neutral foundation, creating an interface that feels both trustworthy and forward-thinking. The design emphasizes clarity and efficiency, reflecting the platform's role as a connector between global talent and opportunity. Bold typography, generous whitespace, and strategic use of color establish a confident yet accessible digital workspace. The system balances minimalist principles with purposeful visual hierarchy, allowing users to navigate complex workflows with ease while maintaining visual delight through thoughtful accent colors and micro-interactions.

**Key Characteristics**

- Fresh, energy-forward green as primary brand color signaling growth and opportunity
- Clean, minimal aesthetic with strategic negative space
- Modern geometric forms with subtle rounded corners
- Accessible contrast ratios supporting all user types
- Efficient, task-oriented interface design
- Global marketplace sensibility with professional polish
- AI-ready component structure supporting intelligent workflows

## 2. Color Palette & Roles

### Primary

- **Brand Green** (`#108A00`): Primary action buttons, key CTAs, brand identity, success indicators, and interactive elements
- **Deep Black** (`#181818`): Primary text, interface structure, and foundational UI elements

### Accent Colors

- **Lime Light** (`#95DF00`): Energetic highlights, emphasis accents, notification badges
- **Soft Green** (`#A9F9B2`): Subtle backgrounds, hover states, light accent applications
- **Light Green** (`#95E79B`): Secondary accents, tinted backgrounds, gentle visual emphasis
- **Pale Lime** (`#DFF69B`): Promotional backgrounds, announcement banners, attention-grabbing zones
- **Deep Purple** (`#3D05AE`): Tertiary accent for feature differentiation, interactive states
- **Teal** (`#13544E`): Secondary brand extension, status indicators

### Interactive

- **Link Green** (`#108A00`): Interactive links and underline focus states
- **Ghost Button Background** (`#FFFFFF`): White background for secondary actions with green text

### Neutral Scale

- **Charcoal Dark** (`#1A1A1A`): Deep text, strong emphasis, high contrast needs
- **Off-Black** (`#2E2E2E`): Secondary dark text, subtle hierarchy
- **Medium Gray** (`#676767`): Tertiary text, disabled states, subtle UI elements
- **Light Gray** (`#E9E9E9`): Dividers, faint borders, minimal contrast backgrounds
- **Border Gray** (`#D4DBE2`): Input borders, card separators
- **Surface Gray** (`#E0E6EB`): Button backgrounds, secondary action surfaces

### Surface & Borders

- **White** (`#FFFFFF`): Primary surface, card backgrounds, input fields
- **Light Surface** (`#E0E6EB`): Secondary buttons, subtle backgrounds
- **Border Accent** (`#D4DBE2`): Subtle borders, form input outlines

### Semantic / Status

- **Success Green** (`#14A800`): Positive confirmations, completion states, success messages
- **Warning Yellow** (`#D9C407`): Caution alerts, warnings requiring attention
- **Error Red** (`#FF4B25`): Primary error state, destructive actions, critical alerts
- **Danger Deep Red** (`#C70E05`): Secondary error, critical system failures

## 3. Typography Rules

### Font Family

**Primary Font:** Neue Montreal
- Font stack: `"Neue Montreal", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Weights available: 400 (Regular), 500 (Medium), 550 (Semibold), 600 (Bold)

**Fallback:** System fonts supporting sans-serif rendering across all platforms

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display/Hero | Neue Montreal | 72px | 550 | 74.88px | 0px | Large headlines for page heroes and maximum impact |
| Heading 1 | Neue Montreal | 40px | 550 | 44px | 0px | Primary section headings, modal titles |
| Heading 2 | Neue Montreal | 20px | 550 | 24px | 0px | Secondary headings, section subheadings |
| Heading 3 | Neue Montreal | 16px | 600 | 24px | 0px | Card titles, subsection headers |
| Heading 4 | Neue Montreal | 12px | 600 | 18px | 0px | Label text, small headings, form headers |
| Body / Paragraph | Neue Montreal | 16px | 400 | 24px | 0px | Default body text, paragraphs |
| Body Small | Neue Montreal | 14px | 500 | 20px | 0px | Secondary body text, descriptions |
| Button | Neue Montreal | 17px | 400 | 24.29px | 0px | Call-to-action buttons, primary interactions |
| Link | Neue Montreal | 16px | 500 | 22.86px | 0px | Hyperlinks, inline navigation |
| Link Small | Neue Montreal | 14px | 500 | 20px | 0px | Footer links, secondary navigation |
| Caption | Neue Montreal | 12px | 400 | 18px | 0px | Captions, helper text, form hints |

### Principles

- **Clear hierarchy:** Weight and size increase proportionally to establish visual structure without excessive contrast
- **Readable defaults:** 16px minimum for body text ensures accessibility; 24px line height maintains comfortable reading rhythm
- **Purposeful weights:** 550 weight reserved for headings; 400–500 for body to reduce cognitive load
- **Generous leading:** Line heights consistently set above 1.4x font size for open, spacious reading experience
- **Button emphasis:** 17px button text at 400 weight creates approachable yet distinct call-to-action
- **Link consistency:** Green color paired with medium weight provides clear interactive affordance

## 4. Component Stylings

### Buttons

#### Primary Button (Brand Green CTA)

- **Background Color:** `#108A00`
- **Text Color:** `#FFFFFF`
- **Font Size:** 17px
- **Font Weight:** 400
- **Font Family:** Neue Montreal
- **Padding:** 14px 24px
- **Border Radius:** 8px
- **Border:** None
- **Line Height:** 24.29px
- **Min Height:** 48px
- **Hover State:** Background darkens to `#0D6B00`; text remains white
- **Active State:** Background lightens with 0.2 opacity overlay; shadow depth increases
- **Disabled State:** Background becomes `#D4DBE2`; text becomes `#676767`; cursor not-allowed

#### Secondary Button (Ghost with Green Text)

- **Background Color:** `#FFFFFF`
- **Text Color:** `#108A00`
- **Font Size:** 17px
- **Font Weight:** 400
- **Font Family:** Neue Montreal
- **Padding:** 14px 24px
- **Border Radius:** 8px
- **Border:** 1px solid `#108A00`
- **Line Height:** 24.29px
- **Min Height:** 48px
- **Hover State:** Background becomes `#DFF69B`; text remains `#108A00`; border color stays `#108A00`
- **Active State:** Background opacity increases; border weight increases to 2px
- **Disabled State:** Border and text become `#D4DBE2`; background remains white

#### Tertiary Button (Minimal)

- **Background Color:** transparent
- **Text Color:** `#181818`
- **Font Size:** 14px
- **Font Weight:** 500
- **Font Family:** Neue Montreal
- **Padding:** 12px 0px
- **Border Radius:** 0px
- **Border:** None
- **Line Height:** 20px
- **Hover State:** Text underline appears; color remains `#181818`
- **Active State:** Text color shifts to `#108A00`; underline persists
- **Disabled State:** Text becomes `#D4DBE2`

#### Icon Button (Outline)

- **Background Color:** `#E0E6EB`
- **Text Color:** `#181818`
- **Font Size:** 14px
- **Font Weight:** 600
- **Font Family:** Neue Montreal
- **Padding:** 8px 32px
- **Border Radius:** 8px
- **Border:** None
- **Line Height:** 22px
- **Min Height:** 38px
- **Hover State:** Background darkens to `#D4DBE2`; text remains `#181818`
- **Active State:** Background becomes `#108A00`; text becomes `#FFFFFF`

### Cards & Containers

#### Base Card

- **Background Color:** `#FFFFFF`
- **Border Radius:** 12px
- **Padding:** 24px
- **Border:** None
- **Box Shadow:** `rgba(23, 23, 23, 0.08) 2px 2px 8px 2px, rgb(233, 233, 233) 0px 0px 0px 1px`
- **Text Color:** `#181818`
- **Font Size:** 14px
- **Font Weight:** 500
- **Line Height:** 20px
- **Hover State:** Shadow depth increases to `rgba(24, 24, 24, 0.12) 0px 12px 32px 0px`

#### Featured/Elevated Card

- **Background Color:** `#FFFFFF`
- **Border Radius:** 16px
- **Padding:** 32px
- **Border:** None
- **Box Shadow:** `rgba(24, 24, 24, 0.12) 0px 12px 32px 0px`
- **Text Color:** `#181818`
- **Font Size:** 14px
- **Font Weight:** 500
- **Line Height:** 20px

#### Promotional Card (Banner)

- **Background Color:** `#DFF69B`
- **Border Radius:** 12px
- **Padding:** 24px
- **Border:** None
- **Box Shadow:** None
- **Text Color:** `#181818`
- **Font Size:** 16px
- **Font Weight:** 500
- **Line Height:** 24px

### Inputs & Forms

#### Text Input (Standard)

- **Background Color:** `#FFFFFF`
- **Text Color:** `#181818`
- **Font Size:** 16px
- **Font Weight:** 500
- **Font Family:** Neue Montreal
- **Padding:** 12px 24px
- **Border Radius:** 8px
- **Border:** 1px solid `#D4DBE2`
- **Line Height:** 24px
- **Min Height:** 48px
- **Placeholder Color:** `#676767`
- **Focus State:** Border color becomes `#108A00`; box-shadow: `0px 0px 0px 3px rgba(16, 138, 0, 0.1)`
- **Error State:** Border becomes `#FF4B25`; text color remains `#181818`; helper text appears in red
- **Disabled State:** Background becomes `#E9E9E9`; text becomes `#D4DBE2`; cursor not-allowed

#### Search Input (Rounded)

- **Background Color:** `#FFFFFF`
- **Text Color:** `#181818`
- **Font Size:** 14px
- **Font Weight:** 400
- **Font Family:** Neue Montreal
- **Padding:** 11px 16px 11px 16px
- **Border Radius:** 24px
- **Border:** 1px solid `#8D8C8C`
- **Line Height:** 22px
- **Min Height:** 40px
- **Icon Color:** `#108A00`
- **Focus State:** Border becomes `#108A00`; background remains white
- **Disabled State:** Border becomes `#D4DBE2`; background becomes `#F5F5F5`

#### Textarea

- **Background Color:** `#FFFFFF`
- **Text Color:** `#181818`
- **Font Size:** 14px
- **Font Weight:** 400
- **Font Family:** Neue Montreal
- **Padding:** 12px 16px
- **Border Radius:** 8px
- **Border:** 1px solid `#D4DBE2`
- **Line Height:** 20px
- **Min Height:** 100px
- **Placeholder Color:** `#676767`
- **Focus State:** Border becomes `#108A00`; box-shadow: `0px 0px 0px 3px rgba(16, 138, 0, 0.1)`

### Navigation

#### Primary Navigation Bar

- **Background Color:** `#FFFFFF`
- **Height:** 64px
- **Padding:** 0px 24px
- **Border Bottom:** 1px solid `#E0E6EB`
- **Font Size:** 14px
- **Font Weight:** 500
- **Text Color:** `#181818`
- **Alignment:** flex, space-between, center
- **Logo Color:** `#181818`
- **Logo Size:** 24px height

#### Navigation Link (Inactive)

- **Text Color:** `#181818`
- **Font Size:** 14px
- **Font Weight:** 500
- **Padding:** 8px 12px
- **Border Bottom:** None
- **Hover State:** Text color becomes `#108A00`; underline appears
- **Active State:** Text color becomes `#108A00`; border-bottom: 2px solid `#108A00`

#### Navigation Dropdown

- **Background Color:** `#FFFFFF`
- **Border Radius:** 8px
- **Box Shadow:** `rgba(24, 24, 24, 0.12) 0px 12px 32px 0px`
- **Min Width:** 200px
- **Padding:** 8px 0px

#### Dropdown Item

- **Padding:** 12px 16px
- **Font Size:** 14px
- **Font Weight:** 500
- **Text Color:** `#181818`
- **Hover State:** Background becomes `#F5F5F5`
- **Active State:** Background becomes `#DFF69B`; text remains `#181818`

### Badges

#### Success Badge

- **Background Color:** `#A9F9B2`
- **Text Color:** `#0D6B00`
- **Font Size:** 12px
- **Font Weight:** 600
- **Padding:** 4px 12px
- **Border Radius:** 12px
- **Border:** None
- **Line Height:** 16px

#### Warning Badge

- **Background Color:** `#FFF3CD`
- **Text Color:** `#D9C407`
- **Font Size:** 12px
- **Font Weight:** 600
- **Padding:** 4px 12px
- **Border Radius:** 12px
- **Border:** None
- **Line Height:** 16px

#### Error Badge

- **Background Color:** `#FFE5DC`
- **Text Color:** `#FF4B25`
- **Font Size:** 12px
- **Font Weight:** 600
- **Padding:** 4px 12px
- **Border Radius:** 12px
- **Border:** None
- **Line Height:** 16px

### Tags/Chips

#### Default Tag

- **Background Color:** `#E0E6EB`
- **Text Color:** `#181818`
- **Font Size:** 14px
- **Font Weight:** 500
- **Padding:** 8px 12px
- **Border Radius:** 16px
- **Border:** None
- **Line Height:** 20px
- **Hover State:** Background becomes `#D4DBE2`

#### Active Tag

- **Background Color:** `#108A00`
- **Text Color:** `#FFFFFF`
- **Font Size:** 14px
- **Font Weight:** 500
- **Padding:** 8px 12px
- **Border Radius:** 16px
- **Border:** None

## 5. Layout Principles

### Spacing System

**Base Unit:** 4px

**Scale:**
- 4px: Micro-spacing between tight elements, icon padding
- 8px: Small gaps, minimal separation
- 12px: Compact spacing, label margins
- 16px: Standard padding, button spacing
- 24px: Medium padding, card internal spacing
- 32px: Large padding, section spacing
- 40px: Extra-large margin, major section separation
- 48px: Hero/banner padding, prominent sections
- 64px: Large vertical rhythm, page sections
- 80px: Extra-large vertical sections
- 100px: Maximum page section gaps

**Usage Context:**
- Micro (4px–8px): Between icon and text, within button groups
- Standard (16px–24px): Card padding, button padding, input padding
- Section (40px–100px): Between major page sections, hero margins

### Grid & Container

- **Max Width:** 1280px (with 24px gutter on each side = 1328px total viewport)
- **Column Strategy:** 12-column grid system with 16px gutter
- **Container Padding:** 24px on desktop, 16px on tablet, 12px on mobile
- **Content Width:** Maximum 1200px for readable body content
- **Section Pattern:** Full-width sections with centered content containers

### Whitespace Philosophy

Upwork's design embraces generous whitespace to reduce cognitive load and create breathing room around content. Margins and padding consistently use the 4px base scale, scaling to accommodate visual weight. Sections are separated by at least 64px vertical space, allowing users to parse information in digestible chunks. Within components, internal padding maintains a minimum of 12px to ensure comfortable touch targets and visual clarity.

### Border Radius Scale

- **0px:** Minimal/structural components without visual softening
- **8px:** Input fields, small buttons, secondary cards
- **12px:** Primary cards, moderate emphasis containers
- **16px:** Elevated cards, featured containers, image borders
- **24px:** Search inputs, expanded forms, significant emphasis
- **50%:** Avatar images, circular components

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Base (No Shadow) | None | Flat backgrounds, disabled states, minimal emphasis |
| Subtle (sm) | `rgba(23, 23, 23, 0.08) 2px 2px 8px 2px, rgb(233, 233, 233) 0px 0px 0px 1px` | Standard cards, modest elevation, default container state |
| Medium (md) | `rgba(24, 24, 24, 0.12) 0px 12px 32px 0px` | Dropdowns, elevated cards, hover states, featured content |
| Raised (lg) | `rgba(24, 24, 24, 0.16) 0px 20px 48px 0px` | Modals, overlays, maximum emphasis |

**Shadow Philosophy:**

Upwork employs a restrained shadow system that creates subtle depth without visual heaviness. Shadows are calibrated to indicate elevation hierarchy: base cards use soft, compact shadows; dropdowns and elevated surfaces use slightly larger, more diffused shadows; modals and overlays receive the deepest shadows. The shadow palette prioritizes legibility and does not distract from content, maintaining Upwork's clean, professional aesthetic. All shadows use dark gray (`rgba(24, 24, 24, ...)`) with varying opacity levels to create natural lighting gradients.

## 7. Do's and Don'ts

### Do

- **Use Brand Green (`#108A00`) for all primary CTAs.** Buttons labeled "Sign up," "Hire," or "Start working" should always use this color to establish consistent visual language.
- **Maintain 48px minimum height for interactive elements.** Buttons, inputs, and clickable areas must meet this standard for comfortable touch interaction.
- **Apply generous padding (16px–24px) inside containers.** This creates visual breathing room and reduces cognitive strain.
- **Use Neue Montreal font consistently across all text roles.** The font is licensed and optimized for Upwork's brand identity.
- **Choose appropriate font weights intentionally:** 400 for body and buttons, 500 for emphasis, 550 for headings, 600 for strong emphasis and labels.
- **Implement focus states with `0px 0px 0px 3px rgba(16, 138, 0, 0.1)` box-shadow** on all interactive elements for keyboard navigation accessibility.
- **Default to 16px font size for body text** and ensure line heights of at least 24px for comfortable reading.
- **Nest cards within 24px–32px padding containers** to maintain consistent internal spacing and support readability.
- **Use semantic colors for status indicators:** green for success, yellow for warning, red for error.
- **Test color contrast ratios** to meet WCAG AA standards (4.5:1 for text, 3:1 for graphics).

### Don't

- **Do not use accent colors (`#95DF00`, `#DFF69B`, `#A9F9B2`) as primary button backgrounds.** Reserve these for highlights, banners, and tertiary emphasis only.
- **Avoid using pure black (`#000000`).** Always use `#181818` or `#1A1A1A` for text and structural elements to reduce eye strain.
- **Do not create custom shadows.** Always reference the defined shadow system (sm, md, lg).
- **Avoid button border-radius values other than 0px or 8px.** These are the only approved values for button components.
- **Do not mix font families within a single interface section.** Neue Montreal must be used exclusively for all text.
- **Avoid padding values that are not multiples of 4px.** Maintain consistency with the 4px base unit.
- **Do not apply shadows to text elements.** Shadows are reserved for elevated containers and interactive components.
- **Avoid link colors other than `#108A00`.** Green is the exclusive color for all hyperlinks to maintain consistent interaction affordance.
- **Do not reduce line height below 1.4x the font size.** Minimum line heights are 18px for 12px text and 24px for 16px text.
- **Avoid overusing the pale green (`#DFF69B`) background in high-frequency components.** Reserve this color for promotional zones and announcements only.

## 8. Responsive Behavior

### Breakpoints

| Breakpoint Name | Width | Key Changes |
|-----------------|-------|-------------|
| Mobile | 320px–639px | Single column, full-width cards, 12px padding, stacked navigation, 14px base font, 40px section gaps |
| Tablet | 640px–1023px | Two-column grid, 16px padding, sidebar navigation drawer, 16px base font, 64px section gaps |
| Desktop | 1024px–1279px | Multi-column grid, 24px padding, horizontal navigation, 16px base font, 80px section gaps |
| Wide | 1280px+ | 12-column grid, centered max-width 1200px content, 24px padding, full navigation, 100px section gaps |

### Touch Targets

- **Minimum Touch Target:** 48px × 48px for all interactive elements (buttons, inputs, links, touch-sensitive zones)
- **Comfortable Spacing:** At least 8px between adjacent touch targets to prevent accidental activation
- **Icon Buttons:** 40px × 40px minimum for icon-only buttons; 48px × 48px preferred
- **Form Inputs:** 48px height standard; 44px minimum
- **Navigation Items:** 44px minimum height for tap targets in header/footer

### Collapsing Strategy

- **Mobile (320px–639px):**
  - Primary navigation collapses into hamburger menu
  - Hero typography scales: h1 from 72px → 36px; h2 from 40px → 24px
  - Cards expand to full width with 12px margins
  - Multi-column grids collapse to single column
  - Padding reduces from 24px → 12px on sides
  - Section gaps reduce from 80px → 40px
  - Buttons expand to full width when stacked

- **Tablet (640px–1023px):**
  - Primary navigation may shift to secondary navigation drawer
  - Two-column grid layouts become primary
  - Hero typography scales: h1 from 72px → 48px; h2 from 40px → 28px
  - Cards retain 16px margins with 16px padding
  - Section gaps adjust to 64px
  - Side padding becomes 16px

- **Desktop & Wide (1024px+):**
  - Full horizontal navigation visible
  - Multi-column and complex grid layouts enabled
  - Max-width container centered with 24px gutters
  - Full typography scale applied
  - 80px–100px section gaps
  - Cards display in grid layouts

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA Button:** Brand Green (`#108A00`) background with white text
- **Secondary Button:** White (`#FFFFFF`) background with Brand Green (`#108A00`) border and text
- **Body Text:** Deep Black (`#181818`)
- **Heading Text:** Deep Black (`#181818`)
- **Links:** Brand Green (`#108A00`)
- **Success State:** Success Green (`#14A800`)
- **Error State:** Error Red (`#FF4B25`)
- **Warning State:** Warning Yellow (`#D9C407`)
- **Background/Cards:** White (`#FFFFFF`)
- **Secondary Button Background:** Light Surface (`#E0E6EB`)
- **Disabled State:** Border Gray (`#D4DBE2`) with Medium Gray (`#676767`) text
- **Promotional Background:** Pale Lime (`#DFF69B`)
- **Hover Overlay:** Soft Green (`#A9F9B2`) or darkened base color

### Iteration Guide

1. **Font Consistency:** Always use Neue Montreal at the weights specified (400/500/550/600). No exceptions. Default body text is 16px weight 400 with 24px line height.

2. **Button Implementation:** Primary buttons are `#108A00` background with white text, 14px–17px font size, 48px minimum height, 8px border-radius. Secondary buttons invert colors with border. Tertiary buttons are transparent with hover underline.

3. **Input Fields:** All text inputs use 48px minimum height, 8px border-radius for standard inputs (24px for search), 12px–24px padding, `#D4DBE2` border, and `#108A00` focus ring (`0px 0px 0px 3px rgba(16, 138, 0, 0.1)`).

4. **Cards:** Base cards use `#FFFFFF` background, 12px border-radius, 24px padding, soft shadow (`rgba(23, 23, 23, 0.08) 2px 2px 8px 2px`). Elevated cards use 16px radius with medium shadow (`rgba(24, 24, 24, 0.12) 0px 12px 32px 0px`).

5. **Spacing Scale:** All spacing adheres to 4px base unit. Common values: 8px gaps, 16px standard padding, 24px card padding, 40px–64px section margins. Never use arbitrary values.

6. **Text Hierarchy:** Display (72px, weight 550), Heading 1 (40px, weight 550), Heading 2 (20px, weight 550), Heading 3 (16px, weight 600), Body (16px, weight 400), Small Body (14px, weight 500), Caption (12px, weight 400). Always maintain minimum 20px line height for readability.

7. **Interactive States:** Every interactive element must have distinct hover, active, focus, and disabled states. Hover typically darkens or adds color tint. Focus always includes green ring. Disabled elements use gray (`#D4DBE2`/`#676767`) with reduced opacity.

8. **Shadows:** Use only the three defined levels: subtle (sm), medium (md), or raised (lg). Never create custom shadow values. Shadows always use dark gray with opacity layers: 0.08 (subtle), 0.12 (medium), 0.16 (raised).

9. **Responsive Design:** Mobile breakpoint (320px) uses 12px padding and 40px gaps. Tablet (640px) uses 16px padding and 64px gaps. Desktop (1024px+) uses 24px padding and 80px–100px gaps. Touch targets minimum 48px. All font sizes maintain readability across breakpoints with proportional scaling.

10. **Brand Color Strategy:** Green (`#108A00`) is reserved for primary CTAs, links, success states, and interactive affordances. Accent greens (`#95DF00`, `#A9F9B2`, `#DFF69B`) are used sparingly for highlights and promotional content. Neutral blacks (`#181818`, `#1A1A1A`) dominate text; grays provide secondary hierarchy. Status colors (red, yellow) are strict semantic indicators.