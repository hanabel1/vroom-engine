# Tasks: Catalog Search

**Input**: Design documents from `/specs/003-catalog-search/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create new directories and data files needed by multiple user stories

- [x] T001 Create the services directory at src/ui/services/
- [x] T002 [P] Create the alias database at src/catalog/aliases.json with ~15 alias groups covering common UI pattern synonyms (combobox/autocomplete/typeahead, dialog/modal/popup, chip/tag/pill, notification/alert/banner, toggle/switch, dropdown/select/picker, textfield/input/text-input, card/panel/container, tabs/tab-bar, breadcrumbs/breadcrumb, tooltip/hint, avatar/profile-image, progress/progress-bar, accordion/collapsible, stepper/wizard). Use the format from research.md R1: array of string arrays.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core services and store extensions that MUST be complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Implement the alias resolver service at src/ui/services/aliasResolver.ts. Export `createAliasResolver(aliasGroups: string[][]): AliasResolver` factory function per contracts/search-api.md. The resolver builds a `Map<string, string[]>` keyed by lowercase term pointing to the full group. `expand(term)` returns all synonyms or `[term]` if not found. `expandQuery(query)` splits the query into words, expands each, and returns the deduplicated union. Case-insensitive matching.
- [x] T004 [P] Extend the Zustand store at src/ui/store.ts per contracts/store-extensions.md: add `currentPage: number` (default 1) field, add `setCurrentPage(page: number)` action, modify `setSearchQuery` to also set `currentPage = 1`, modify `setActiveFilters` to also set `currentPage = 1`. Update the `AppStore` interface accordingly.
- [x] T005 [P] Add `useDesignSystemOptions()` selector to src/ui/selectors.ts per contracts/store-extensions.md. Returns `{ id: string; name: string }[]` for each loaded design system. Memoized — recomputes only when `designSystems` changes.

**Checkpoint**: Foundation ready — alias resolver, store extensions, and selectors are in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Search Components by Name (Priority: P1) 🎯 MVP

**Goal**: User types a component name into the search field and sees matching results in a card grid with a result count. Fuzzy matching via Fuse.js. Debounced input. Clear action resets to browse-all.

**Independent Test**: Type "Button" → see 3 matching result cards from different design systems. Type "Btn" → fuzzy match still returns Button components. Clear search → all components shown. Result count next to COMPONENTS heading shows correct total.

### Implementation for User Story 1

- [x] T006 [US1] Refactor useSearch hook at src/ui/hooks/useSearch.ts to read `searchQuery` from the Zustand store instead of receiving `catalogData` as a prop. Use `useFilteredComponents()` selector for the searchable component list. Remove local `query` state — the store's `searchQuery` is the source of truth. Keep the Fuse.js index creation and search execution. Return `{ query, results, totalResults }` per contracts/search-api.md (pagination fields will be added in US3).
- [x] T007 [US1] Refactor SearchBar at src/ui/components/SearchBar.tsx per contracts/search-api.md. Remove `onSearch` and `resultCount` props. Keep local `value` state for immediate input feedback. Debounce (250ms) before calling `useAppStore.getState().setSearchQuery(value)`. Clear button resets local value and calls `setSearchQuery("")`. Use Reshaped `TextField` with a search icon in `startSlot`. Keep the placeholder as "Search components...".
- [x] T008 [P] [US1] Refactor ResultCard at src/ui/components/ResultCard.tsx to use Reshaped `Card`, `View`, and `Text` components. Display component preview placeholder (first letter), name, design system badge, and category. Keep `onClick` and `onPlace` callback props.
- [x] T009 [US1] Refactor ResultsList at src/ui/components/ResultsList.tsx per contracts/search-api.md. Remove all props — read from `useSearch()` hook and store internally. Add a section header row: Reshaped `Text` with "COMPONENTS" heading and "N results" count (FR-007, US6). Render result cards in a 2-column CSS grid. Delegate to EmptyState component stubs for empty/no-results (to be fully implemented in US5; use inline placeholders for now).
- [x] T010 [US1] Update App.tsx at src/ui/App.tsx to remove prop-drilling for search. Remove `useSearch(catalogData)` call and the `query`/`results`/`totalResults` destructuring. Remove `onSearch` prop from SearchBar. Remove `results`/`query` props from ResultsList. The SearchBar and ResultsList now read from the store internally. Keep keyboard shortcuts (Cmd+F focus, Escape clear) but update Escape handler to call `useAppStore.getState().setSearchQuery('')`.

**Checkpoint**: Typing a query shows fuzzy-matched components in a card grid with "N results" count. Clearing resets to browse-all. This is the MVP — independently functional and testable.

---

## Phase 4: User Story 2 — Alias-Based Search with Bidirectional Lookup (Priority: P1)

**Goal**: When a user searches for any term in an alias group, results include components matching all synonyms in that group. Bidirectional — any term in the group works as the search input.

**Independent Test**: Search "autocomplete" → results include components named "combobox", "typeahead", etc. from all design systems. Search "modal" → results include "Dialog" components. No duplicate results when a component matches via both name and alias.

**Depends on**: US1 (refactored useSearch hook)

### Implementation for User Story 2

- [x] T011 [US2] Integrate alias expansion into useSearch hook at src/ui/hooks/useSearch.ts. Import `createAliasResolver` from src/ui/services/aliasResolver.ts and the aliases.json data. Create the resolver instance once (memoized). When searchQuery is non-empty: (1) call `aliasResolver.expandQuery(query)` to get expanded terms, (2) run `fuse.search(query)` for the original query, (3) for each additional expanded term not already the original query, run `fuse.search(term)`, (4) merge all results and deduplicate by `designSystemId + componentId` keeping the best (lowest) Fuse.js score, (5) mark `matchedViaAlias = true` where applicable per contracts/search-api.md deduplication rule.

**Checkpoint**: Alias-expanded search works bidirectionally. Searching any synonym in a group returns all matching components, deduplicated. Inline catalog aliases (e.g., "btn" → Button) continue to work as before.

---

## Phase 5: User Story 3 — Results Pagination (Priority: P2)

**Goal**: When results exceed PAGE_SIZE (8), pagination controls appear. Users can navigate between pages. Page resets to 1 on query/filter change.

**Independent Test**: Browse all components (15 total) → see page 1 with 8 cards and pagination showing 2 pages. Click page 2 → see remaining 7 cards. Type a new query → pagination resets to page 1.

**Depends on**: US1 (search results to paginate)

### Implementation for User Story 3

- [x] T012 [US3] Add pagination logic to useSearch hook at src/ui/hooks/useSearch.ts. Read `currentPage` from store. Compute `totalPages = Math.ceil(results.length / PAGE_SIZE)`. Clamp `currentPage` to `[1, totalPages]`. Compute `paginatedResults = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)`. Add `paginatedResults`, `totalPages`, and `currentPage` to the returned object. Define `PAGE_SIZE = 8` as a constant.
- [x] T013 [US3] Add Reshaped `Pagination` component to ResultsList at src/ui/components/ResultsList.tsx. Import `Pagination` from Reshaped. Render below the results grid when `totalPages > 1`. Use controlled mode with `page={currentPage}` and `onChange={(args) => useAppStore.getState().setCurrentPage(args.page)}`. Add required aria-labels: `previousAriaLabel="Previous page"`, `nextAriaLabel="Next page"`. Switch from rendering `results` to `paginatedResults` from `useSearch()`.

**Checkpoint**: Pagination appears when results exceed 8 items. Page navigation works. Query/filter changes reset to page 1.

---

## Phase 6: User Story 4 — Design System Filter Chips (Priority: P2)

**Goal**: Filter chips ("All", "MUI", "Tailwind", "Adobe Spectrum") below the search bar narrow results to a single design system. "All" is default.

**Independent Test**: Click "MUI" → only Material UI components shown, result count updates. Click "All" → all components shown again. Active filter + search query combine correctly.

**Depends on**: Phase 2 (store, selectors). Works independently of US1 for browse-all mode; integrates with US1 for search+filter.

### Implementation for User Story 4

- [x] T014 [US4] Create FilterChips component at src/ui/components/FilterChips.tsx per contracts/search-api.md. Import `ToggleButtonGroup` and `ToggleButton` from Reshaped. Read design systems via `useDesignSystemOptions()` selector. Read `activeFilters` from store. Render an "All" chip (selected when `activeFilters` is empty) plus one chip per design system. On chip click: set `activeFilters` to `[systemId]` for a system chip or `[]` for "All". The store's `setActiveFilters` already resets `currentPage` to 1 (T004).
- [x] T015 [US4] Integrate FilterChips into the Browse view at src/ui/App.tsx. Place `<FilterChips />` between `<SearchBar />` and `<ResultsList />` in the JSX layout.

**Checkpoint**: Filter chips render dynamically from loaded design systems. Clicking a chip filters results. Clicking "All" shows all. Filter + search query work together.

---

## Phase 7: User Story 5 — Empty and Loading States (Priority: P2)

**Goal**: Three visual states: (1) loading skeleton while catalog loads, (2) "Browse components" when search is empty, (3) "No results for X" when search returns nothing.

**Independent Test**: Observe loading skeleton on plugin open (before CATALOG_DATA message). Clear search → "Browse components" message. Type nonsense → "No results for [query]" message.

**Depends on**: Phase 2 (store's isLoading state)

### Implementation for User Story 5

- [x] T016 [P] [US5] Create EmptyState component at src/ui/components/EmptyState.tsx per contracts/search-api.md. Accept `variant: 'browse' | 'no-results'` and optional `query?: string` props. For `browse`: render "Browse components" heading + "Search for components across design systems" subtext using Reshaped `View` and `Text`. For `no-results`: render "No results for [query]" heading + "Try a different search term" subtext. Center content vertically in a Reshaped `View`.
- [x] T017 [P] [US5] Create LoadingSkeleton component at src/ui/components/LoadingSkeleton.tsx per contracts/search-api.md. Import `Skeleton`, `View`, `Card` from Reshaped. Render: a full-width Skeleton mimicking the search bar, a row of 3–4 short Skeletons mimicking filter chips, and a 2×4 grid of Skeleton cards (each card: rectangle Skeleton for preview + two Skeleton text lines).
- [x] T018 [US5] Integrate empty and loading states into the Browse view. In src/ui/App.tsx: replace the current `isLoading` check with `<LoadingSkeleton />`. In src/ui/components/ResultsList.tsx: replace inline empty-state JSX with `<EmptyState variant="browse" />` when query is empty and results show all components, and `<EmptyState variant="no-results" query={query} />` when query is non-empty and results are empty. Remove the existing emoji-based empty states.

**Checkpoint**: Loading skeleton appears on startup. "Browse components" prompt shows on empty query. "No results for X" shows on zero-match search.

---

## Phase 8: User Story 6 — Result Count Display (Priority: P3)

**Goal**: "N results" count next to the COMPONENTS heading updates in real time as the user types or changes filters.

**Independent Test**: Search "button" → "3 results" shows next to COMPONENTS. Change filter → count updates. Clear search → count shows total catalog size.

**Depends on**: US1 (count is rendered as part of ResultsList header already in T009). This phase is verification and polish.

### Implementation for User Story 6

- [x] T019 [US6] Verify and polish result count display in src/ui/components/ResultsList.tsx. Ensure the "COMPONENTS" section header correctly shows `totalResults` from `useSearch()` in the format "N results" (singular "1 result" when N=1). Ensure the count updates when: (a) the user types a query, (b) the user changes a filter chip, (c) the user clears the search. If already implemented correctly in T009, mark as verified.

**Checkpoint**: Result count is accurate across all interaction paths — search, filter, clear.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T020 [P] Verify keyboard shortcuts still work in src/ui/App.tsx: Cmd/Ctrl+F focuses search, Escape clears search and resets to browse state. Update handlers if needed after store migration.
- [x] T021 [P] Review and clean up unused imports and dead code across all modified files: src/ui/App.tsx, src/ui/hooks/useSearch.ts, src/ui/components/SearchBar.tsx, src/ui/components/ResultsList.tsx, src/ui/components/ResultCard.tsx
- [x] T022 Run `npm test && npm run lint` and fix any TypeScript or ESLint errors introduced by the changes
- [x] T023 Manual smoke test: open the plugin in Figma, verify the full Browse view flow — loading skeleton → browse state → search → alias search → filter → pagination → clear → empty states

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (needs services directory and aliases.json) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — the MVP
- **US2 (Phase 4)**: Depends on US1 (needs refactored useSearch hook to integrate alias expansion)
- **US3 (Phase 5)**: Depends on US1 (needs search results to paginate)
- **US4 (Phase 6)**: Depends on Phase 2 (store + selectors). Works independently for browse-all; integrates naturally with US1 for search+filter
- **US5 (Phase 7)**: Depends on Phase 2 (store's isLoading). Fully independent of other user stories
- **US6 (Phase 8)**: Depends on US1 (count is part of ResultsList header). Verification phase
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

```text
Phase 1 (Setup)
  │
  ▼
