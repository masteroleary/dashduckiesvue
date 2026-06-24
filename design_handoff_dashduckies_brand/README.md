# Handoff: DashDuckies Brand Identity & Dashboard

## Overview
DashDuckies is a collector's app for tracking rubber ducks ("Find 'em · Badge 'em · Keep 'em"). This package contains the brand identity system and a dashboard UI mockup. It covers the logo, color palette, typography, the signature octagon "duck badge" component, and a working dashboard layout that shows the brand applied in product.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing the intended look and behavior, **not production code to copy directly**. They are authored as "Design Components" (a custom HTML format with `<x-dc>` wrappers, `support.js`, and `image-slot.js` helpers) that won't run as-is in a normal app.

Your task is to **recreate these designs in the target codebase's existing environment** (React, Vue, SwiftUI, native, etc.) using its established patterns, component library, and styling approach. If no codebase exists yet, choose the most appropriate framework for the project and implement the designs there. Ignore the `<x-dc>`, `<sc-for>`, `{{ }}` template syntax, and `support.js` — those are artifacts of the prototyping tool. Translate the markup, inline styles, and data into idiomatic components.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, border radii, and the octagon geometry are all final and intentional. Recreate the UI pixel-accurately using the codebase's libraries. The duck photos are sample data; the badge/photo *mechanism* is the real spec.

---

## Design Tokens

### Colors
| Name | Hex | Role |
|---|---|---|
| Bronze | `#A87D2C` | Primary accent (logo, buttons, links, active states) |
| Gold | `#D4AF37` | Highlight / metallic shine |
| Lamplight | `#ECD286` | Lightest metallic — top of gold gradients |
| Ink | `#0C0B0A` | Page background |
| Pitch | `#16140F` | Panels & cards (also `#13110C`, `#15120C`, `#100E0A` as near-black panel variants) |
| Cream | `#F5EFDF` | Primary text on dark |
| — | `#CFC7B2` | Secondary text / body copy on dark |
| — | `#9C947F` | Muted text / captions |
| — | `#7D765F` | Faint text / timestamps |
| — | `#C0524A` | Error / "don't" indicator (red dot) only |

**Signature gold gradient** (used on every badge frame, app icon, avatar):
`linear-gradient(150deg, #ECD286, #A87D2C)`

**Hairline borders:** `1px solid rgba(212,175,55,0.14)` to `rgba(168,125,44,0.2)` — a low-opacity gold, not gray. Use ~0.12–0.20 alpha depending on emphasis.

**Selection highlight:** background `#A87D2C`, text `#0C0B0A`.

### Typography
Two Google Fonts:
- **Fredoka** (weights 400/500/600/700) — display & headings. Rounded, friendly, confident. Headings use weight 600 with `letter-spacing: -0.01em` to `-0.02em`.
- **Hanken Grotesk** (weights 400/500/600/700/800) — body, UI, long lists, dashboard. Clean and neutral.
- **Monospace** (`ui-monospace, Menlo, monospace`) — eyebrow labels, metadata, codes. Always `text-transform: uppercase` with wide `letter-spacing` (0.06em–0.42em).

Google Fonts import:
```
https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap
```

### Type scale (observed)
- Hero H1: Fredoka 600, 88px, line-height 0.96, `-0.02em`
- Section H2: Fredoka 600, 38px (34px on logo sheet)
- Card title: Fredoka 600, 17px
- Dashboard H3: Fredoka 600, 30px
- Body lead: Hanken 400, 21px, line-height 1.5
- Body: Hanken 400/500, 15–16px, line-height 1.5–1.6
- Eyebrow / mono label: 11–12px, uppercase, letter-spacing 0.18em–0.24em

### Radii
- Large panels / dashboard shell: 18–22px
- Cards: 14–16px
- Pills / tags: 24px (fully rounded)
- Octagon badges: not a radius — a clip-path (see below)

