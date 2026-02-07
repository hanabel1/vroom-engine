# Feature Specification: Zustand Global Store

**Feature Branch**: `004-zustand-global-store`  
**Created**: 2026-02-07  
**Status**: Draft  
**Input**: User description: "Create Zustand Global store for this project. To be in `src/ui/store.ts`"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Centralized State for Catalog Data (Priority: P1)

When a user opens the Figma plugin, the plugin loads the design-system catalog and stores it in a single, centralized location. All UI components (search bar, results list, library toggles) read from this shared state rather than receiving data through deeply nested props. This eliminates stale data between views and ensures every component sees the same catalog snapshot at any time.

**Why this priority**: Without centralized catalog state, no other store slices (UI navigation, placement tracking) can function. This is the foundational data layer the entire plugin depends on.

**Independent Test**: Can be fully tested by loading the plugin, verifying the catalog data is available through the global store, and confirming all components render the same data without prop drilling.

**Acceptance Scenarios**:

1. **Given** the plugin has just launched, **When** the host sends catalog data, **Then** the store updates its design-systems list and sets loading to false, and all consuming components re-render with the new data.
2. **Given** the catalog is loaded with multiple design systems, **When** a user toggles a design system off, **Then** the enabled-system set updates and all derived views (search, browse) immediately reflect only the remaining enabled systems.
3. **Given** the catalog is loaded, **When** a component reads from the store, **Then** it receives the same data as every other component — no stale or conflicting copies exist.

---

### User Story 2 - View Routing and Component Navigation via Store (Priority: P1)

A user navigates between the browse view, component detail view, and library management view. The current view and the active component (when viewing details) are tracked in the global store rather than through local state in App.tsx. This lets any component trigger navigation (e.g., a "Back" button in a detail panel) without passing callbacks up through the tree.

**Why this priority**: View routing is core to the user experience and tightly coupled with the catalog slice. Migrating it to the store is required before any new views can be built cleanly.

**Independent Test**: Can be fully tested by navigating between views (browse → detail → back to browse), verifying the store's view state changes correctly, and confirming the rendered UI matches the store state.

**Acceptance Scenarios**:

1. **Given** the user is on the browse view, **When** they click a component, **Then** the store sets the view to "detail" and records the active component's ID and design-system ID.
2. **Given** the user is on the detail view, **When** they click "Back", **Then** the store resets the view to "browse" and clears the active component.
3. **Given** the user is on any view, **When** they switch to "manage", **Then** the store sets the view to "manage" and the library management panel renders.

---

### User Story 3 - Search and Filter State in Store (Priority: P2)

A user types a search query or toggles design-system filters, and the global store holds both the query string and the list of active filter IDs. Derived selectors flatten the enabled systems' components into a searchable list, apply the active filters, and return results — removing the need for the current `useSearch` hook to own its own state.

**Why this priority**: Search is the primary interaction model, but it currently works. Migrating it to the store is an improvement for consistency and enables future features (e.g., preserving search across view changes), but the plugin already functions without it.

**Independent Test**: Can be fully tested by typing a search query, toggling filters, verifying the store's searchQuery and activeFilters update, and confirming the results list re-renders with the correct filtered set.

**Acceptance Scenarios**:

1. **Given** the store contains multiple enabled design systems, **When** a user types a query, **Then** the searchQuery updates in the store and derived selectors return matching components.
2. **Given** a search query is active, **When** the user toggles a design-system filter, **Then** activeFilters updates and results are narrowed to only components from selected systems.
3. **Given** the user is on the detail view with an active search, **When** they navigate back to browse, **Then** the search query and filters persist and the results list shows the previously filtered set.

---

### User Story 4 - Placement Status Tracking (Priority: P2)

When a user places a component onto the Figma canvas, the plugin tracks the placement lifecycle (idle → placing → success/error) in the global store. This allows any part of the UI to show progress indicators, success messages, or error states without threading status through callbacks.

**Why this priority**: Placement tracking is important for user feedback, but the current console-logging approach already works at a basic level. Promoting it to the store enables richer UI feedback (toast notifications, inline status) in future iterations.

**Independent Test**: Can be fully tested by initiating a placement, verifying the store transitions through idle → placing → success (or error), and confirming the UI can read placement status, error messages, and warnings.

**Acceptance Scenarios**:

1. **Given** placement status is idle, **When** the user triggers component placement, **Then** the store transitions to "placing".
2. **Given** the store is in "placing" status, **When** the host confirms success, **Then** the store transitions to "success" and records the placed node name and any warnings.
3. **Given** the store is in "placing" status, **When** the host reports an error, **Then** the store transitions to "error" and records the error message.
4. **Given** the store is in "success" or "error" status, **When** the placement is reset, **Then** the store returns to "idle" and clears all error/warning data.

---

### User Story 5 - App.tsx Migration to Thin Shell (Priority: P3)

