# Research: Catalog Search

**Branch**: `003-catalog-search` | **Date**: 2026-02-07

## R1: Alias Database Format and Storage

**Decision**: Static JSON file at `src/catalog/aliases.json` containing an array of alias groups. Each group is an array of synonymous terms.

**Rationale**: 
- Simplest possible format — a JSON array of string arrays.
- Imported statically at build time (same as catalog JSONs in `canvas.ts`), adding zero runtime overhead and zero network requests.
- Easy to maintain: adding a new synonym means adding a string to an existing group or creating a new group.
- No database, no service, no schema migration needed.
- Bidirectional by design: every term in a group is equivalent to every other term.

**Alternatives considered**:
1. **Key-value map** (`{ "combobox": ["autocomplete", "typeahead"] }`): Rejected — implies one canonical term per group, making bidirectionality awkward. Requires the maintainer to pick a "primary" term.
2. **Per-component alias field only** (existing `aliases` in catalog JSON): Rejected — this handles component-specific aliases (e.g., Button → "btn"), but cannot express cross-component concept synonyms (e.g., "combobox" used by MUI maps to "autocomplete" used by Spectrum).
3. **Remote alias service**: Rejected — violates Constitution Principle IV (Minimal Dependencies) and Principle I (no external network calls). Overkill for ~20 alias groups.

**Format example**:
```json
[
  ["combobox", "autocomplete", "typeahead", "select with search"],
  ["dialog", "modal", "popup", "overlay dialog"],
  ["chip", "tag", "badge-label", "pill"],
  ["notification", "alert", "message", "banner", "toast"],
  ["toggle", "switch", "on-off"],
  ["dropdown", "select", "picker", "listbox"],
  ["textfield", "input", "text-input", "form-field"],
  ["card", "panel", "container", "surface"],
  ["tabs", "tab-bar", "segmented-control"],
  ["breadcrumbs", "breadcrumb", "navigation-trail"],
  ["tooltip", "hint", "info-tip"],
  ["avatar", "profile-image", "user-icon"],
  ["progress", "progress-bar", "loading-bar"],
  ["accordion", "collapsible", "expandable"],
  ["stepper", "wizard", "multi-step"]
]
```

## R2: Alias Expansion Strategy

**Decision**: Pre-search expansion. When a user types a query, the alias resolver looks up all alias groups that contain any word from the query. It returns the union of all matched terms. Fuse.js then runs a single search against all expanded terms (joined with `|` as an OR pattern via Fuse.js extended search, or by running multiple searches and deduplicating).

**Rationale**:
- Fuse.js does not natively support OR queries with separate terms. The cleanest approach is to run the original query through Fuse.js, then also run each expanded alias term, and merge + deduplicate results by component identity (`designSystemId + componentId`).
- This keeps the Fuse.js index simple (unchanged from current implementation) and concentrates alias logic in a single resolver module.
- Deduplication uses the highest relevance score when a component matches through multiple paths.

**Alternatives considered**:
1. **Inject aliases into the Fuse.js index** (add all alias group terms to each component's aliases array): Rejected — inflates the index with terms unrelated to specific components. A component named "Dialog" should not have "combobox" in its index just because dialogs and comboboxes are both in the alias database.
2. **Fuse.js extended search** with `|` operator: Rejected — Fuse.js extended search uses a different syntax that changes the fuzzy matching behavior. Would require restructuring the entire search query format.
3. **Replace Fuse.js with a custom search**: Rejected — Fuse.js is already working well for fuzzy matching. No reason to rebuild.

## R3: Pagination Strategy

**Decision**: Client-side pagination. The full result set is computed by Fuse.js and stored in state. Pagination slices the result array using `currentPage * pageSize` offsets. The Reshaped `Pagination` component handles page navigation UI.

**Rationale**:
- With ~15 components (growing to maybe ~100), the full result set easily fits in memory.
- Client-side slicing is instantaneous — no re-search needed on page change.
- Reshaped provides a ready-made `Pagination` component with truncation, aria labels, and controlled/uncontrolled modes.
- Page size of 8 cards (2 columns × 4 rows) fits the Figma plugin viewport well.

**Alternatives considered**:
1. **Virtual scrolling**: Rejected — adds complexity (would need a virtual list library) and is unnecessary for < 100 items. Also, the Figma plugin viewport is small enough that pagination is more intuitive.
2. **Infinite scroll**: Rejected — harder to implement well, easy to create performance issues, and does not align with the Browse view reference design (which shows pagination).

## R4: Design System Filter Implementation

**Decision**: Use Reshaped `ToggleButtonGroup` for filter chips. One toggle button per loaded design system, plus an "All" toggle. Store the active filter in Zustand's `activeFilters` (already exists in the store). Filtering is applied before search — the `useFilteredComponents` selector already handles this.

**Rationale**:
- `ToggleButtonGroup` provides the chip-like toggle behavior shown in the reference design.
- The existing store already has `activeFilters: string[]` and the `setActiveFilters` action.
- The existing `useFilteredComponents` selector already filters by `activeFilters` — minimal new code needed.

**Alternatives considered**:
1. **Reshaped Tabs**: Rejected — Tabs imply content panels switching, which is not the filter chip pattern. The filter chips are additive filters, not page navigation.
2. **Custom chip components**: Rejected — violates Constitution Principle II (Prototype-Fast). Reshaped's ToggleButtonGroup provides the behavior natively.

## R5: Loading Skeleton Approach

**Decision**: Use Reshaped `Skeleton` components composed into a card grid layout that mimics the result cards. Show the skeleton when `isLoading === true` in the store (already set by `setCatalogData`).

**Rationale**:
- Reshaped's Skeleton supports width, height, and borderRadius props — sufficient to mimic card placeholders.
- The store already tracks `isLoading` state, set to `true` initially and `false` when `setCatalogData` is called.
- Per Reshaped docs: "we recommend not implementing a 1:1 representation" — a simplified card shape is sufficient.

## R6: Search State in Zustand Store

**Decision**: Extend the existing Zustand store UI slice with `currentPage: number` (default 1). The `searchQuery` and `activeFilters` fields already exist. Add a `setCurrentPage` action. Add a derived selector `usePaginatedResults` that slices the full search results.

**Rationale**:
- The store already has `searchQuery` and `activeFilters` — only `currentPage` is missing.
- Keeping pagination state in the store allows any component to read the current page without prop drilling.
- The `useSearch` hook will be modified to read `searchQuery` from the store instead of maintaining local state, aligning with the 004-zustand-global-store migration plan.

**Alternatives considered**:
1. **Keep pagination in local component state**: Rejected — requires prop drilling between ResultsList and a pagination control. The store approach is cleaner.
2. **Store full search results in Zustand**: Rejected — Fuse.js results contain references and scores that update frequently. Keeping them as derived data (via selectors/hooks) avoids unnecessary store updates.

## R7: Reshaped Component Mapping

| UI Element | Reshaped Component | Notes |
|-----------|-------------------|-------|
| Search input | `TextField` | Already in use. Add `startSlot` for search icon. |
| Filter chips | `ToggleButtonGroup` + `ToggleButton` | One per design system + "All" |
| Result cards | `Card` + `View` + `Text` | Replace custom div structure |
| Loading skeleton | `Skeleton` + `View` + `Card` | Composed grid of skeleton cards |
| Pagination | `Pagination` | Controlled mode with `page` + `onChange` |
| Result count | `Text` | "N results" next to COMPONENTS heading |
| Empty states | `View` + `Text` | Centered layout with message |
| Section heading | `Text` | "COMPONENTS" heading with count |
