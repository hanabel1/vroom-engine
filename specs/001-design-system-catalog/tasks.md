# Tasks: Design System Catalog Figma Plugin

**Input**: Design documents from `/specs/001-design-system-catalog/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec. Test tasks are omitted.

**Organization**: Tasks grouped by user story. US1 (search + display) is the MVP and main priority.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, build tooling, and Figma plugin scaffold

- [X] T001 Initialize project with package.json — add dependencies: react, react-dom, fuse.js, and dev dependencies: typescript, vite, vite-plugin-singlefile, @figma/plugin-typings, @types/react, @types/react-dom in package.json
- [X] T002 Configure TypeScript strict mode in tsconfig.json with paths for src/plugin, src/ui, src/shared
- [X] T003 [P] Create Vite config for UI iframe build (React + singlefile inlining) in vite.config.ts
- [X] T004 [P] Create Vite config for plugin main thread build (IIFE, no DOM) in vite.config.plugin.ts
- [X] T005 [P] Create Figma plugin manifest with plugin name, entry points (dist/plugin.js, dist/ui.html), editorType figma, networkAccess none in manifest.json
- [X] T006 Add npm scripts to package.json: dev (watch both builds), build (production both builds), validate-catalog

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, message bridge, and catalog data loading — needed by ALL user stories

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Define TypeScript types for catalog data model (DesignSystem, Component, ComponentProp, PropValue, ComponentVariant, Category enum) in src/ui/types/catalog.ts
- [X] T008 [P] Define TypeScript types for message protocol (PluginMessage union type with PLUGIN_READY, CATALOG_DATA, PLACE_COMPONENT, PLACEMENT_STARTED, PLACEMENT_COMPLETE, PLACEMENT_ERROR) in src/ui/types/messages.ts
- [X] T009 [P] Define shared message envelope type (PluginMessage base interface) in src/shared/types.ts
- [X] T010 Implement usePluginMessage hook — wraps window.onmessage listener and parent.postMessage sender with typed message handlers in src/ui/hooks/usePluginMessage.ts
- [X] T011 Create plugin main thread entry — figma.showUI, listen for PLUGIN_READY, load catalog JSON files from bundled data, send CATALOG_DATA response in src/plugin/main.ts
- [X] T012 Create seed catalog data for MUI with at least 5 components (Button, TextField, Card, Chip, Alert) with pre-inlined HTML, props, aliases, and preview placeholder images in src/catalog/mui-v5.json
- [X] T013 [P] Create seed catalog data for Spectrum with at least 5 components (Button, TextField, Card, Badge, Dialog) in src/catalog/spectrum.json
- [X] T014 [P] Create seed catalog data for Tailwind UI with at least 5 components (Button, Input, Card, Badge, Alert) in src/catalog/tailwind-ui.json
- [X] T015 Create UI HTML entry point that loads the React app in src/ui/index.html
- [X] T016 Create React entry point (ReactDOM.createRoot, render App) in src/ui/main.tsx

**Checkpoint**: Plugin loads in Figma, UI iframe renders, catalog data flows from plugin to UI via postMessage

---

## Phase 3: User Story 1 — Search for a Component Across Design Systems (Priority: P1) MVP

**Goal**: Designer opens plugin, types a query, sees fuzzy-matched results from multiple design systems with visual previews. This is the core feature and main project priority.

**Independent Test**: Open plugin in Figma, type "button" — see MUI Button, Spectrum Button, Tailwind Button with previews. Type "buttn" — still see results. Type "disabled" — see components with that prop. Type nonsense — see "No results found".

### Implementation for User Story 1

- [X] T017 [US1] Implement useSearch hook — initialize Fuse.js index from catalog data with weighted keys (name: 2.0, aliases: 1.5, category: 0.8, designSystem: 0.5, props.name: 0.7), threshold 0.4, includeScore, includeMatches. Expose search(query) function with debounce. Return flattened component results with their designSystem reference in src/ui/hooks/useSearch.ts
- [X] T018 [P] [US1] Implement SearchBar component — text input with 250ms debounce, clear button, placeholder text "Search components or props...", calls onSearch callback. Show result count badge in src/ui/components/SearchBar.tsx
- [X] T019 [P] [US1] Implement ResultCard component — displays component preview image, component name, design system name badge, category label. Accepts onClick handler for detail navigation and onPlace handler for direct placement in src/ui/components/ResultCard.tsx
- [X] T020 [US1] Implement ResultsList component — renders grid of ResultCard components from search results. Groups or labels results by design system. Shows "No results found" with similar term suggestions when empty. Shows popular/featured components when query is empty in src/ui/components/ResultsList.tsx
- [X] T021 [US1] Implement App root component — layout with SearchBar at top, ResultsList below. Wire useSearch hook to SearchBar onChange, pass results to ResultsList. On CATALOG_DATA message, flatten all components and pass to useSearch for indexing. Handle loading state while catalog loads in src/ui/App.tsx
- [X] T022 [US1] Add basic CSS styling for plugin UI — search bar, result cards grid, design system badges, preview images, empty state, loading state. Keep minimal and designer-friendly (no raw HTML/code visible) in src/ui/styles.css (imported by main.tsx)

**Checkpoint**: US1 complete — search works with fuzzy matching, results display with previews, prop search works, empty/no-results states handled. Plugin is a functional catalog browser.

---

## Phase 4: User Story 2 — Place a Component on the Artboard (Priority: P2)

**Goal**: Designer clicks "Place" on a search result, the plugin converts the component's pre-stored HTML into native Figma layers and inserts it onto the active artboard.

**Independent Test**: Search for "Button", click Place on MUI Button — a Figma frame appears on the artboard with correct colors, text, border-radius, and layout matching the original component. If conversion partially fails, user sees a notification about limitations.

### Implementation for User Story 2

- [X] T023 [P] [US2] Implement CSS inline style parser — parse style attribute string into key-value object, handle shorthand properties (border, padding, margin), normalize units (px, rem, em → pixels) in src/plugin/converter/styles.ts
- [X] T024 [P] [US2] Implement CSS color parser utility — convert hex (#fff, #ffffff), rgb(), rgba(), named colors to Figma {r, g, b} (0-1 range) format. Include opacity extraction from rgba in src/plugin/converter/styles.ts (color section)
- [X] T025 [US2] Implement HTML parser — use DOMParser (available in plugin sandbox) to parse HTML string, walk DOM tree recursively, classify elements as frame (div, section, button, etc.), text (span, p, h1-h6, text nodes), or skip in src/plugin/converter/parser.ts
- [X] T026 [US2] Implement element-to-Figma-node mapper — map div/section/button → createFrame with Auto Layout (flex-direction → layoutMode, justify-content → primaryAxisAlignMode, align-items → counterAxisAlignMode, gap → itemSpacing, padding → padding*). Map text elements → createText with loadFontAsync (fallback to Inter). Apply fills, strokes, cornerRadius, effects, opacity, resize from parsed styles in src/plugin/converter/mapper.ts
- [X] T027 [US2] Implement htmlToFigma public entry point — accept HTML string, call parser then mapper recursively, wrap result in a named ComponentNode. Return the created node. Include try-catch with warnings array for partial failures in src/plugin/converter/index.ts
- [X] T028 [US2] Wire PLACE_COMPONENT message handler in plugin main thread — on PLACE_COMPONENT message: send PLACEMENT_STARTED, call htmlToFigma with the HTML payload, append result to current page or selected frame, select and scroll into view, send PLACEMENT_COMPLETE with warnings. On error: send PLACEMENT_ERROR. Update src/plugin/main.ts
- [X] T029 [US2] Add "Place" button to ResultCard component — sends PLACE_COMPONENT message via usePluginMessage with component HTML. Show loading spinner during placement. Show success toast or warning notification on PLACEMENT_COMPLETE/PLACEMENT_ERROR. Update src/ui/components/ResultCard.tsx
- [X] T030 [US2] Handle no-artboard-selected edge case — when no frame is selected, create a new frame at canvas origin (0,0) and place component inside it. Add to src/plugin/converter/index.ts

**Checkpoint**: US2 complete — components can be placed from search results as editable Figma layers. Visual fidelity is "recognizable" for common components (buttons, cards, inputs). Conversion warnings shown to user.

---

## Phase 5: User Story 3 — Browse Component Props and Variants (Priority: P3)

**Goal**: Designer clicks a search result to see a detail view with available props, variant previews, and can select a specific variant configuration before placing.

**Independent Test**: Click on MUI Button in search results — detail view opens showing variant (contained/outlined/text), size (small/medium/large), disabled (true/false) props with previews. Select "outlined" + "large", click Place — the placed component uses the outlined large HTML variant.

### Implementation for User Story 3

- [ ] T031 [US3] Implement DetailView component — show component name, description, design system badge, large preview image. List all props with their type, description, and default value. For enum props, show selectable options with preview images per value. Include "Back to results" navigation and "Place" button in src/ui/components/DetailView.tsx
- [ ] T032 [US3] Add variant selection state to DetailView — maintain selected prop values in component state. When user selects prop values, find matching variant from component.variants array. Update preview image to match selected variant. If no exact variant match, show default preview in src/ui/components/DetailView.tsx
- [ ] T033 [US3] Wire detail view navigation in App.tsx — add selectedComponent state. When ResultCard is clicked (not Place button), set selectedComponent and render DetailView instead of ResultsList. DetailView "Back" button clears selection. DetailView "Place" sends PLACE_COMPONENT with variant-specific HTML (if variant has html override) or default component HTML. Update src/ui/App.tsx
- [ ] T034 [US3] Add variant-aware placement — when DetailView sends PLACE_COMPONENT, include variantName in payload. If the selected variant has its own html field, use that; otherwise use the component's default html. Name the placed Figma node as "{DesignSystem} / {Component} / {Variant}". Update src/ui/components/DetailView.tsx and src/plugin/main.ts

**Checkpoint**: US3 complete — users can browse props and variants with previews, select a configuration, and place variant-specific components.

---

## Phase 6: User Story 4 — Manual Catalog Contribution via Documentation (Priority: P4)

**Goal**: Technical contributors can add a new design system by following written documentation and adding a JSON data file. No in-plugin UI needed.

**Independent Test**: A contributor reads the guide, creates a new JSON file for a 4th design system (e.g., Chakra UI), adds it to the catalog directory, rebuilds, and sees the new components in search results.

### Implementation for User Story 4

- [ ] T035 [P] [US4] Copy catalog-schema.json from specs/001-design-system-catalog/contracts/ to project root as catalog-schema.json for runtime validation reference
- [ ] T036 [US4] Implement catalog validation script — load all JSON files in src/catalog/*.json, validate against catalog-schema.json (check required fields, id patterns, category enums, enum props have values, unique component ids). Report errors with file name, component id, and specific field. Wire to npm run validate-catalog in tools/validate-catalog.ts
- [ ] T037 [US4] Write catalog contribution guide as a section in the project README or a standalone CONTRIBUTING-CATALOG.md — document: JSON schema overview, required/optional fields per entity, file naming convention ({slug}.json), preview image requirements (PNG, recommended size), step-by-step instructions to add a new design system, how to validate, how to rebuild

**Checkpoint**: US4 complete — a contributor can follow the guide to add a design system. Validation catches errors before build.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T038 Add empty catalog handling — if no JSON files found in catalog directory, show friendly message in UI: "No design systems loaded. See documentation to add catalog data." in src/ui/App.tsx
- [X] T039 [P] Add keyboard navigation — arrow keys to navigate search results, Enter to open detail or place, Escape to close detail view, focus management for accessibility in src/ui/App.tsx
- [X] T040 Verify bundle size is under 5MB uncompressed — run build and check dist/ output sizes. If over limit, identify and resolve (tree-shake, remove unused catalog data, optimize preview images)
- [ ] T041 Run quickstart.md validation — follow all steps in specs/001-design-system-catalog/quickstart.md end-to-end and verify they work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 Search (Phase 3)**: Depends on Phase 2 — **MVP target, do this first**
- **US2 Placement (Phase 4)**: Depends on Phase 2. Can run in parallel with US1 (different files) but recommended after US1 since search is main priority
- **US3 Props/Variants (Phase 5)**: Depends on Phase 2. Benefits from US1 (needs search results to navigate from) and US2 (needs placement for "Place variant" flow)
- **US4 Documentation (Phase 6)**: Depends on Phase 2 (needs catalog schema finalized). Can run in parallel with any US
- **Polish (Phase 7)**: Depends on US1 at minimum; ideally after all stories

### User Story Dependencies

- **US1 (Search)**: Independent after Phase 2. **Start here — main priority.**
- **US2 (Placement)**: Independent after Phase 2. The converter (src/plugin/converter/) is entirely separate from search UI.
- **US3 (Props/Variants)**: Enhances US1 (adds detail view navigation) and US2 (adds variant-aware placement). Best done after both.
- **US4 (Documentation)**: Fully independent. Can be done anytime after Phase 2.

### Within Each User Story

- Types/hooks before components
- Data layer before UI
- Core feature before edge cases
- Parent components before child integrations

### Parallel Opportunities

**Phase 1** (all [P] tasks):
- T003, T004, T005 can run in parallel (separate config files)

**Phase 2** (after T007):
- T008, T009 can run in parallel (separate type files)
- T012, T013, T014 can run in parallel (separate catalog JSON files)

**Phase 3 (US1)**:
- T018, T019 can run in parallel (separate component files)

**Phase 4 (US2)**:
- T023, T024 can run in parallel with T025 (styles vs parser — separate files)

**Cross-story parallelism** (with multiple developers):
- After Phase 2: Developer A → US1, Developer B → US2 converter (src/plugin/converter/*)

---

## Parallel Example: User Story 1

```bash
# After T017 (useSearch hook) is complete, launch UI components in parallel:
Task: "T018 [P] [US1] Implement SearchBar in src/ui/components/SearchBar.tsx"
Task: "T019 [P] [US1] Implement ResultCard in src/ui/components/ResultCard.tsx"

