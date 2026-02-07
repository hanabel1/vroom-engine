# Tasks: Design System Catalog — Extraction + Converter Hardening

**Input**: Design documents from `/specs/001-design-system-catalog/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/extractor-api.md, contracts/converter-api.md

**Tests**: Not explicitly requested in spec. Tests included for foundational extraction logic only (style-filter, dom-walker) since these are the critical-path modules.

**Organization**: Phases 1-5 deliver US4 (Catalog Contribution). Phase 6 delivers US2 (Placement fidelity) by fixing the converter to handle extracted HTML. Phase 7 validates end-to-end.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup

**Purpose**: Install Playwright, create directory structure, define types

- [X] T001 Install Playwright as devDependency and run `npx playwright install chromium`
- [X] T002 Create directory structure `tools/extract-catalog/` and `tools/extract-catalog/registries/`
- [X] T003 [P] Define TypeScript types (ComponentRegistry, ComponentEntry, StyleFilter config) in `tools/extract-catalog/types.ts`
- [X] T004 [P] Add `extract-catalog` npm script to `package.json` pointing to `tsx tools/extract-catalog/extractor.ts`

---

## Phase 2: Foundational (Shared Extraction Logic)

**Purpose**: Core modules that all registries depend on. MUST complete before any registry extraction.

- [X] T005 [P] Implement CSS property allowlist and denylist constants in `tools/extract-catalog/style-filter.ts` per contracts/extractor-api.md
- [X] T006 [P] Implement `diffStyles(computed, baseline)` function in `tools/extract-catalog/style-filter.ts` that compares computed styles against a bare element and returns only meaningful differences
- [X] T007 [P] Write tests for style-filter: bare-element diff, allowlist filtering, denylist exclusion in `tests/extract-catalog/style-filter.test.ts`
- [X] T008 Implement `walkDOM(element)` function in `tools/extract-catalog/dom-walker.ts` that recursively serializes a DOM tree to HTML string with inline styles from `getComputedStyle()`
- [X] T009 Write tests for dom-walker: single element, nested children, text nodes, skip pseudo-elements in `tests/extract-catalog/dom-walker.test.ts`
- [X] T010 Create minimal render harness HTML page in `tools/extract-catalog/render-harness.html` that loads React and renders a component from a registry

**Checkpoint**: Extraction logic complete. Style filtering and DOM walking tested. Ready for registry-specific work.

---

## Phase 3: User Story 4 - MUI v5 Extraction (Priority: P4) -- MVP

**Goal**: Extract all 5 MUI v5 components (button, textfield, card, chip, alert) via Playwright and produce catalog JSON matching the existing hand-written quality.

**Independent Test**: Run `npm run extract-catalog -- --system mui-v5`, compare output `src/catalog/mui-v5.json` html fields against hand-written versions. Visual spot-check: load updated catalog in Figma plugin, place MUI Button, verify it matches the reference walkthrough from converter_rewrite plan.

- [X] T011 [US4] Implement Playwright orchestration in `tools/extract-catalog/extractor.ts`: launch browser, load harness, render component, call dom-walker, write output
- [X] T012 [US4] Implement CLI argument parsing in `tools/extract-catalog/extractor.ts`: `--system`, `--component`, `--dry-run` flags per contracts/extractor-api.md
- [X] T013 [US4] Install `@mui/material @emotion/react @emotion/styled` as devDependencies
- [X] T014 [US4] Create MUI v5 component registry in `tools/extract-catalog/registries/mui-v5.tsx` with all 5 components (button, textfield, card, chip, alert) and their default renders
- [X] T015 [US4] Implement catalog JSON merge logic in `tools/extract-catalog/extractor.ts`: read existing JSON, update only `html` fields, preserve `props`, `previewUrl`, `aliases`, write back
- [X] T016 [US4] Run extraction for MUI v5 and validate output with `npm run validate-catalog`

**Checkpoint**: MUI v5 catalog is now auto-generated. Run plugin in Figma, search "Button", place it, verify visual fidelity.

---

## Phase 4: User Story 4 - Spectrum & Tailwind Registries

**Goal**: Extend extraction to the remaining 2 design systems.

- [X] T017 [P] [US4] Install `@adobe/react-spectrum` as devDependency
- [X] T018 [P] [US4] Install Tailwind CSS as devDependency and create minimal Tailwind config for extraction
- [X] T019 [P] [US4] Create Spectrum component registry in `tools/extract-catalog/registries/spectrum.tsx` with all 5 components (button, textfield, card, badge, dialog)
- [X] T020 [P] [US4] Create Tailwind UI component registry in `tools/extract-catalog/registries/tailwind-ui.tsx` with all 5 components (button, input, card, badge, alert)
- [X] T021 [US4] Run extraction for all 3 systems and validate with `npm run validate-catalog`

**Checkpoint**: All 15 components across 3 design systems extracted automatically. Full catalog regeneration takes under 60 seconds.

---

## Phase 5: Extraction Polish

**Purpose**: Documentation, edge cases for extraction pipeline

- [X] T022 [P] Add pseudo-element detection and warning logging in `tools/extract-catalog/dom-walker.ts`
- [X] T023 [P] Add font-wait logic in `tools/extract-catalog/extractor.ts` (wait for web fonts to load before extracting)
- [X] T024 Update `specs/001-design-system-catalog/quickstart.md` with actual CLI usage and verified steps
- [X] T025 Run full plugin build (`npm run build`) and verify bundle size unchanged (Playwright not in plugin bundle)

**Checkpoint**: Extraction pipeline polished. Documentation updated. Bundle size verified.

---

## Phase 6: User Story 2 - Converter Hardening (Priority: P2)

**Goal**: Fix the HTML-to-Figma converter to correctly process extracted catalog HTML. Currently broken: placing any component produces an empty frame with console error `minWidth cannot be set to 0`.

**Independent Test**: Load plugin in Figma, search "Button", click Place on MUI Button. Verify: (1) frame contains child nodes (not empty), (2) no console errors, (3) colors, text, and layout are visually recognizable as a button.

**Root cause**: `getComputedStyle` returns longhand CSS properties (`border-top-width`) and keyword values (`max-width: none`) that the converter cannot parse. `parseUnit('none')` returns `0`, which the Figma API rejects for `minWidth`/`maxWidth` setters (must be positive or null).

**Contract**: See `contracts/converter-api.md` for full property mapping.

- [X] T027 [US2] Fix `parseUnit` in `src/plugin/converter/styles.ts`: change return type to `number | undefined`, return `undefined` for non-numeric CSS keywords (`none`, `auto`, `normal`, `inherit`, `initial`, `unset`), update all callers in `parseInlineStyles` to handle `undefined` (skip assignment when `undefined`)
- [X] T028 [P] [US2] Add border longhand CSS property parsing in `src/plugin/converter/styles.ts`: add switch cases for `border-top-width`, `border-right-width`, `border-bottom-width`, `border-left-width` (take max for uniform `borderWidth`), `border-top-style` through `border-left-style` (apply border only if at least one is `solid`), `border-top-color` through `border-left-color` (use first non-transparent color for `borderColor`)
- [X] T029 [P] [US2] Add SVG element tags to `skipTags` set in `src/plugin/converter/parser.ts`: add `svg`, `path`, `circle`, `rect`, `line`, `polyline`, `polygon`, `g`, `defs`, `clippath`, `use`
- [X] T030 [US2] Guard min/max dimension setters in `applyAutoLayoutSizing` in `src/plugin/converter/mapper.ts`: for each of `minWidth`, `maxWidth`, `minHeight`, `maxHeight`, set `val != null && val > 0 ? val : null`. Wrap the entire `applyAutoLayoutSizing` call in `createFrameNode` with try-catch so setter failures log a warning but do not prevent children from being created.
- [X] T031 [US2] Fix `shouldRenderAsFrame` in `src/plugin/converter/mapper.ts`: replace truthiness checks (`styles.minWidth || ...`) with explicit `!== undefined` checks for all numeric properties (`minWidth`, `minHeight`, `maxWidth`, `maxHeight`, `borderWidth`, `borderRadius`, `gap`)

**Checkpoint**: Place MUI Button, Spectrum Button, and Tailwind Button in Figma. Each should produce a multi-layer frame with visible text, background color, and correct spacing. No console errors.

---

## Phase 7: End-to-End Validation

**Purpose**: Validate the full pipeline — extraction through placement — across all design systems.

- [ ] T032 End-to-end validation: load plugin in Figma, search and place one component from each design system (MUI Button, Spectrum Button, Tailwind Button), verify visual fidelity per FR-008 and SC-003

---

## Dependencies and Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001-T004 (Setup) — BLOCKS all extraction
- **MUI MVP (Phase 3)**: Depends on Phase 2 completion
- **Spectrum & Tailwind (Phase 4)**: Depends on Phase 3 (extractor.ts must work first). T017-T020 can run in parallel.
- **Extraction Polish (Phase 5)**: Depends on Phase 4 completion
- **Converter Hardening (Phase 6)**: Depends on Phase 5 (needs extracted catalog HTML to test against). T028 and T029 can run in parallel. T027 must complete before T030-T031.
- **E2E Validation (Phase 7)**: Depends on Phase 6 completion

### User Story Dependencies

- **US4 (Catalog Contribution)**: Phases 1-5. Complete.
- **US2 (Placement)**: Phase 6. Blocked until converter fixes land.
- **US1 (Search)**: No change — catalog JSON schema stays the same.

### Within Phase 6

- T027 (parseUnit fix) must complete first — T030 and T031 depend on the new return type
- T028 (border longhand) is parallel — different part of styles.ts, no dependency on T027
- T029 (SVG skip) is parallel — different file (parser.ts)
- T030 (guard setters) depends on T027
- T031 (shouldRenderAsFrame) depends on T027

### Parallel Opportunities

```text
# Phase 6 parallel group 1 (independent files/functions):
Task: "T028 Border longhand parsing in styles.ts"
Task: "T029 SVG skip tags in parser.ts"

