# Implementation Plan: Catalog Search

**Branch**: `003-catalog-search` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-catalog-search/spec.md`

## Summary

Implement the full Browse view search experience for the Figma plugin: fuzzy search by component name using Fuse.js, a separate bidirectional alias database that expands queries to cover synonymous UI patterns (e.g., "combobox" ↔ "autocomplete" ↔ "typeahead"), design system filter chips, paginated results with a count display, and polished empty/loading states. State is managed through the existing Zustand global store (extended with search-specific slices). UI is built exclusively with Reshaped components.

## Technical Context

**Language/Version**: TypeScript 5.5+ (strict mode)  
**Primary Dependencies**: React 18.3 (existing), Zustand 5.x (existing), Fuse.js 7.x (existing), Reshaped 3.9+ (existing)  
**Storage**: N/A — in-memory only, session-scoped. Alias database is a static JSON file bundled at build time.  
**Testing**: Vitest 2.x (existing)  
**Target Platform**: Figma plugin iframe (browser sandbox)  
**Project Type**: Single — Figma plugin with two Vite build targets (UI iframe + canvas main thread)  
**Performance Goals**: Search results must appear within 100ms of debounce completion. Pagination transitions must be instant (no re-search). Skeleton-to-content transition must feel smooth.  
**Constraints**: Plugin bundle MUST remain under 5 MB uncompressed. No new runtime dependencies (all libraries already installed). Must run inside Figma's iframe sandbox. No Node.js APIs.  
**Scale/Scope**: 3 design systems, ~15 components total (growing). ~20 alias groups in initial alias database. Single-user, single-session.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Plugin-Architecture-Driven | PASS | All search logic runs within the UI iframe. Alias database is a static JSON import — no network requests. No changes to the postMessage protocol. Catalog data flow unchanged: canvas thread sends catalog via message, UI thread indexes and searches locally. |
| II. Prototype-Fast Delivery | PASS | Builds on existing Fuse.js search and Zustand store. Alias database is a simple JSON file — no database, no service. Filter chips use Reshaped ToggleButtonGroup. Pagination uses Reshaped Pagination component. No premature abstraction. |
| III. Designer-Centric UX | PASS | Search input is a standard text field. Filter chips use familiar toggle paradigm. "N results" count, "No results for X", and loading skeletons all follow standard UX patterns. No technical jargon exposed. |
| IV. Minimal Dependencies | PASS | No new runtime dependencies added. Fuse.js, Zustand, React, and Reshaped are all already in package.json. Alias database is a plain JSON file with zero dependencies. |
| V. Incremental Testability | PASS | Each user story is independently testable: (1) name search works alone, (2) alias expansion is testable with unit tests on the resolver, (3) pagination is testable in isolation, (4) filter chips are testable by clicking, (5) empty/loading states are testable by controlling store state. |

**Gate Result**: PASS — all principles satisfied. No new dependencies required.

**Post-Phase 1 re-check**: PASS — design phase confirmed no new dependencies, no postMessage changes, no Node.js APIs. All artifacts stay within the UI iframe boundary.

## Project Structure

### Documentation (this feature)

```text
specs/003-catalog-search/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── search-api.md    # Search service public interface
│   └── store-extensions.md  # Store slice additions
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── catalog/
│   ├── mui-v5.json              # UNCHANGED
│   ├── spectrum.json            # UNCHANGED
│   ├── tailwind-ui.json         # UNCHANGED
│   └── aliases.json             # NEW — bidirectional alias groups database
├── ui/
│   ├── store.ts                 # MODIFIED — add search slice (currentPage, designSystemFilter)
│   ├── selectors.ts             # MODIFIED — add search-related selectors
│   ├── App.tsx                  # MODIFIED — integrate BrowseView component
│   ├── services/
│   │   └── aliasResolver.ts     # NEW — alias expansion logic
│   ├── hooks/
│   │   ├── useSearch.ts         # MODIFIED — integrate alias expansion, read from store
│   │   └── usePluginMessage.ts  # UNCHANGED
│   ├── components/
│   │   ├── SearchBar.tsx        # MODIFIED — sync with store, Reshaped TextField
│   │   ├── FilterChips.tsx      # NEW — Reshaped ToggleButtonGroup for design system filters
│   │   ├── ResultsList.tsx      # MODIFIED — paginated display, result count
│   │   ├── ResultCard.tsx       # MODIFIED — Reshaped Card layout
│   │   ├── LoadingSkeleton.tsx  # NEW — Reshaped Skeleton composition
│   │   └── EmptyState.tsx       # NEW — empty/no-results states
│   └── types/
│       ├── catalog.ts           # UNCHANGED
│       └── messages.ts          # UNCHANGED

tests/
├── unit/
│   ├── aliasResolver.test.ts    # NEW — alias expansion tests
│   ├── useSearch.test.ts        # NEW — search integration tests
│   └── store-search.test.ts    # NEW — search store slice tests
```

**Structure Decision**: Single project. Extends existing `src/ui/` structure. One new `services/` directory under `src/ui/` for the alias resolver (pure logic, no React). Three new components, three modified components. One new data file in `src/catalog/`. No new top-level directories.

## Complexity Tracking

No constitution violations requiring justification. All dependencies pre-existing. No new runtime libraries.