# Then sequentially:
Task: "T020 [US1] Implement ResultsList in src/ui/components/ResultsList.tsx"
Task: "T021 [US1] Implement App in src/ui/App.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch converter modules in parallel:
Task: "T023 [P] [US2] Implement CSS parser in src/plugin/converter/styles.ts"
Task: "T025 [US2] Implement HTML parser in src/plugin/converter/parser.ts"

# Then sequentially (depends on both):
Task: "T026 [US2] Implement mapper in src/plugin/converter/mapper.ts"
Task: "T027 [US2] Implement htmlToFigma entry in src/plugin/converter/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (types, message bridge, seed catalog data)
3. Complete Phase 3: User Story 1 (search + display)
4. **STOP and VALIDATE**: Open plugin in Figma, search works, results display with previews
5. Demo to stakeholders — plugin is a functional cross-design-system component browser

### Incremental Delivery

1. Setup + Foundational → Plugin scaffold loads in Figma
2. Add US1 (Search) → Functional catalog browser (MVP!)
3. Add US2 (Placement) → Components can be placed as Figma layers
4. Add US3 (Props/Variants) → Full variant browsing and selection
5. Add US4 (Documentation) → Contributors can extend the catalog
6. Polish → Keyboard nav, bundle optimization, validation

### Parallel Team Strategy

With 2 developers after Phase 2:
- **Developer A**: US1 (search UI) → US3 (detail view, builds on search)
- **Developer B**: US2 (converter engine, entirely separate codebase) → US4 (docs + validation)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The converter (US2) and search UI (US1) are in completely separate directories and can be developed in parallel
- Catalog seed data (T012-T014) uses placeholder preview images initially — real screenshots can be added later via the tools/ pipeline
