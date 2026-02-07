# Tasks: Zustand Global Store

**Input**: Design documents from `/specs/004-zustand-global-store/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/store-api.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install Zustand dependency and verify project builds

- [ ] T001 Install zustand via `npm add zustand` and verify it appears in dependencies in `package.json`
- [ ] T002 Verify project still builds cleanly after dependency addition via `npm run build`

---

## Phase 2: Foundational — Store & Selectors

**Purpose**: Create the global store and derived selectors. MUST be complete before any user story migration can begin.

**CRITICAL**: No migration work can begin until this phase is complete.

- [ ] T003 Create `src/ui/store.ts` with the `AppStore` interface and `useAppStore` hook via `create<AppStore>()()`. Implement all three slices inline — **Catalog slice**: `designSystems`, `enabledSystemIds` (Set\<string\>), `isLoading`, `setCatalogData` (enables all systems by default), `toggleSystem` (creates new Set reference). **UI slice**: `view` (default `'browse'`), `activeComponent`, `searchQuery`, `activeFilters`, `setView`, `setActiveComponent`, `setSearchQuery`, `setActiveFilters`, `openDetail` (atomic: sets view + activeComponent), `goBack` (atomic: resets to browse + clears activeComponent). **Placement slice**: `placementStatus` (default `'idle'`), `placementError`, `placementWarnings`, `startPlacement`, `completePlacement`, `failPlacement`, `resetPlacement`. Export `useAppStore`. Import types from `@/ui/types/catalog`.
- [ ] T004 Create `src/ui/selectors.ts` with three derived selector hooks. **`useEnabledSystems()`**: filters `designSystems` by `enabledSystemIds` using `useShallow` from `zustand/react/shallow`. **`useActiveComponent()`**: looks up the full `Component` object from `designSystems` using `activeComponent.id` and `activeComponent.designSystemId`, returns `null` if not found. **`useFilteredComponents()`**: flattens enabled systems' components into `SearchableComponent[]` (with `designSystemId` and `designSystemName`), applies `activeFilters` if non-empty, uses `useShallow`. Import `SearchableComponent` type from `@/ui/hooks/useSearch` (re-export from selectors if needed).
- [ ] T005 [P] Create `tests/unit/store.test.ts` with unit tests for all store actions. Test outside React using `useAppStore.getState()` and `useAppStore.setState()`. Include: `setCatalogData` populates systems and enables all, `toggleSystem` adds/removes from enabledSystemIds (verify new Set reference), `openDetail` sets view and activeComponent atomically, `goBack` resets to browse and clears activeComponent, `startPlacement` transitions to placing and clears previous errors, `completePlacement` records warnings, `failPlacement` records error, `resetPlacement` returns to idle. Reset store in `beforeEach`.
- [ ] T006 [P] Create `tests/unit/selectors.test.ts` with unit tests for derived selectors. Use `renderHook` from `@testing-library/react` (or test by setting store state and calling selector logic directly). Test: `useEnabledSystems` returns only enabled systems, `useActiveComponent` returns correct Component or null, `useFilteredComponents` flattens and filters correctly, empty `activeFilters` returns all enabled components.

**Checkpoint**: Store and selectors are created and tested. Migration can now begin.

---

## Phase 3: User Story 1 — Centralized State for Catalog Data (Priority: P1) MVP

**Goal**: Plugin loads catalog data into the global store. App.tsx reads `designSystems` and `isLoading` from the store instead of local `useState`.

**Independent Test**: Load the plugin, verify catalog data appears through the store, and confirm the UI renders identically to before.

### Implementation for User Story 1

- [ ] T007 [US1] In `src/ui/App.tsx`, import `useAppStore` from `@/ui/store`. Replace the `handleMessage` callback's `CATALOG_DATA` branch: instead of calling local `setCatalogData(message.payload.designSystems)` and `setIsLoading(false)`, call `useAppStore.getState().setCatalogData(message.payload.designSystems)`. Remove the `useCallback` dependency on local state setters.
- [ ] T008 [US1] In `src/ui/App.tsx`, replace `const [catalogData, setCatalogData] = useState<DesignSystem[]>([])` and `const [isLoading, setIsLoading] = useState(true)` with reads from the store: `const catalogData = useAppStore((s) => s.designSystems)`, `const isLoading = useAppStore((s) => s.isLoading)`. Remove the `useState` imports if no longer needed. Verify the loading state, empty catalog, and populated catalog render paths all still work.
- [ ] T009 [US1] In `src/ui/App.tsx`, update the header stats display. Currently reads `catalogData.length` — this now comes from store. Verify the `{catalogData.length} design systems` display still works. Run `npx tsc --noEmit` to confirm no type errors.

**Checkpoint**: Catalog data flows through the store. Plugin loads identically. `useState` for catalog/loading removed.

---

## Phase 4: User Story 2 — View Routing and Component Navigation (Priority: P1)

**Goal**: View state (`'browse' | 'detail' | 'manage'`) and active component tracked in the global store. Any component can trigger navigation via store actions.

**Independent Test**: Click a component to open detail view, click Back to return to browse, verify store state changes correctly and UI renders the matching view.

### Implementation for User Story 2

- [ ] T010 [US2] In `src/ui/App.tsx`, read the current view from the store: `const view = useAppStore((s) => s.view)`. Add a view router that renders different content based on `view`: `'browse'` renders the existing search + results layout, `'detail'` renders a placeholder detail view (to be built later), `'manage'` renders a placeholder manage view. Replace any existing conditional rendering logic that was based on local state.
- [ ] T011 [US2] In `src/ui/App.tsx`, wire the `openDetail` action. Replace or augment the existing `onComponentClick` handler in `ResultsList` to call `useAppStore.getState().openDetail(componentId, designSystemId)` instead of (or in addition to) any existing click handling.
- [ ] T012 [US2] In `src/ui/App.tsx`, add a Back button or wire `goBack` action. When the view is `'detail'`, render a Back button that calls `useAppStore.getState().goBack()`. Verify navigating browse → detail → back returns to browse and clears `activeComponent`.

**Checkpoint**: View routing works via the store. Navigation is triggered through store actions, not prop callbacks.

---

## Phase 5: User Story 3 — Search and Filter State in Store (Priority: P2)

**Goal**: Search query and design-system filters live in the store. `useFilteredComponents()` selector provides the component list. `useSearch` hook reads from the store.

**Independent Test**: Type a search query, verify it persists across view changes. Toggle filters, verify results narrow correctly.

### Implementation for User Story 3

- [ ] T013 [US3] Refactor `src/ui/hooks/useSearch.ts` to read from the store instead of receiving `catalogData` as a parameter. Import `useAppStore` and `useFilteredComponents` from selectors. Replace the `catalogData` parameter with `useFilteredComponents()` to get the flat component list. Replace internal `useState` for `query` with `useAppStore((s) => s.searchQuery)` for reading and `useAppStore((s) => s.setSearchQuery)` for writing. Keep the Fuse.js index creation in a `useMemo` that depends on the filtered components. Update the return type and exports as needed.
- [ ] T014 [US3] Update `src/ui/components/SearchBar.tsx` to sync debounced value to the store. The internal `value` state stays for debounce purposes, but the debounced `onSearch` callback should call `useAppStore.getState().setSearchQuery(value)` instead of relying on the `onSearch` prop. If the `onSearch` prop is still needed for backward compatibility during migration, keep it but also update the store.
- [ ] T015 [US3] Update `src/ui/components/ResultsList.tsx` to read results from the store/selectors instead of receiving them as props. Import `useFilteredComponents` from `@/ui/selectors` and `useAppStore` for `searchQuery`. Remove the `results` and `query` props. Use `useFilteredComponents()` for the base component list, and apply Fuse.js search using the store's `searchQuery`. Remove `onComponentClick` prop and call `useAppStore.getState().openDetail()` directly.
- [ ] T016 [US3] In `src/ui/App.tsx`, remove the `useSearch(catalogData)` call and any props passed to `SearchBar` and `ResultsList` that are now read from the store (e.g., `onSearch`, `results`, `query`, `resultCount`). Clean up unused imports. Verify search still works end-to-end.

**Checkpoint**: Search and filter state lives in the store. Query persists across view changes. Components read from selectors.

---

## Phase 6: User Story 4 — Placement Status Tracking (Priority: P2)

**Goal**: Placement lifecycle (idle → placing → success/error) is tracked in the store. Message handler dispatches store actions for placement events.

**Independent Test**: Trigger a component placement, verify the store transitions through idle → placing → success (or error). Verify error and warning data is recorded.

### Implementation for User Story 4

- [ ] T017 [P] [US4] In `src/ui/App.tsx`, update the `handleMessage` callback to use store placement actions. For `PLACEMENT_STARTED`: call `useAppStore.getState().startPlacement()`. For `PLACEMENT_COMPLETE`: call `useAppStore.getState().completePlacement(message.payload.nodeName, message.payload.warnings)`. For `PLACEMENT_ERROR`: call `useAppStore.getState().failPlacement(message.payload.error)`. Remove the existing `console.log`/`console.warn`/`console.error` calls for placement events.
- [ ] T018 [P] [US4] In `src/ui/App.tsx`, update `handleComponentPlace` to call `useAppStore.getState().startPlacement()` before sending the `PLACE_COMPONENT` message. This transitions the store to `'placing'` status immediately when the user clicks "Place".

**Checkpoint**: Placement lifecycle tracked in store. UI can read `placementStatus`, `placementError`, `placementWarnings` from store for future notification/toast features.

---

## Phase 7: User Story 5 — App.tsx Thin Shell Migration (Priority: P3)

**Goal**: App.tsx contains no local state for catalog, loading, view, or placement. It is a thin shell: message bridge + view router.

**Independent Test**: Verify App.tsx has zero `useState` calls for managed state. Verify all functionality works identically: catalog loading, search, component placement.

### Implementation for User Story 5

- [ ] T019 [US5] In `src/ui/App.tsx`, remove all remaining local `useState` hooks that were replaced by the store (confirm `catalogData`, `isLoading` are gone from earlier phases). Remove any remaining prop-drilling patterns — components should read from the store directly. Remove the `handleComponentPlace` callback if it was fully migrated, or simplify it to only handle `sendMessage` (the store action `startPlacement` is already called separately).
- [ ] T020 [US5] In `src/ui/App.tsx`, simplify the `handleMessage` callback. It should be a pure dispatcher: read `useAppStore.getState()` once and call the appropriate action for each message type. Remove any `useCallback` dependencies on local state. The callback should have an empty dependency array `[]` since it uses `getState()` instead of closures.
- [ ] T021 [US5] In `src/ui/App.tsx`, clean up the component structure. The return should be: (1) keyboard shortcut `useEffect`, (2) `PLUGIN_READY` `useEffect`, (3) view router that renders `<BrowseView>`, `<DetailView>`, or `<ManageView>` based on `store.view`. Move the `parseHTMLInUI` and `parseElement` helper functions out of App.tsx into a utility file (e.g., `src/ui/utils/parseHTML.ts`) if they clutter the thin shell.
- [ ] T022 [US5] Run `npx tsc --noEmit` to verify zero type errors across the entire project. Run `npm run test` to verify all existing and new tests pass. Run `npm run build` to verify the plugin still builds correctly.

**Checkpoint**: App.tsx is a thin shell. All state management flows through the store.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, cleanup, and quality checks

- [ ] T023 [P] Remove any unused imports across all modified files: `src/ui/App.tsx`, `src/ui/components/SearchBar.tsx`, `src/ui/components/ResultsList.tsx`, `src/ui/hooks/useSearch.ts`
- [ ] T024 [P] Verify `SearchableComponent` type is exported from `src/ui/selectors.ts` (or re-exported from `src/ui/hooks/useSearch.ts`) so consuming components can import it
- [ ] T025 Run full quality gate: `npx tsc --noEmit && npm run test && npm run lint && npm run build` — all must pass with zero errors
- [ ] T026 Manual smoke test: load plugin in Figma dev mode, verify catalog loads, search works, component placement works, no console errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — first migration target
- **US2 (Phase 4)**: Depends on Phase 3 (both modify App.tsx; US1 changes must land first)
- **US3 (Phase 5)**: Depends on Phase 2; can run in parallel with US4 (different files)
- **US4 (Phase 6)**: Depends on Phase 2; can run in parallel with US3 (different concerns in App.tsx)
- **US5 (Phase 7)**: Depends on US1 + US2 + US3 + US4 (final cleanup requires all migrations done)
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational — MVP candidate
- **US2 (P1)**: Depends on US1 (both modify App.tsx rendering logic)
- **US3 (P2)**: Depends on Foundational — independent of US1/US2 for store/selectors, but SearchBar/ResultsList migration benefits from US1 being done first
- **US4 (P2)**: Depends on Foundational — can truly run in parallel with US3
- **US5 (P3)**: Depends on ALL previous stories — final cleanup

### Parallel Opportunities

```text
Phase 2 (Foundational):
  T003 (store.ts) → T004 (selectors.ts)    [sequential: selectors import store]
  T005 (store tests) ─┐
  T006 (selector tests)┘ [parallel: different files, after T003+T004]

