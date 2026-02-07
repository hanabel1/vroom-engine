# Quickstart: Design System Catalog Plugin

**Branch**: `001-design-system-catalog` | **Date**: 2026-02-07

## Prerequisites

- Node.js 18+
- Figma desktop app (for plugin development/testing)

## Project Setup

```bash
# Clone and checkout
git checkout 001-design-system-catalog

# Install dependencies
npm install

# Start development (UI + plugin watch mode)
npm run dev
```

## Project Structure

```
src/
├── plugin/                  # Figma main thread (no DOM access)
│   ├── main.ts              # Plugin entry: message handler, Figma API orchestration
│   └── converter/           # HTML-to-Figma conversion engine
│       ├── index.ts          # Converter entry point
│       ├── parser.ts         # HTML string → DOM tree parsing
│       ├── mapper.ts         # DOM node → Figma node mapping
│       └── styles.ts         # CSS inline style → Figma property conversion
│
├── ui/                      # React UI iframe
│   ├── index.html           # HTML entry point for iframe
│   ├── main.tsx             # React app entry
│   ├── App.tsx              # Root component: search + results layout
│   ├── components/          # UI components
│   │   ├── SearchBar.tsx     # Fuzzy search input
│   │   ├── ResultsList.tsx   # Search results grid/list
│   │   ├── ResultCard.tsx    # Individual result with preview
│   │   └── DetailView.tsx    # Component detail: props, variants, place action
│   ├── hooks/               # React hooks
│   │   ├── useSearch.ts      # Fuse.js search hook
│   │   └── usePluginMessage.ts # postMessage communication hook
│   └── types/               # Shared TypeScript types
│       ├── catalog.ts        # DesignSystem, Component, Prop types
│       └── messages.ts       # Plugin ↔ UI message types
│
├── shared/                  # Code shared between plugin and UI
│   └── types.ts             # Message envelope types
│
└── catalog/                 # Catalog data (bundled with plugin)
    ├── mui-v5.json
    ├── spectrum.json
    ├── tailwind-ui.json
    └── previews/
        ├── mui-v5/
        ├── spectrum/
        └── tailwind-ui/

tools/                       # Build-time tooling (not shipped in plugin)
└── process-components/      # Catalog pre-processing pipeline
    ├── render.ts             # Headless browser component rendering
    ├── inline-styles.ts      # CSS inlining
    └── screenshot.ts         # Preview image generation

tests/
├── unit/
│   ├── search.test.ts        # Fuse.js search configuration tests
│   ├── converter.test.ts     # HTML→Figma conversion unit tests
│   └── styles.test.ts        # CSS property mapping tests
└── integration/
    └── catalog-validation.test.ts  # Catalog JSON schema validation

manifest.json                # Figma plugin manifest
vite.config.ts               # Vite build configuration (UI)
vite.config.plugin.ts        # Vite build configuration (plugin main thread)
tsconfig.json                # TypeScript configuration
package.json
```

## Key Dependencies

| Package | Purpose | Justification (Principle IV) |
|---------|---------|------------------------------|
| `react` + `react-dom` | UI rendering | Constitution mandates React (Technical Constraints) |
| `fuse.js` | Fuzzy search | ~5KB gzip, zero deps, client-side only. No platform alternative exists for fuzzy matching |
| `vite` | Build tool | User-specified. Dev dependency only — not in bundle |
| `@figma/plugin-typings` | Figma API types | Dev dependency for TypeScript support |
| `vite-plugin-singlefile` | Inline assets into HTML | Figma requires single HTML file for UI. Dev dependency |

## Development Workflow

### Run the plugin locally

1. `npm run dev` — starts Vite in watch mode for both UI and plugin code
2. In Figma: Plugins → Development → Import plugin from manifest
3. Select the `manifest.json` from the repo root
4. Run the plugin from the Plugins menu

### Add a new design system to the catalog

See the [Catalog Contribution Guide](#adding-a-design-system) below.

### Build for production

```bash
npm run build
```

Outputs `dist/ui.html` and `dist/plugin.js`.

## Adding a Design System

To add a new design system to the catalog:

1. Create a JSON file in `src/catalog/` following the schema in `contracts/catalog-schema.json`
2. Use the pre-processing tool to generate inlined HTML and preview images:
   ```bash
   npm run process-catalog -- --input your-system.json
   ```
3. Place preview images in `src/catalog/previews/{system-id}/`
4. Validate the file:
   ```bash
   npm run validate-catalog
   ```
5. Rebuild the plugin: `npm run build`

Refer to `data-model.md` for the complete schema documentation and `src/catalog/mui-v5.json` as a reference example.
