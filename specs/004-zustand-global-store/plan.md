# Implementation Plan: Zustand Global Store

**Branch**: `004-zustand-global-store` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-zustand-global-store/spec.md`

## Summary

Introduce a Zustand-based global store (`src/ui/store.ts`) to centralize state that is currently scattered across `useState` hooks in App.tsx and the `useSearch` hook. The store has three logical slices — **Catalog** (design systems, enabled set, loading), **UI** (view routing, active component, search query, filters), and **Placement** (lifecycle status, errors, warnings). Derived selectors (`src/ui/selectors.ts`) compute enabled systems, active component lookup, and filtered component lists. After the store is in place, App.tsx is migrated to a thin shell: message bridge + view router.

## Technical Context

**Language/Version**: TypeScript 5.5+ (strict mode)
**Primary Dependencies**: React 18.3, Zustand 5.x (new), Fuse.js 7.x (existing)
**Storage**: N/A (in-memory only, session-scoped)
**Testing**: Vitest 2.x (existing)
**Target Platform**: Figma plugin iframe (browser sandbox)
**Project Type**: Single — Figma plugin with two Vite build targets (UI iframe + canvas main thread)
**Performance Goals**: Store updates must propagate in a single React render cycle. No perceivable lag on state transitions.
**Constraints**: Plugin bundle MUST remain under 5 MB uncompressed. Zustand adds ~1.1 KB gzipped (~3 KB uncompressed) — negligible impact. No Node.js APIs. Must run inside Figma's iframe sandbox.
**Scale/Scope**: 3 design systems, ~50 components per system. Single-user, single-session. Store is not persisted.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Plugin-Architecture-Driven | PASS | Zustand runs entirely within the UI iframe. No changes to postMessage protocol. Store actions are dispatched from the existing message handler. |
| II. Prototype-Fast Delivery | PASS | Single store file + selectors file. No new abstractions, no middleware, no persistence layer. Simplest working approach. |
| III. Designer-Centric UX | PASS | Internal architecture change. No user-facing UI or terminology changes. |
| IV. Minimal Dependencies | PASS (with justification) | Zustand adds ~1.1 KB gzipped. Justified: replaces prop drilling and multiple `useState` hooks with a single store, reducing code complexity. Alternative (React Context + `useReducer`) requires more boilerplate and re-renders the entire tree on any state change. See [research.md](./research.md) for full comparison. |
| V. Incremental Testability | PASS | Each store slice can be tested independently outside React. Selectors are pure functions testable with plain assertions. |

**Gate Result**: PASS — all principles satisfied. Zustand dependency justified under Principle IV.

## Project Structure

### Documentation (this feature)

```text
specs/004-zustand-global-store/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── store-api.md     # Store public interface contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── ui/
│   ├── store.ts             # NEW — Zustand global store (3 slices)
│   ├── selectors.ts         # NEW — Derived selector hooks
│   ├── App.tsx              # MODIFIED — thin shell (message bridge + view router)
│   ├── hooks/
│   │   ├── usePluginMessage.ts  # UNCHANGED
│   │   └── useSearch.ts         # MODIFIED — reads from store instead of props
│   ├── components/
│   │   ├── SearchBar.tsx        # MODIFIED — reads searchQuery from store
│   │   ├── ResultsList.tsx      # MODIFIED — reads from selectors
│   │   └── ResultCard.tsx       # UNCHANGED
│   └── types/
│       ├── catalog.ts           # UNCHANGED
│       └── messages.ts          # UNCHANGED
tests/
├── unit/
│   └── store.test.ts        # NEW — store slice tests
│   └── selectors.test.ts    # NEW — selector tests
```

**Structure Decision**: Single project. Two new files added to `src/ui/` (store, selectors). Two new test files added to `tests/unit/`. Existing files modified in place. No new directories beyond `contracts/` in specs.

## Complexity Tracking

No constitution violations requiring justification. Zustand dependency justified in Constitution Check above.