### Shadows
- Hero badge: `drop-shadow(0 24px 40px rgba(0,0,0,0.6))`
- Badge frames: `drop-shadow(0 14px 24px rgba(0,0,0,0.5))`
- Dashboard shell: `0 30px 70px rgba(0,0,0,0.55)`

---

## The Duck Mark (logo SVG)
A single rubber-duck glyph, used everywhere. It's a 64×64 viewBox path, horizontally flipped via `transform="translate(64,0) scale(-1,1)"`. Recolor by setting `fill` (or `fill="currentColor"` + CSS `color`) — default brand color `#A87D2C`.

```html
<svg width="64" height="64" viewBox="0 0 64 64">
  <g transform="translate(64,0) scale(-1,1)">
    <path fill="currentColor" fill-rule="evenodd" d="M17.406,25.591c0,0 2.059,0.83 1.986,2.891c-0.072,2.062 -6.66,2.957 -6.66,11.094c0,8.137 9.096,14.532 19.217,14.532c10.12,0 23.872,-5.932 23.872,-17.83c0,-19.976 -1.513,-6.134 -17.276,-6.134c-5.235,0 -6.169,-1.787 -5.342,-2.806c3.91,-4.811 5.342,-17.446 -7.42,-17.446c-8.327,0.173 -10.338,6.946 -10.325,8.587c0.008,1.153 -1.204,1.543 -7.308,1.308c-1.536,5.619 9.256,5.804 9.256,5.804Zm3.77,-10.366c1.104,0 2,0.897 2,2c0,1.104 -0.896,2 -2,2c-1.103,0 -2,-0.896 -2,-2c0,-1.103 0.897,-2 2,-2Z"></path>
  </g>
</svg>
```
The same path also lives as `assets/duck-icon.svg`. Build this as a reusable Icon component (`<DuckMark size color />`).

## The Octagon Badge (signature component)
The brand's hero device. A gold-framed octagon holding a duck's photo, with the name + location below. It appears at three sizes: a large hero crest, the badge gallery (172×86), and the dashboard grid (`aspect-ratio: 2`).

**Two octagon shapes are used — keep them distinct:**
1. **Regular octagon** (square, for app icons / hero mark):
   `clip-path: polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)`
2. **Stretched/rounded octagon** (2:1 landscape, for photo badges) — an SVG clipPath with softened corners, referenced as `clip-path: url(#octR)`. Defined once as an inline SVG `<defs>`:
```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <clipPath id="octR" clipPathUnits="objectBoundingBox">
    <path d="M 0.185 0 L 0.815 0 Q 0.855 0 0.88 0.05 L 0.975 0.24 Q 1 0.29 1 0.34 L 1 0.66 Q 1 0.71 0.975 0.76 L 0.88 0.95 Q 0.855 1 0.815 1 L 0.185 1 Q 0.145 1 0.12 0.95 L 0.025 0.76 Q 0 0.71 0 0.66 L 0 0.34 Q 0 0.29 0.025 0.24 L 0.12 0.05 Q 0.145 0 0.185 0 Z"></path>
  </clipPath>
</defs></svg>
```

**Badge construction (nested, three layers):**
1. Outer: the octagon clip filled with the gold gradient `linear-gradient(150deg,#ECD286,#A87D2C)`, `padding: 4–6px` (this padding is what becomes the visible gold frame).
2. Middle: same octagon clip, `background: #0C0B0A`, `padding: 3–5px` (a thin black inset between frame and photo).
3. Inner: the photo, clipped to the same octagon (`clip-path: url(#octR)`), `width/height: 100%`.

For the app-icon variant the inner layer is a radial-gradient dark fill (`radial-gradient(circle at 50% 38%, #1D1A12, #100E0A)`) centered behind the duck mark instead of a photo.

In the prototype the photo uses a custom `<image-slot>` web component (drag-to-fill). **In your build, replace `<image-slot>` with a normal `<img>` (object-fit: cover) or your image component** — the slot is only a prototyping convenience.

---

## Screens / Views

### Brand Guide page (`DashDuckies Brand.dc.html`)
A single scrolling page, max-width 1180px, centered, 40px side padding, on Ink background. Sections, top to bottom:

