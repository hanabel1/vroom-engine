# Research: Automated Catalog Generation with Resolved CSS

**Date**: 2026-02-07
**Branch**: `001-design-system-catalog`

## Problem Statement

The catalog JSON files (`src/catalog/mui-v5.json`, etc.) contain hand-written `html` fields with fully resolved inline styles. This doesn't scale. Alexander wants to parse design system components and produce static HTML with CSS variables, theme tokens, and utility classes resolved to concrete values.

## Research Tasks

### R1: How to resolve CSS variables and theme tokens at extraction time

**Decision**: Use a real browser engine (Playwright) to render components and extract `getComputedStyle()`.

**Rationale**: A browser resolves everything -- CSS custom properties (`var(--spectrum-*)`), CSS-in-JS injected styles (Emotion/styled-components), Tailwind utility classes, inherited values, cascade. No other approach gives complete resolution across all styling architectures.

**Alternatives considered**:
- **React SSR + style extraction**: Fails for CSS custom properties and utility classes. Only works for CSS-in-JS where tokens are resolved in JS. Would need a different pipeline per architecture.
- **Design token files + templates**: Automates values but not DOM structure. Still requires hand-writing HTML templates per component. Essentially the current manual approach with tokenized variables.
- **Storybook scraping**: Adds 10+ dependencies for Storybook infra. The actual extraction logic (Playwright + `getComputedStyle()`) is identical to direct rendering. Storybook is optional convenience, not a requirement.

### R2: How to filter getComputedStyle (returns ~340 properties) to relevant subset

**Decision**: Diff against a bare element of the same tag, keep only properties that differ. Use an allowlist (~50 properties) as a tiebreaker for edge cases.

**Rationale**: Diffing against a bare element captures exactly what the design system adds. The allowlist prevents dumping irrelevant browser defaults that happen to differ across platforms.

**Alternatives considered**:
- **Allowlist only**: Simpler but may miss properties specific to certain components.
- **All properties**: Produces massive inline style strings (300+ declarations). Slows down the converter and produces noise.

### R3: How to handle multiple design systems with different CSS architectures

| Design System | CSS Architecture | Resolution via Playwright |
|---|---|---|
| MUI v5 | Emotion CSS-in-JS, JS theme tokens | Emotion injects `<style>` at runtime, browser resolves |
| Spectrum | CSS custom properties (`--spectrum-*`) | Browser resolves all `var()` |
| Tailwind UI | Utility classes (`.bg-blue-500`) | Tailwind CSS loaded, classes resolve to computed values |

**Decision**: One shared extraction script + per-system "component registry" files. Each registry maps component IDs to rendered React elements with default props.

**Rationale**: The extraction logic (DOM walk + `getComputedStyle()`) is universal. Only the rendering setup differs per system.

### R4: How to handle theme accents and color modes

**Decision**: Render each component in the design system's default theme first. Support optional theme override parameter in the registry for generating dark-mode or alternate-theme variants later.

**Rationale**: Start simple. The catalog needs one canonical rendering per component. Theme variants can be added incrementally as separate catalog entries or variant HTML.

### R5: How to handle pseudo-elements

**Decision**: Skip pseudo-elements for v1. Detect `::before`/`::after` with non-empty `content` and log a warning. Most catalog components use real elements, not pseudo-elements for visible content.

**Rationale**: Pseudo-elements cannot be represented as inline styles. Converting them to real `<span>` children is possible but adds complexity. Not needed for the initial 15 components.

## Key Architecture Decision

```
Playwright extractor (build-time only, not shipped in plugin)
│
├── tools/extract-catalog/extractor.ts    ← Playwright: launch, render, extract
├── tools/extract-catalog/style-filter.ts ← Diff vs bare + allowlist
├── tools/extract-catalog/dom-walker.ts   ← Recursive DOM → inline-style HTML
│
├── tools/extract-catalog/registries/
│   ├── mui-v5.tsx       ← { button: <Button>Button</Button>, ... }
│   ├── spectrum.tsx     ← { button: <ActionButton>Button</ActionButton>, ... }
│   └── tailwind-ui.tsx  ← { button: <button className="bg-indigo-600 ...">Button</button>, ... }
│
└── Output: src/catalog/*.json (updated html fields)
```

**Key property**: Adding a new design system = adding one registry file. The extraction logic is shared.

---

## Phase 2: Converter Hardening Research