After the store is in place, App.tsx is simplified to a thin shell: it sets up the plugin message bridge (translating incoming messages to store actions) and renders the correct view based on the store's view state. All local `useState` and routing logic are removed. This makes the top-level component easy to reason about and test.

**Why this priority**: This is a code-quality improvement that follows naturally once all store slices exist. It doesn't add new user-facing functionality but reduces complexity and enables faster future development.

**Independent Test**: Can be fully tested by verifying the plugin loads and functions identically before and after the migration — same catalog display, same search behavior, same placement flow — with App.tsx containing no local state for catalog, loading, or view routing.

**Acceptance Scenarios**:

1. **Given** the store is implemented, **When** App.tsx is migrated, **Then** all existing functionality (catalog loading, search, component placement) works identically from the user's perspective.
2. **Given** the migrated App.tsx, **When** a plugin message arrives, **Then** App.tsx dispatches the appropriate store action (setCatalogData, completePlacement, failPlacement) rather than managing local state.
3. **Given** the migrated App.tsx, **When** the store's view state changes, **Then** App.tsx renders the corresponding view component without any internal routing logic.

---

### Edge Cases

- What happens when the plugin receives catalog data while a search query is active? The store must update the design-systems list and derived selectors must recompute results with the new data while preserving the existing query.
- What happens when a user toggles off the only enabled design system? The enabled set becomes empty, derived selectors return zero components, and the UI shows an appropriate empty state.
- What happens when placement succeeds with warnings? The store must record both the success state and the warning messages so the UI can display both simultaneously.
- What happens when the plugin receives a placement error while the store is in "idle" (no placement in progress)? The store should ignore the error or handle it gracefully without crashing.
- What happens when catalog data arrives as an empty array? The store should set loading to false and the UI should show a "no design systems loaded" empty state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single centralized store accessible to all UI components, holding catalog data, UI navigation state, and placement status.
- **FR-002**: System MUST store the list of loaded design systems and a set of enabled design-system IDs, defaulting all loaded systems to enabled.
- **FR-003**: System MUST track a loading state that begins as true and transitions to false when catalog data is received.
- **FR-004**: System MUST allow toggling individual design systems on or off without affecting other systems' enabled state.
- **FR-005**: System MUST track the current view (browse, detail, or manage) and the active component (ID + design-system ID) when in detail view.
- **FR-006**: System MUST provide navigation actions: setting a view, opening a component detail (which sets both the view and active component), and going back (which resets to browse and clears the active component).
- **FR-007**: System MUST store the current search query and a list of active design-system filter IDs.
- **FR-008**: System MUST track placement lifecycle status (idle, placing, success, error), along with any error message and warning messages.
- **FR-009**: System MUST provide placement actions: start, complete (with node name and warnings), fail (with error message), and reset (back to idle).
- **FR-010**: System MUST provide derived selectors that compute: (a) enabled systems filtered from the full list, (b) the full Component object for the active component IDs, and (c) a flattened, filtered list of searchable components from enabled systems with active filters applied.
- **FR-011**: System MUST allow the existing plugin message handler to dispatch store actions (setCatalogData, completePlacement, failPlacement) in response to incoming messages.
- **FR-012**: System MUST allow App.tsx to become a thin shell that reads view state from the store and delegates all data management to store actions and selectors.

### Key Entities

- **AppStore**: The single global state container holding three logical slices — catalog, UI, and placement.
- **CatalogSlice**: Holds the list of design systems, the set of enabled system IDs, and the loading flag. Provides actions to load data and toggle systems.
- **UISlice**: Holds the current view, active component reference, search query, and active filters. Provides navigation and filter actions.
- **PlacementSlice**: Holds the placement lifecycle status, error message, and warnings array. Provides actions to transition between placement states.
- **Derived Selectors**: Pure functions that compute values from store state — enabled systems, active component lookup, and filtered component lists.

## Assumptions

- All loaded design systems are enabled by default when catalog data is first received.
- The "browse" view is the default/initial view when the plugin opens.
- Going back from any view returns to "browse" (not to a navigation stack).
- The search query and filters persist across view changes within a single session.
- Placement status resets are triggered explicitly by UI code (e.g., after displaying a toast) rather than on a timer.
- The store is created once per plugin session and is not persisted between sessions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing plugin functionality (catalog loading, search, component placement) works identically after migration — zero user-visible regressions.
- **SC-002**: App.tsx contains no local state for catalog data, loading, view routing, or placement status after migration.
- **SC-003**: Any UI component can read shared state and trigger actions without receiving props from a parent — prop drilling depth for state data is reduced to zero.
- **SC-004**: Toggling a design system on or off updates search results and browse views within one render cycle — users see immediate feedback.
- **SC-005**: Navigating between views preserves search query and filter state — users do not lose their search context when viewing a component detail and returning.
- **SC-006**: Placement status transitions are reflected in the UI within one render cycle — users see immediate feedback when placement starts, succeeds, or fails.
