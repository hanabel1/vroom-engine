# Implementation Plan: Demo Figma Instance Swap

**Branch**: `005-figma-instance-swap-demo` | **Date**: 2026-02-08 | **Input**: Context handoff from `./context-handoff.md`

## Review Summary

The handoff is actionable and specific enough to implement directly in this repository. It includes locked behavioral decisions, a proposed UI/plugin message contract, algorithm details, and file-level mapping. The plan below keeps those decisions intact and adapts them to the current Vroom Engine architecture.

Confirmed constraints from handoff:
- Preserve target instance layer names after swap.
- Target only selected `INSTANCE` nodes; skip others with warnings.
- Exact property mapping by name and type only.
- No text override migration for demo.
- Fail fast with no mutations when source resolution/import fails; isolate failures per instance otherwise.

## Summary

Implement a demo-first instance replacement flow in the Figma plugin:
- UI can query a swap source catalog and select a source component.
- UI can request current selection state and run replacement.
- Plugin resolves/imports the source component, swaps selected instances, reapplies geometry/layout best effort, remaps compatible properties, and reports progress plus final issues.
- Existing component placement flow remains unchanged.

## Technical Context

**Language/Version**: TypeScript 5.5+  
**Primary Dependencies**: React 18.3, Zustand 5.x, Figma Plugin API  
**Storage**: Static JSON catalog (`src/catalog/swap-components.json`)  
**Testing**: Vitest 2.x unit tests + manual QA in Figma  
**Target Platform**: Figma plugin UI iframe + plugin main thread  
**Constraints**:
- No fuzzy/ID-based prop mapping.
- No text migration in demo.
- Preserve current placement feature behavior.
- Keep implementation simple and modular for future extraction.

## Project Structure

### Documentation (this feature)

```text
specs/005-figma-instance-swap-demo/
├── context-handoff.md
└── plan.md
```

### Source Code Changes

```text
src/
├── canvas.ts                               # MODIFIED - new swap message handlers + selection state bridge
├── catalog/
│   └── swap-components.json                # NEW - static swap source catalog
├── plugin/
│   └── swap/
│       ├── catalog.ts                      # NEW - catalog loading/filtering/validation
│       ├── propertyMapper.ts               # NEW - exact-name+type mapping planner
│       ├── replaceInstances.ts             # NEW - core replacement algorithm + summary aggregation
│       └── types.ts                        # NEW - swap domain types (issues/results/summary/catalog)
└── ui/
    ├── App.tsx                             # MODIFIED - handle swap protocol messages
    ├── store.ts                            # MODIFIED - add swap state slice and actions
    ├── components/
    │   └── InstanceSwapPanel.tsx           # NEW - minimal demo UI for source select + run + result
    └── types/
        └── messages.ts                     # MODIFIED - extend UI↔plugin message union

tests/
├── unit/
│   ├── swap-property-mapper.test.ts        # NEW
│   ├── swap-catalog.test.ts                # NEW
│   ├── swap-summary.test.ts                # NEW
│   └── store-swap.test.ts                  # NEW (or merge into existing store.test.ts)
```

## Execution Plan

1. Message contract and shared types
- Extend `src/ui/types/messages.ts` with swap message types from the handoff:
  - UI -> Plugin: `REQUEST_SELECTION_STATE`, `CATALOG_QUERY`, `RUN_REPLACE`
  - Plugin -> UI: `SELECTION_STATE`, `CATALOG_RESULTS`, `REPLACE_PROGRESS`, `REPLACE_RESULT`, `PLUGIN_ERROR`
- Add explicit payload typings for `CatalogItem`, `SwapSummary`, `SwapNodeResult`, `SwapIssue`.
- Preserve existing placement message types as-is.

2. Swap catalog in plugin thread
- Add `src/catalog/swap-components.json` with demo entries.
- Implement `src/plugin/swap/catalog.ts`:
  - load catalog entries
  - filter by `enabled === true`
  - ignore entries with empty keys
  - query by `query` + `keywords` + display fields
  - apply `limit` default
- Return deterministic ordering (stable, predictable demo behavior).

3. Property mapping engine
- Implement `src/plugin/swap/propertyMapper.ts`:
  - read source `componentPropertyDefinitions`
  - compare against target instance `componentProperties`
  - match only exact property name and exact type
  - validate variant values against source enum options
  - produce a mapping plan and issues:
    - `PROP_MISSING_IN_SOURCE`
    - `PROP_TYPE_MISMATCH`
    - `PROP_VALUE_INCOMPATIBLE`

4. Core replace algorithm
- Implement `src/plugin/swap/replaceInstances.ts`:
  - resolve/import source component from selected catalog item
  - support `defaultVariantComponentKey` when source points to a component set
  - fail-fast with `PLUGIN_ERROR` if source cannot resolve/import as `COMPONENT`
  - split selection into target instances vs skipped non-instances (`NOT_INSTANCE`)
  - process each target independently:
    - skip locked (`LOCKED`)
    - snapshot name + geometry/layout attributes
    - `swapComponent`
    - restore original name
    - best-effort geometry/layout restore (`GEOMETRY_REAPPLY_PARTIAL` on partial)
    - apply mapped properties with guarded `setProperties`
    - emit `TEXT_MIGRATION_SKIPPED` warning
  - aggregate summary counts (`selected`, `targets`, `swapped`, `skipped`, `failed`)
  - emit progress updates (`processed`, `total`) after each target

5. Canvas integration
- Update `src/canvas.ts` message switch:
  - `REQUEST_SELECTION_STATE`: compute current selection counts and return `SELECTION_STATE`
  - `CATALOG_QUERY`: return `CATALOG_RESULTS`
  - `RUN_REPLACE`: call replace routine and emit progress + final result
- Add `figma.on('selectionchange', ...)` to proactively send updated `SELECTION_STATE` while UI is open.
- Keep existing `PLUGIN_READY`/catalog load and `PLACE_COMPONENT` behavior unchanged.

6. UI state and panel
- Extend `src/ui/store.ts` with swap slice:
  - selected source + catalog results
  - selection counts
  - running/progress
  - last result/issues
  - plugin-level error for swap actions
- Add `src/ui/components/InstanceSwapPanel.tsx`:
  - source search/select
  - helper text and disabled states
  - replace button with running progress
  - compact post-run summary
  - warnings/errors list only
- Integrate panel into browse flow in `src/ui/App.tsx` and wire message handlers.

7. Tests and QA
- Add unit tests for:
  - exact property mapping rules
  - catalog filtering/query behavior
  - summary aggregation and issue bucketing
  - store swap state transitions
- Manual QA in Figma:
  - selected instances are swapped
  - non-instance selection is skipped with warnings
  - bad source key fails fast with no mutation
  - original layer names are preserved
  - geometry remains stable in common layouts

## Definition of Done

- Swap flow works end-to-end in plugin UI and Figma canvas.
- Locked decisions in `context-handoff.md` are fully respected.
- Existing placement flow remains functional (no regression).
- New tests pass (`npm test`) and cover swap core logic.
- Manual QA checklist completed for the demo scenarios.

## Risks and Mitigations

- Risk: Geometry restoration differences across Auto Layout contexts.
  - Mitigation: snapshot/apply best-effort fields only; warn with `GEOMETRY_REAPPLY_PARTIAL`.
- Risk: Source import failures due to placeholder/invalid keys.
  - Mitigation: pre-validate catalog entries and fail-fast before any instance mutation.
- Risk: Large selections causing UI freeze perception.
  - Mitigation: emit `REPLACE_PROGRESS` after each target and keep per-instance isolation.