1. **Sticky top bar** — duck mark (30px) + "DashDuckies" wordmark (Fredoka 600, 20px) on the left; centered nav text (`Logo / Color / Type / Badge / Dashboard`, 13.5px, color `#B8B09A`); mono "Brand v1.0" tag on the right. Bottom hairline border, `position: sticky; top: 0`.
2. **Hero** — 2-column grid (1.2fr / 0.8fr). Left: mono eyebrow, H1 "Dash**Duckies**" (88px, "Duckies" in bronze), 21px lead paragraph, two buttons. Right: large 280px hero octagon crest (regular octagon, gold frame → black → radial dark → centered 150px duck mark).
   - **Primary button** "Log a duck": bronze `#A87D2C` fill, black text, weight 700, 14px, `padding: 11px 22px`. Clipped corners via `clip-path: polygon(7px 0, calc(100% - 14px) 0, 100% 7px, 100% calc(100% - 7px), calc(100% - 7px) 100%, 14px 100%, 0 calc(100% - 7px), 0 7px)` (a notched/beveled rectangle — the brand's button shape). On hover, a diagonal light sheen sweeps across (animated `background-position` over 0.6s).
   - **Secondary button** "Browse the flock": same notched shape, transparent/ink fill with a bronze 1.5px border (achieved as an outer bronze-filled clip with 1.5px padding wrapping an inner ink clip), bronze text.
3. **01 / Logo — three directions** ("Pick your duck"): 3-col grid of cards. (a) Stacked Wordmark, (b) Mark + Wordmark — **marked ✓ Selected**, 2px bronze border + bronze pill badge top-right, (c) Octagon Emblem. Each card: 230px preview area with radial dark bg, then a titled caption with a top hairline.
4. **02 / Color** ("Gold on a dark garage"): 6-col grid of swatch cards. Each: a 120px color block, then name (Fredoka 16), hex (mono), role (11.5px). Six swatches = the palette above.
5. **03 / Typography** ("Rounded & readable"): 2-col grid. Left card showcases Fredoka ("Quack" at 60px); right card showcases Hanken Grotesk ("Every duck deserves a badge." at 42px). Each card has a mono role label top-right.
6. **04 / The duck badge** ("One octagon per duck"): 3-col grid (40px row gap), each a 172×86 stretched-octagon badge + name (Fredoka 18) + location (mono 10.5px). Uses the 10 sample ducks.
7. **05 / Dashboard** ("The brand in the wild"): the full dashboard mockup (see below) inside a rounded 22px shell with the big drop shadow.
8. **Footer** — wordmark left, mono tagline "Find 'em · Badge 'em · Keep 'em" right, top hairline.

### Dashboard (inside section 05, the real product UI)
A rounded shell containing:
- **App top bar:** duck mark (24px) + "DashDuckies"; a search field ("Search your roster…", pill, 340px max, ink fill, gold hairline); a "+ Log a duck" notched bronze button; a 32px circular gold-gradient avatar. Bottom hairline.
- **Body (28–34px padding):**
  - Header row: H3 "Your roster" (30px) + subtitle "10 ducks tracked · 4 new this month"; right-aligned filter tabs — "All" (active: bronze fill, black text, notched), "Rare" and "Recent" (inactive: notched outline style, `#CFC7B2` text).
  - **Stats row:** 3-col grid of stat cards. Each: big number in bronze (Fredoka 600, 34px) + label (13px muted). Values: `10` Ducks tracked, `+4` New this month, `9 wk` Longest streak.
  - **Two-column split (1fr / 280px):**
    - Left: **badge grid**, 4 columns, each a stretched-octagon photo badge (`aspect-ratio: 2`) + duck name (Fredoka 500, 13px). All 10 sample ducks.
    - Right: **"Recent quacks" feed** card. Title (Fredoka 16) + a vertical list of items, each a small bronze dot + text + mono timestamp.

### Logo System sheet (`DashDuckies Logo Sheet.dc.html`)
A second scrolling page (same 1180px / Ink layout) formalizing logo usage:
1. Top bar + mono "Logo System · v1.0" tag.
2. **Hero lockup** — the official horizontal mark+wordmark on a radial-dark rounded panel (108px mark, 54px wordmark).
3. **01 / Lockups** — 3 cards (uneven grid 1.3/1/0.9fr): Horizontal (primary), Stacked, Mark only.
4. **02 / Clear space & construction** — dashed-guide diagram: clear space = X = the height of the duck mark on every side.
5. **03 / Minimum sizes** — Full lockup min **120px** wide; Mark only min **16px**.
6. **04 / Color usage** — 4 finishes: Primary (bronze mark + cream/bronze wordmark on ink), Reversed (all cream on ink), Mono Black (on light cream bg), Mono Bronze (on light cream bg).
7. **05 / App icon & favicon** — the regular-octagon app icon at 128 / 64 / 32px, gold frame + dark fill + gold duck mark (`#D4AF37`).
8. **06 / Misuse** ("Please don't") — 4 cards each with a red ✕ badge: don't stretch/distort, don't rotate, don't recolor off-brand, don't add shadows/effects.

---

## Interactions & Behavior
- **Button hover sheen:** the notched buttons animate a diagonal light gradient across the surface on hover. Implemented as a layered `background` (a `linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.5) 50%, transparent 62%)` over the solid color) with `background-size: 200% 100%` and `background-position` transitioning from `200% 0` to `-100% 0` over `0.6s ease`. Reproduce as a CSS hover transition or your codebase's equivalent.
- **Notched button shape** is the reusable button primitive — clip-path bevel as specified. Build it as a single `<Button variant="primary|secondary">` component.
- **image-slot** in the prototype lets a user drop a photo onto a badge and it persists (localStorage). In production this is just an image field on each duck record — no need to replicate the drag behavior unless the product calls for it.
- The page is otherwise static (a brand guide); the dashboard is a layout mock — no live data fetching is specified. Wire it to real data per your app's conventions.

## State Management
None required for the brand guide. For the dashboard when productionized, you'll need: a list of duck records (`{ name, photo, location, rarity, dateAdded }`), filter tab state (All / Rare / Recent), a search query string, and the recent-activity feed. These are sample-data shapes, not a prescribed schema — adapt to the backend.

## Sample Data (the 10 ducks)
| Name | Photo file | Location |
|---|---|---|
| Major Quack | astronaught-duck.png | ROCKET RD · CAPE CANAVERAL |
| Chef Quackers | chef-duck.png | FOOD TRUCK · PORTLAND |
| Wrigley | chicago-duck.png | WRIGLEYVILLE · CHICAGO |
| Raven | emo-duck.png | RECORD SHOP · SEATTLE |
| Birdie | golf-duck.png | 18TH GREEN · PINEHURST |
| Indy | indiana-jones-duck.png | DESERT PASS · MOAB |
| Rex | jurrasic-park-duck.png | VISITOR CENTER · KAUAI |
| Paco | mexican-duck.png | TAQUERIA · SANTA FE |
| Big Apple | newyork-duck.png | 5TH AVE · NEW YORK |
| Bjorn | viking-duck.png | FJORD LOT · DULUTH |

Stats: 10 ducks tracked, +4 new this month, 9 wk longest streak.
Recent feed: "You badged Goldie" (2 HOURS AGO), "Found Nugget at a drive-thru" (YESTERDAY), "You badged Bubbles" (3 DAYS AGO), "Captain Floats added to roster" (5 DAYS AGO).

## Assets
In `assets/`:
- `duck-icon.svg` — the duck mark logo.
- 10 duck photos (PNGs listed above) — sample collection imagery; replace with real user uploads in production.

## Files
- `DashDuckies Brand.dc.html` — brand guide + dashboard mockup (the main reference).
- `DashDuckies Logo Sheet.dc.html` — logo usage rules sheet.

Both are HTML prototypes; open them in a browser to view, but **do not ship them** — recreate them in your codebase per the spec above.