Phase 2 (Foundational)
  │
  ├──────────────────────────────────┐
  ▼                                  ▼
Phase 3: US1 (P1) 🎯 MVP     Phase 6: US4 (P2) — filter chips
  │                            Phase 7: US5 (P2) — empty/loading
  ├──────────────┐
  ▼              ▼
Phase 4: US2   Phase 5: US3
  (P1)           (P2)
  │              │
  ▼              ▼
Phase 8: US6 (P3) — verification
  │
  ▼
Phase 9: Polish
```

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel
- **Phase 2**: T003, T004, T005 can ALL run in parallel (different files)
- **Phase 3 (US1)**: T008 can run in parallel with T006/T007 (different file)
- **After US1 completes**: US2, US3, US4, US5 can proceed in parallel (but US2 and US3 both modify useSearch.ts — sequence them if single developer)
- **Phase 7 (US5)**: T016 and T017 can run in parallel (different files)

---

## Parallel Example: Phase 2 (Foundational)

```text
# All three foundational tasks target different files — run in parallel:
Task T003: src/ui/services/aliasResolver.ts
Task T004: src/ui/store.ts
Task T005: src/ui/selectors.ts
```

## Parallel Example: After US1 Completes

```text
# US4 and US5 are independent of each other and of US2/US3:
Developer/Thread A: Phase 4 (US2) → Phase 5 (US3)  [both touch useSearch.ts]
Developer/Thread B: Phase 6 (US4) + Phase 7 (US5)   [independent files]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T005)
3. Complete Phase 3: US1 (T006–T010)
4. **STOP and VALIDATE**: Type "Button" → results appear with count. Clear → browse all. Fuzzy "Btn" works.
5. This is a shippable MVP — basic search works end to end.

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → MVP! Basic fuzzy search works ✅
3. US2 → Alias expansion added (search "autocomplete" finds "combobox") ✅
4. US3 → Pagination added (navigate large result sets) ✅
5. US4 → Filter chips added (narrow by design system) ✅
6. US5 → Empty/loading states polished ✅
7. US6 → Result count verified ✅
8. Polish → Keyboard shortcuts, cleanup, smoke test ✅

### Single Developer Recommended Order

1. Phase 1 → Phase 2 → Phase 3 (US1 MVP)
2. Phase 4 (US2 — alias search, same useSearch.ts file)
3. Phase 5 (US3 — pagination, same useSearch.ts file)
4. Phase 6 (US4 — filter chips, new file)
5. Phase 7 (US5 — empty/loading, new files)
6. Phase 8 (US6 — verify count)
7. Phase 9 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- PAGE_SIZE = 8 (from data-model.md constants)
- DEBOUNCE_MS = 250 (existing convention)
- All UI components use Reshaped library (research.md R7)
- No new runtime dependencies — Fuse.js, Zustand, Reshaped are all existing
- Commit after each phase completion
- Stop at any checkpoint to validate the story independently