# Phase 6 sequential (dependency chain):
T027 → T030 → T031
```

---

## Implementation Strategy

### Completed Work (Phases 1-5)

Extraction pipeline is done. 25/25 tasks complete. All 15 components across 3 design systems are extracted automatically.

### Current Focus (Phase 6: Converter Hardening)

1. T027: Fix `parseUnit` return type — this unblocks all other mapper fixes
2. T028 + T029 in parallel: border longhand parsing + SVG skip (independent)
3. T030: Guard min/max setters (depends on T027)
4. T031: Fix shouldRenderAsFrame (depends on T027)
5. **STOP and VALIDATE**: Place one component from each system. Check for console errors and visual fidelity.

### Then (Phase 7)

6. T032: Full e2e validation across all 3 design systems

---

## Summary

| Metric | Value |
|---|---|
| Total tasks | 32 |
| Phase 1-5 (Extraction) | 25 tasks (complete) |
| Phase 6 (Converter Hardening) | 5 tasks (new) |
| Phase 7 (E2E Validation) | 1 task (was T026, renumbered T032) |
| Remaining tasks | 6 |
| Parallel opportunities in Phase 6 | 2 tasks (T028, T029) |
| MVP scope for Phase 6 | T027 + T030 (unblocks placement) |

## Notes

- [P] tasks = different files, no dependencies
- [US4] maps to User Story 4 (Catalog Contribution) — Phases 1-5
- [US2] maps to User Story 2 (Placement) — Phase 6
- Phase 6 MVP: T027 + T030 alone will fix the crash (empty frame bug). T028, T029, T031 improve fidelity.
- Commit after each task or logical group