Phase 3–4 (US1 + US2):
  T007 → T008 → T009 → T010 → T011 → T012  [sequential: same file]

Phase 5–6 (US3 + US4):
  US3: T013 → T014 → T015 → T016  ─┐
  US4: T017 ─── T018               ─┘ [parallel: different files/concerns]

Phase 8 (Polish):
  T023 ─┐
  T024 ─┘ [parallel: different files]
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T006)
3. Complete Phase 3: US1 — Catalog Data (T007–T009)
4. **STOP and VALIDATE**: Plugin loads catalog through the store. Identical behavior.
5. This alone proves the store works and the migration pattern is sound.

### Incremental Delivery

1. Setup + Foundational → Store exists and is tested
2. US1 → Catalog data in store → Validate (MVP!)
3. US2 → View routing in store → Validate
4. US3 + US4 in parallel → Search + Placement in store → Validate
5. US5 → App.tsx is thin shell → Validate
6. Polish → All quality gates pass → Ready for PR

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- `Set<string>` for `enabledSystemIds` — always create new Set reference on mutation (see research.md Decision 4)
- `useShallow` from `zustand/react/shallow` for selectors returning arrays/objects (see research.md Decision 3)
- `useAppStore.getState()` for non-reactive reads in callbacks (see quickstart.md Troubleshooting)
- `create<AppStore>()(...)` with double parentheses for TypeScript (see quickstart.md Troubleshooting)
- Commit after each completed phase. Each phase is a clean, working increment.
