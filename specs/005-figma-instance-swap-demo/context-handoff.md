# Context Handoff: Demo Figma Instance Swap

## Source of Context

This handoff compresses work completed in the **wrong repo/worktree** (kept intact as requested):
- Worktree: `/Users/alexander.langolf/github/design-systems-storybooks-figma-swap`
- Branch: `codex/figma-instance-swap`

Reference artifacts there:
- Consensus: `/Users/alexander.langolf/github/design-systems-storybooks-figma-swap/reports/figma-swap-agents/consensus.md`
- Agent notes:
  - `/Users/alexander.langolf/github/design-systems-storybooks-figma-swap/reports/figma-swap-agents/figma-semantics.md`
  - `/Users/alexander.langolf/github/design-systems-storybooks-figma-swap/reports/figma-swap-agents/swap-algorithm-demo.md`
  - `/Users/alexander.langolf/github/design-systems-storybooks-figma-swap/reports/figma-swap-agents/ux-reporting-demo.md`
- Implemented demo plugin module (for copy/reference): `/Users/alexander.langolf/github/design-systems-storybooks-figma-swap/figma-plugin`

## Goal

Add a **demo-first** feature to Vroom Engine: swap currently selected Figma instances to a source component chosen from an in-plugin catalog.

## Locked Decisions (Do Not Re-open for Demo)

1. Layer naming:
- Keep each target instance layer name exactly unchanged after swap.

2. Target selection:
- Only selected nodes with `type === 'INSTANCE'` are targets.
- Non-instance selected nodes are skipped and reported as warnings.

3. Props mapping:
- Exact property name + exact property type only.
- Variant values must be valid in target source definitions.
- No fuzzy mapping, no ID mapping.

4. Text behavior:
- Skip text override migration entirely for demo.

5. Failure policy:
- Fail-fast with no mutations if source component cannot be resolved/imported.
- Per-instance isolation otherwise: one instance failure does not stop others.

## Message Protocol (Recommended for vroom-engine)

Extend current UI/plugin protocol in `src/ui/types/messages.ts` with:

UI -> Plugin:
- `REQUEST_SELECTION_STATE`
- `CATALOG_QUERY` `{ query: string; limit?: number }`
- `RUN_REPLACE` `{ sourceId: string }`

Plugin -> UI:
- `SELECTION_STATE` `{ selectedInstanceCount: number; ignoredNonInstanceCount: number }`
- `CATALOG_RESULTS` `{ query: string; items: CatalogItem[] }`
- `REPLACE_PROGRESS` `{ processed: number; total: number }`
- `REPLACE_RESULT` `{ sourceId: string; summary: SwapSummary; nodes: SwapNodeResult[]; issues: SwapIssue[] }`
- `PLUGIN_ERROR` `{ code: string; message: string; detail?: string }`

Suggested issue codes:
- Warnings: `NOT_INSTANCE`, `LOCKED`, `GEOMETRY_REAPPLY_PARTIAL`, `PROP_MISSING_IN_SOURCE`, `PROP_TYPE_MISMATCH`, `PROP_VALUE_INCOMPATIBLE`, `PROP_APPLY_FAILED`, `TEXT_MIGRATION_SKIPPED`
- Errors: `SOURCE_NOT_COMPONENT`, `SWAP_FAILED`, `REPLACE_FAILED`

## Execution Algorithm (Demo)

1. Validate source:
- Resolve source from plugin catalog by `sourceId`.
- Import via `figma.importComponentByKeyAsync`.
- If source resolves to `COMPONENT_SET`, require and import a default variant component key.
- If still not `COMPONENT`, emit `PLUGIN_ERROR` and stop.

2. Build target set:
- Read `figma.currentPage.selection`.
- Split to `INSTANCE` targets vs skipped non-instances (record warnings).

3. Per target instance:
- Skip locked instances (`LOCKED`).
- Snapshot: `name`, `x`, `y`, `rotation`, optional `width/height`, constraints/layout attrs.
- Snapshot `componentProperties`.
- Build exact-name/type property plan against source `componentPropertyDefinitions`.
- `swapComponent(sourceComponent)`.
- Restore original `name`.
- Best-effort reapply geometry/layout; warn if partial.
- Apply planned props with `setProperties`; warn on failures.
- Add `TEXT_MIGRATION_SKIPPED` warning.

4. Return:
- Summary counts (`selected`, `targets`, `swapped`, `skipped`, `failed`) + per-node issues.

## Minimal UI for Demo

Required states:
- Idle: no source selected, Replace disabled.
- Source selected + no instances: Replace disabled with helper text.
- Ready: source selected + `selectedInstanceCount > 0`, Replace enabled.
- Running: Replace disabled, show `processed / total`.
- Complete: compact summary + list warnings/errors only.

## Mapping Into vroom-engine (Concrete)

Primary files to modify in this repo:
- `src/canvas.ts`
  - Add handlers for selection state, catalog query, and run-replace.
  - Keep existing placement flow intact.

- `src/ui/types/messages.ts`
  - Add swap message unions/types.

- `src/ui/store.ts`
  - Add swap UI state slice:
    - source selection
    - selection counts
    - running/progress
    - last swap result/issues

- `src/ui/App.tsx`
  - Subscribe to new plugin messages and dispatch store actions.
  - Render compact swap panel in browse flow (or new component).

- New files (recommended):
  - `src/plugin/swap/catalog.ts` (search/filter source records)
  - `src/plugin/swap/propertyMapper.ts` (exact mapping)
  - `src/plugin/swap/replaceInstances.ts` (core swap algorithm)
  - `src/ui/components/InstanceSwapPanel.tsx` (minimal UI)
  - `src/catalog/swap-components.json` (catalog source mapping)

## Data Model for Source Catalog

Use a static JSON file for demo:

```json
{
  "id": "material-ui/button",
  "systemId": "material-ui",
  "componentId": "button",
  "displayName": "MUI Button",
  "keywords": ["mui", "button"],
  "figmaComponentKey": "REPLACE_WITH_REAL_KEY",
  "defaultVariantComponentKey": null,
  "enabled": true
}
```

Rules:
- Only `enabled === true` and non-empty `figmaComponentKey` are selectable.
- Placeholder keys are allowed for demo scaffolding but should warn in validation.

## Port Checklist

1. Add message types and wire UI<->plugin handlers.
2. Implement source catalog search/filter in plugin thread.
3. Implement swap core with locked policies above.
4. Add minimal UI panel + result rendering.
5. Add tests:
- exact prop mapping
- summary aggregation
- catalog filtering/search
6. Manual QA in Figma:
- selected instances swap
- non-instance selection is skipped
- missing key fails fast with no mutation
- names preserved
- geometry mostly stable

## What Was Already Implemented Elsewhere (Reference Only)

The full demo implementation (TypeScript logic + tests + build script) exists in:
`/Users/alexander.langolf/github/design-systems-storybooks-figma-swap/figma-plugin`

Use it as a behavior reference, not as direct copy without adapting to Vroom Engine’s architecture.