**Context**: The extraction pipeline is complete. The `/speckit.analyze` command revealed that the converter (`src/plugin/converter/`) crashes when processing extracted HTML. The following research tasks investigate the root causes.

### R6: Figma API constraints for min/max dimension setters

**Decision**: Guard all min/max setters with `val != null && val > 0 ? val : null`.

**Rationale**: From `@figma/plugin-typings` v1.123.0:
- `minWidth: number | null` -- "Value must be positive. Set to `null` to remove."
- Same contract for `maxWidth`, `minHeight`, `maxHeight`
- 0 is NOT positive -- setting to 0 throws an error
- `null` means "no constraint" (equivalent to CSS `none`/`auto`/`0`)
- These properties are only applicable to auto-layout frames and their direct children
- `layoutMode` must be set BEFORE these properties (confirmed by Figma forum reports)

**Alternatives considered**:
- **Skip setting entirely if 0**: Simpler but loses the semantic difference between "not set" and "explicitly 0". Since Figma treats both as "no constraint", skipping is equivalent and safe.
- **Clamp to 1**: Would create a minimum of 1px even when CSS says 0. Introduces visual artifacts.

### R7: How `getComputedStyle` output differs from hand-written CSS

**Decision**: The converter must handle longhand CSS properties produced by `getComputedStyle`.

**Rationale**: `getComputedStyle()` always returns resolved longhand properties, never shorthands. The browser breaks down:
- `border: 1px solid black` → `border-top-width: 1px; border-right-width: 1px; ... border-top-style: solid; ... border-top-color: rgb(0, 0, 0); ...`
- `padding: 8px 16px` → `padding-top: 8px; padding-right: 16px; padding-bottom: 8px; padding-left: 16px`
- `min-width: 0` → `min-width: 0px` (always with units)
- `max-width: none` → `max-width: none` (keyword preserved)

The converter's `parseInlineStyles` already handles padding longhands (`padding-top`, etc.) but NOT border longhands or margin longhands.

**Properties gap analysis**:

| CSS Property Group | Longhand Form | Parser Handles? | Figma API Target |
|---|---|---|---|
| padding-* | padding-top/right/bottom/left | YES | paddingTop/Right/Bottom/Left |
| border-*-width | border-top-width, etc. | NO | strokeWeight (uniform) |
| border-*-color | border-top-color, etc. | NO | strokes[0].color |
| border-*-style | border-top-style, etc. | NO | (skip if not solid) |
| margin-* | margin-top/right/bottom/left | NO | N/A (Figma has no margin) |

### R8: How to handle SVG elements in conversion

**Decision**: Add SVG-related tags to `skipTags` in `classifyElement`.

**Rationale**: The MUI Alert component includes `<svg>` icons with `<path>` children. These cannot be meaningfully converted to Figma frames. Options evaluated:
- **Skip (chosen)**: Simplest. Icons are decorative; losing them is acceptable for prototype-fast delivery.
- **Convert to Figma vectors**: Would require parsing SVG path data into Figma VectorNode. High complexity, low value at this stage.
- **Replace with colored rectangle**: Would produce a placeholder but is misleading. Worse than nothing.

Tags to skip: `svg`, `path`, `circle`, `rect` (SVG rect, not HTML), `line`, `polyline`, `polygon`, `g`, `defs`, `clipPath`, `use`.

### R9: How to handle CSS keyword values in `parseUnit`

**Decision**: Change `parseUnit` return type to `number | undefined`. Return `undefined` for non-numeric keywords.

**Rationale**: CSS keywords that appear in extracted HTML and currently break the converter:
- `none` (max-width, max-height) → should mean "no constraint" → `undefined`
- `auto` (min-width, min-height, width, height) → should mean "auto-size" → `undefined`
- `normal` (gap, line-height, letter-spacing) → should mean "default" → `undefined`
- `inherit`, `initial`, `unset` → should mean "use default" → `undefined`

Returning `undefined` instead of `0` lets callers distinguish "property not set" from "property set to zero".

**Alternatives considered**:
- **Return 0 and guard at call sites**: Current approach. Fails because 0 is a valid value for some properties (padding, border-width) but invalid for others (min-width in Figma).
- **Return NaN**: NaN propagates through arithmetic and is harder to guard against than undefined.
- **Return a sentinel value (-1)**: Non-standard, error-prone.
