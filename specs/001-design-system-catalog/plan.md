# Implementation Plan: Converter Hardening for Extracted Catalog HTML

**Branch**: `001-design-system-catalog` | **Date**: 2026-02-07 | **Spec**: [spec.md](spec.md)
**Input**: Analysis findings from `/speckit.analyze` -- converter crashes when placing extracted components
**Prerequisite**: Extraction pipeline (T001-T025) is complete. This plan covers converter fixes needed before T026 (e2e validation).

## Summary

The Playwright-based extraction pipeline is complete and produces catalog JSON with fully resolved inline styles via `getComputedStyle()`. However, the HTML-to-Figma converter (`src/plugin/converter/`) crashes when processing this output because `getComputedStyle` returns longhand CSS properties and zero/keyword values that the converter does not handle. This plan hardens the converter to work with extracted HTML, unblocking FR-008 (visual fidelity) and T026 (e2e validation).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: React 18, Fuse.js 7.x, Vite 5.x, vite-plugin-singlefile, @figma/plugin-typings 1.123.0
**Storage**: JSON files in `src/catalog/`
**Testing**: Vitest for unit tests
**Target Platform**: Figma Plugin API (sandbox + iframe)
**Project Type**: Single (Figma plugin)
**Performance Goals**: Place any catalog component in under 2 seconds
**Constraints**: Plugin bundle < 5MB. All Figma API calls inside sandbox thread. No Node.js APIs.
**Scale/Scope**: 15 components across 3 design systems, extensible to 50+

## Constitution Check

*GATE: Must pass before implementation. Re-checked post-design.*

| Principle | Status | Notes |
|---|---|---|
| I. Plugin-Architecture-Driven | PASS | All converter code runs in the Figma sandbox. No new architecture changes. |
| II. Prototype-Fast Delivery | PASS | Fixes target specific identified bugs. No premature abstraction -- each fix is the simplest correction. |
| III. Designer-Centric UX | **FIXING VIOLATION** | Analysis found placement is broken (empty frames, console errors). These fixes restore visual fidelity required by FR-008. |
| IV. Minimal Dependencies | PASS | No new dependencies. All fixes are to existing code. |
| V. Incremental Testability | PASS | Each fix can be tested by placing a specific component in Figma. T026 validates end-to-end. |

## Problem Analysis (from `/speckit.analyze`)

### Root Cause Chain

```
Extractor (Playwright) → getComputedStyle → always returns longhand CSS
  e.g. border-top-width: 1px, min-width: 0px, max-width: none
       ↓
Style parser (styles.ts) → parseUnit("none") → 0, parseUnit("0px") → 0
       ↓
Mapper (mapper.ts) → frame.minWidth = 0 → Figma API THROWS
  "minWidth cannot be set to 0, use null to unset"
       ↓
applyAutoLayoutSizing throws BEFORE children loop
       ↓
figma.createFrame() already placed root frame on canvas
       ↓
Result: empty frame on canvas, no children, PLACEMENT_ERROR
```

### Figma API Constraints (from research)

From `@figma/plugin-typings` v1.123.0:

```typescript
minWidth: number | null  // Value must be POSITIVE. Set to null to remove.
maxWidth: number | null  // Value must be POSITIVE. Set to null to remove.
minHeight: number | null // Value must be POSITIVE. Set to null to remove.
maxHeight: number | null // Value must be POSITIVE. Set to null to remove.
```

- 0 is NOT positive → throws
- `null` means "no constraint"
- Only applicable to auto-layout frames and their direct children
- `layoutMode` must be set BEFORE these properties

## Project Structure

### Files Modified (this plan)

```text
src/plugin/converter/
├── styles.ts             # Fix parseUnit, add border longhand parsing
├── parser.ts             # Add SVG skip tags
└── mapper.ts             # Guard min/max setters, error resilience
```

### Files Created (this plan)

```text
specs/001-design-system-catalog/
└── contracts/
    └── converter-api.md  # New: documents supported CSS properties
```

### Existing (unchanged)

```text
tools/extract-catalog/    # Extraction pipeline -- complete, no changes
src/catalog/*.json        # Extracted catalog data -- no changes
src/ui/                   # Plugin UI -- no changes
src/canvas.ts             # Plugin entry point -- no changes
```

## Fix Inventory

### Fix 1: `parseUnit` must handle CSS keywords (CRITICAL)

**File**: `src/plugin/converter/styles.ts`
**Problem**: `parseUnit('none')`, `parseUnit('auto')`, `parseUnit('normal')` all return `0` via `parseFloat → NaN → 0`. This `0` propagates to Figma API setters that reject it.
**Fix**: Return `undefined` for non-numeric keywords. Change return type to `number | undefined`. Update all callers to handle `undefined`.
**Affected properties**: `min-width`, `min-height`, `max-width`, `max-height`, `gap`, `width`, `height`

### Fix 2: Guard Figma API min/max setters (CRITICAL)

**File**: `src/plugin/converter/mapper.ts`
**Problem**: `frame.minWidth = 0` throws. Even after Fix 1, some extracted values may legitimately be `0` (e.g., `min-width: 0px`).
**Fix**: Guard all four setters: `frame.minWidth = val != null && val > 0 ? val : null`. Wrap `applyAutoLayoutSizing` in try-catch so a single property failure doesn't prevent children from being created.

### Fix 3: Parse border longhand CSS properties (HIGH)

**File**: `src/plugin/converter/styles.ts`
**Problem**: Extracted HTML uses `border-top-width: 2px; border-top-style: solid; border-top-color: rgb(...)` (longhand from `getComputedStyle`). The parser only handles `border-width` and `border` shorthands. All border styling is silently dropped.
**Fix**: Add cases for `border-top-width`, `border-right-width`, `border-bottom-width`, `border-left-width`, `border-top-color` (etc.), and `border-top-style` (etc.). Use the max of all four widths for `borderWidth` (Figma uses uniform stroke weight). Use first non-transparent color for `borderColor`. Only apply if at least one style is `solid`.

### Fix 4: Skip SVG elements in classifier (MEDIUM)

**File**: `src/plugin/converter/parser.ts`
**Problem**: `<svg>`, `<path>`, `<circle>`, `<rect>`, `<line>`, `<polyline>`, `<polygon>` elements from MUI Alert icons are converted to empty frames.
**Fix**: Add these tag names to `skipTags` set in `classifyElement`.

### Fix 5: Fix `shouldRenderAsFrame` truthiness check (MEDIUM)

**File**: `src/plugin/converter/mapper.ts`
**Problem**: `shouldRenderAsFrame` uses `Boolean(styles.minWidth || ...)`. Since `0` is falsy, `minWidth: 0` won't trigger frame rendering even though it's an explicit value.
**Fix**: Use explicit `!== undefined` checks for all numeric properties.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | All fixes are minimal, targeted changes to existing code | N/A |
