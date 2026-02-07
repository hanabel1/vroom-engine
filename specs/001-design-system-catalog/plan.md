# Implementation Plan: Design System Catalog Figma Plugin

**Branch**: `001-design-system-catalog` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-design-system-catalog/spec.md`

## Summary

Build a Figma plugin that provides a searchable catalog of UI components from multiple public design systems (MUI, Adobe Spectrum, Tailwind UI). The plugin uses Fuse.js for fuzzy search in a React UI iframe, displays component previews in search results, and converts pre-stored HTML markup into native Figma layers upon placement. Catalog data is stored as JSON files with pre-processed inline-styled HTML, added manually by technical contributors.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: React 18, Fuse.js 7.x, Vite 5.x, vite-plugin-singlefile, @figma/plugin-typings
**Storage**: Static JSON files bundled with the plugin (one per design system)
**Testing**: Vitest (unit + integration)
**Target Platform**: Figma Plugin API (latest stable) — desktop + web
**Project Type**: Single project (Figma plugin with dual-context: UI iframe + main thread)
**Performance Goals**: Search <100ms for 500+ components; component placement <3s
**Constraints**: Bundle <5MB uncompressed (constitution); no Node.js APIs; all styles must be pre-inlined in catalog HTML; no runtime network requests needed
**Scale/Scope**: 3 design systems, ~60-100 components total at launch, 1 plugin UI screen + detail view

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Plugin-Architecture-Driven** | PASS | UI in iframe (React), Figma API in main thread, `postMessage` bridge. No capabilities outside plugin sandbox. |
| **II. Prototype-Fast Delivery** | PASS | MVP focuses on search + display (P1). Placement (P2) targets "visually recognizable" not pixel-perfect. No premature abstractions. |
| **III. Designer-Centric UX** | PASS | Search by component name. No HTML/React jargon in UI. Visual previews. One-click placement. |
| **IV. Minimal Dependencies** | PASS | 2 runtime deps (React, Fuse.js). Fuse.js: ~5KB gzip, zero deps — justified for fuzzy search (no platform alternative). React: mandated by constitution. vite-plugin-singlefile: dev-only. |
| **V. Incremental Testability** | PASS | Each user story is independently demonstrable. P1 (search) works standalone. Tests added per constitution: critical path first. |

**Post-Phase 1 Re-check:**

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Plugin-Architecture-Driven** | PASS | Message protocol defined. No cross-boundary violations. |
| **II. Prototype-Fast Delivery** | PASS | No over-engineered patterns. Flat data model. Direct function calls. |
| **III. Designer-Centric UX** | PASS | Component names + categories + visual previews. No technical terminology in search results. |
| **IV. Minimal Dependencies** | PASS | No new runtime deps added during design. Dependency count: React + Fuse.js only. |
| **V. Incremental Testability** | PASS | Each layer testable in isolation (search logic, converter, message bridge). |

## Project Structure

### Documentation (this feature)

```text
specs/001-design-system-catalog/
├── plan.md              # This file
├── research.md          # Phase 0: Fuse.js, Figma API, HTML-to-Figma, catalog design
├── data-model.md        # Phase 1: Catalog schema (DesignSystem, Component, Prop, Variant)
├── quickstart.md        # Phase 1: Setup, dev workflow, adding design systems
├── contracts/
│   ├── message-protocol.md   # UI ↔ Plugin postMessage contract
│   └── catalog-schema.json   # JSON Schema for catalog data files
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── plugin/                      # Figma main thread (no DOM)
│   ├── main.ts                  # Entry: message handler, orchestration
│   └── converter/               # HTML → Figma node converter
│       ├── index.ts             # Public API: htmlToFigma()
│       ├── parser.ts            # DOMParser-based HTML parsing
│       ├── mapper.ts            # Element → Figma node type mapping
│       └── styles.ts            # Inline CSS → Figma property mapping
│
├── ui/                          # React UI iframe
│   ├── index.html               # HTML entry for iframe
│   ├── main.tsx                 # React entry
│   ├── App.tsx                  # Root: search layout + routing (list/detail)
│   ├── components/
│   │   ├── SearchBar.tsx        # Text input with debounce
│   │   ├── ResultsList.tsx      # Grid of result cards
│   │   ├── ResultCard.tsx       # Preview image + name + design system badge
│   │   └── DetailView.tsx       # Props, variants, place button
│   ├── hooks/
│   │   ├── useSearch.ts         # Fuse.js index + search function
│   │   └── usePluginMessage.ts  # postMessage send/receive
│   └── types/
│       ├── catalog.ts           # DesignSystem, Component, Prop, Variant
│       └── messages.ts          # Message type union
│
├── shared/
│   └── types.ts                 # Message envelope type
│
└── catalog/                     # Bundled catalog data
    ├── mui-v5.json
    ├── spectrum.json
    ├── tailwind-ui.json
    └── previews/
        ├── mui-v5/
        ├── spectrum/
        └── tailwind-ui/

tools/                           # Build-time only (not shipped)
└── process-components/
    ├── render.ts                # Headless browser rendering
    ├── inline-styles.ts         # CSS inlining
    └── screenshot.ts            # Preview generation

tests/
├── unit/
│   ├── search.test.ts           # Fuse.js config + ranking
│   ├── converter.test.ts        # HTML → Figma mapping
│   └── styles.test.ts           # CSS property conversion
└── integration/
    └── catalog-validation.test.ts  # Schema validation

manifest.json                    # Figma plugin manifest
vite.config.ts                   # UI build config
vite.config.plugin.ts            # Plugin main thread build config
tsconfig.json
package.json
```

**Structure Decision**: Single project structure. The Figma plugin is a self-contained application with two build targets (UI iframe + plugin main thread) sharing TypeScript types. No backend, no separate packages. The `tools/` directory is for build-time catalog processing only and is not part of the plugin bundle.

## Complexity Tracking

No constitution violations to justify.

| Dependency | Justification |
|------------|---------------|
| `fuse.js` | ~5KB gzip, zero transitive deps. Implements Bitap fuzzy matching algorithm — no equivalent in browser built-ins or Figma API. Required for FR-002 (typo-tolerant search). |
| `react` + `react-dom` | Mandated by constitution Technical Constraints. |
| `vite-plugin-singlefile` | Dev dependency only. Figma requires UI as single HTML file — this plugin inlines all JS/CSS into the HTML. Not in production bundle. |
