# Euclid Chart Designer

Euclid is a browser-based chart design tool for building polished, configurable visualizations with a developer-friendly JSON spec. It focuses on **bar charts**, **heatmaps**, and a **dynamic OKLCH color system** with theme-aware surfaces, accessibility tooling, and a written **color system case study**.

Made by **Satyam Chandra**. Free to use.

## Live demo (GitHub Pages)

| View | URL |
|------|-----|
| **Editor** (default) | [https://ux-puppy.github.io/Euclid/](https://ux-puppy.github.io/Euclid/) |
| **Color system case study** | [https://ux-puppy.github.io/Euclid/#/case-study](https://ux-puppy.github.io/Euclid/#/case-study) |

Source repository: [github.com/ux-puppy/Euclid](https://github.com/ux-puppy/Euclid)

Production builds deploy automatically from the `main` branch via [GitHub Actions](.github/workflows/deploy-pages.yml) whenever changes are pushed.

---

## What you can do

### Chart types

| Chart | Status | Description |
|-------|--------|-------------|
| **Bar Chart (Classic)** | Available | Horizontal Cartesian bars — grouped layout, grid, axes, in-bar labels |
| **Breakdown** | Available | Sectioned list layout with group titles and global value scale |
| **Hierarchy** | Available | Expandable tree rows, depth styling, expand/collapse controls |
| **Heatmap** | Available | Tabular matrix with configurable cell size, row/column labels, color scale |
| **Palette** | Available | UI-only view of the full token catalog (surfaces, series, depth, heatmap stops) |
| Line, Pie, Sankey, Scatter | Planned | Shown in the nav as locked placeholders |

All chart types share a common spec body (typography, geometry, labels, axes, grid, legend, tooltip, interaction, animation, renderer, colors).

### Color system

- **Visualization palette** — OKLCH-based categorical colors with hue layout, smart ordering, variation (lightness/opacity), excess-color handling, and per-series assignments
- **Heatmap colors** — Sequential (and diverging preset structure) gradients with power/log scaling, gamma, quantization, OKLCH blending, stop alpha, and light/dark theme adaptation
- **Surface tokens** — Per-theme chart chrome (background, text, axis, grid, hover, selection, borders)
- **Accessibility** — Contrast reporting and nudge controls for fills vs background and bar text (WCAG-oriented ratios in the inspector)

### Editor UX

- **Settings** and **Colors** inspector tabs with shared chart settings synced across variants where applicable
- **Light / dark** UI theme (persisted) plus chart surface presets per theme
- **Preview** pane with live canvas rendering
- **Pattern data** — Deterministic random tabular/tree datasets (seeded); randomize from the inspector
- **Undo / redo** — History via [zundo](https://github.com/charkour/zundo) (`Ctrl+Z` / `Ctrl+Y`)
- **Autosave** — Bundle stored in `localStorage` under `euclid-spec-autosave`
- **Export / import** — Copy or download **v3 JSON bundle** (all bar variants + heatmap + selected chart) from Settings

### Case study

The case study route documents the product color system: generated palettes, OKLCH rationale, thematic equivalence, ordering, accessibility, and gradient design — with interactive demos wired to the same spec engine as the editor.

---

## Tech stack

- **UI:** React 19, TypeScript, Tailwind CSS 4, Radix UI primitives
- **State:** Zustand + Immer + temporal undo
- **Validation:** Zod chart schema with migration for older spec versions
- **Color:** [culori](https://github.com/Evercoder/culori) (OKLCH and conversions), custom palette/heatmap pipelines
- **Charts:** Canvas renderer (bars, heatmap layout), [d3-scale](https://github.com/d3/d3-scale) where needed
- **Color picking:** [@jaames/iro](https://github.com/jaames/iro)
- **Build:** Vite 8, Vitest, oxlint

---

## Getting started

### Prerequisites

- Node.js 22+ (matches CI)
- npm

### Install and run locally

```bash
git clone https://github.com/ux-puppy/Euclid.git
cd Euclid
npm ci
npm run dev
```

Open the URL Vite prints (typically [http://localhost:5173/](http://localhost:5173/)). Local dev uses base path `/` unless you set `VITE_BASE_PATH`.

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck (`tsc -b`) and production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | Run oxlint |
| `npm run bake-defaults` | Run factory-default tests (see below) |

### Production build (GitHub Pages path)

GitHub Pages serves the app under `/Euclid/`. To reproduce that build locally:

```bash
# PowerShell
$env:VITE_BASE_PATH='/Euclid/'
npm run build
npx vite preview --base /Euclid/
```

---

## Routing

The app uses **hash routing** (no server rewrite rules required on GitHub Pages):

| Hash | Page |
|------|------|
| *(empty)* or anything except case study | Chart editor |
| `#/case-study` | Color system case study |

From the editor sidebar, use **Color system case study** to open the case study.

---

## Project layout (high level)

```
src/
  chart-spec/          Zod schema, defaults, export/import, factoryDefaultBundle.json
  visualization-colors/ OKLCH palette generation, assignments, accessibility nudge
  heatmap-colors/      Gradients, interpolation, theme adaptation
  accessibility/       Contrast utilities and chart contrast reports
  layout/              Bar and heatmap layout computation
  render/              Canvas drawing and animation
  store/               Editor state, autosave, undo
  components/editor/   App shell, inspector, preview, nav
  case-study/          Case study page, sections, demos
  data/                Synthetic tabular/tree data patterns
.github/workflows/     deploy-pages.yml — build and deploy to GitHub Pages
```

---

## Factory defaults

First-time visitors (no autosave) load charts from [`src/chart-spec/factoryDefaultBundle.json`](src/chart-spec/factoryDefaultBundle.json), including default selected chart and inspector preferences.

To bake a new factory bundle from an exported v3 JSON file:

```bash
# PowerShell — path to a Copy JSON export or raw v3 bundle
$env:BAKE_DEFAULTS_PATH='path/to/export.json'
npm run bake-defaults
```

Commit the updated `factoryDefaultBundle.json`. To reset your browser session to factory defaults, clear `localStorage` key `euclid-spec-autosave` and refresh.

---

## Export format (v3 bundle)

Exported JSON includes:

- `version: 3`
- `selectedChart` — `classic` | `breakdown` | `hierarchy` | `heatmap`
- `specsByVariant` — full bar specs for all three bar variants
- `heatmapSpec` — heatmap chart spec

Tree hierarchy exports include expanded node IDs where applicable. Import via **Settings → Import JSON** in the editor.

---

## Deployment

| Item | Detail |
|------|--------|
| **Host** | GitHub Pages (project site) |
| **Public URL** | [https://ux-puppy.github.io/Euclid/](https://ux-puppy.github.io/Euclid/) |
| **Trigger** | Push to `main` or manual **Deploy to GitHub Pages** workflow |
| **Build env** | `VITE_BASE_PATH=/Euclid/` in CI |

---

## Contributing

Issues and pull requests are welcome on [github.com/ux-puppy/Euclid](https://github.com/ux-puppy/Euclid). Run `npm test` and `npm run build` before submitting changes.
