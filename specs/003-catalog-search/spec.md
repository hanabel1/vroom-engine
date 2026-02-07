# Feature Specification: Catalog Search

**Feature Branch**: `003-catalog-search`  
**Created**: 2026-02-07  
**Status**: Draft  
**Input**: User description: "Implement search on the Browse view: search algorithm, UX, filtering, results display, pagination, alias-based search, result counts, and empty/loading states"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search Components by Name (Priority: P1)

A user opens the Browse view and types a component name (e.g., "Button") into the search field. As they type, the results update in real time (debounced) to show matching components from all loaded design systems. The result count ("N results") is displayed next to the **COMPONENTS** heading. Results appear as cards in a grid layout, each showing the component preview, name, design system badge, and category.

**Why this priority**: Searching by name is the most fundamental interaction. Without it, users have no way to find specific components quickly.

**Independent Test**: Can be fully tested by typing a component name into the search field and verifying that matching components appear in the grid with the correct count displayed.

**Acceptance Scenarios**:

1. **Given** the catalog is loaded with components from multiple design systems, **When** the user types "Button" into the search field, **Then** all components whose name matches "Button" appear in the results grid and the count next to the COMPONENTS heading shows the correct total (e.g., "3 results").
2. **Given** the search field has focus, **When** the user types a partial name like "Btn", **Then** fuzzy matching returns relevant results including components named "Button".
3. **Given** the user has typed a query, **When** they clear the search field, **Then** the view returns to the default browsing state showing all components.
4. **Given** search results are displayed, **When** the user reviews a result card, **Then** the card shows the component preview thumbnail, name, design system name, and category.

---

### User Story 2 - Alias-Based Search with Bidirectional Lookup (Priority: P1)

The system maintains a separate alias database mapping equivalent component names (e.g., "combobox" ↔ "autocomplete" ↔ "typeahead" ↔ "select with search"). When a user searches for any term in an alias group, the search automatically expands to include all aliases in that group. This works bidirectionally: searching "autocomplete" also finds components named "combobox", and vice versa.

**Why this priority**: Designers and developers use different vocabulary for the same UI pattern. Without alias expansion, users miss relevant results simply because they used a different term than the component author.

**Independent Test**: Can be tested by searching for an alias term (e.g., "autocomplete") and verifying that components registered under synonymous names (e.g., "combobox", "typeahead") also appear in results.

**Acceptance Scenarios**:

1. **Given** the alias database maps "combobox", "autocomplete", "typeahead", and "select with search" as equivalents, **When** the user searches for "combobox", **Then** results include components matching any of those alias terms.
2. **Given** the alias database contains a group of synonyms, **When** the user searches for the last alias in the group, **Then** results include components matching the first alias and all others (bidirectional).
3. **Given** a component in the catalog has inline aliases (e.g., Button has alias "btn"), **When** the user searches for "btn", **Then** the Button component appears in results.
4. **Given** a search term matches both a catalog inline alias and a term in the alias database, **When** the user searches, **Then** results combine matches from both sources without duplicates.

---

### User Story 3 - Results Pagination (Priority: P2)

When search results exceed a page size, the user can navigate through pages of results. The system shows a limited number of result cards per page and provides controls to move between pages.

**Why this priority**: With growing catalogs, search results can become unwieldy. Pagination keeps the interface responsive and manageable, but initial value can be delivered without it.

**Independent Test**: Can be tested by performing a search that returns more results than one page can hold and verifying that pagination controls appear and function correctly.

**Acceptance Scenarios**:

1. **Given** a search returns more results than fit on one page, **When** the results are displayed, **Then** only the first page of results is shown and pagination controls are visible.
2. **Given** the user is on the first page of results, **When** they navigate to the next page, **Then** the next batch of results is displayed and the page indicator updates.
3. **Given** the user is on a page other than the first, **When** they navigate to the previous page, **Then** the previous batch of results is displayed.
4. **Given** the user changes their search query, **When** new results appear, **Then** pagination resets to the first page.

---

### User Story 4 - Design System Filter Chips (Priority: P2)

The Browse view displays filter chips (e.g., "All", "MUI", "Tailwind", "Ant Design") below the search bar. Selecting a chip narrows results to only components from that design system. The "All" chip is selected by default.

**Why this priority**: Filtering by design system helps users working within a specific system find components faster. It is secondary to core search functionality.

**Independent Test**: Can be tested by clicking a design system filter chip and verifying that only components from that system appear in results.

**Acceptance Scenarios**:

1. **Given** the Browse view is open, **When** the user selects the "MUI" filter chip, **Then** only components from Material UI are shown and the result count updates accordingly.
2. **Given** a filter chip is active, **When** the user also types a search query, **Then** results are filtered by both the selected design system and the search term.
3. **Given** a design system filter is active, **When** the user selects "All", **Then** results from all design systems are shown again.
4. **Given** a filter is active and results are paginated, **When** the user switches to a different filter, **Then** pagination resets to the first page.

---

### User Story 5 - Empty and Loading States (Priority: P2)

The Browse view provides clear visual feedback for three states: (1) while the catalog is loading, a skeleton placeholder is displayed; (2) when the search field is empty, a "Browse components" prompt encourages exploration; (3) when a search returns no matches, a "No results for X" message is shown.

**Why this priority**: These states are essential for a polished user experience, but they don't block core search functionality.

**Independent Test**: Can be tested by observing the UI during catalog load, clearing the search field, and entering a query that matches nothing.

**Acceptance Scenarios**:

1. **Given** the plugin has just opened and the catalog data has not yet loaded, **When** the user sees the Browse view, **Then** a loading skeleton (placeholder shapes mimicking result cards) is displayed.
2. **Given** the catalog is loaded and the search field is empty, **When** the user views the Browse view, **Then** a "Browse components" message is displayed along with a prompt to search.
3. **Given** the catalog is loaded, **When** the user types a query that matches no components, **Then** a "No results for [query]" message is displayed (substituting the actual search term).
4. **Given** the loading skeleton is displayed, **When** the catalog finishes loading, **Then** the skeleton is replaced with the actual browse state (default components or search results).

---

### User Story 6 - Result Count Display (Priority: P3)

The total number of matching components is displayed next to the **COMPONENTS** heading in the format "N results". This count updates in real time as the user types or changes filters.

**Why this priority**: While useful for user orientation, this is an informational enhancement layered on top of core search.

**Independent Test**: Can be tested by performing searches with different queries and verifying the displayed count matches the actual number of results.

**Acceptance Scenarios**:

1. **Given** the user performs a search, **When** results are displayed, **Then** the COMPONENTS heading shows "N results" where N is the total number of matching components across all design systems.
2. **Given** results are displayed with a count, **When** the user applies a design system filter, **Then** the count updates to reflect the filtered total.
3. **Given** no search query is entered, **When** browsing all components, **Then** the count reflects the total number of components in the catalog.

---

### Edge Cases

- What happens when the user types very quickly (faster than debounce interval)? Only the final query after the debounce period should trigger a search.
- What happens when two components from different design systems have the same name? Both should appear in results, each clearly labeled with their design system.
- What happens when the alias database contains circular references (A→B→C→A)? The system should resolve all members of the alias group without infinite loops.
- What happens when a search term matches both a component name and an alias from a different alias group? Both matches should be shown, deduplicated by component identity (design system + component ID).
- What happens when the catalog contains zero components? The empty state "Browse components" should still be displayed, not a broken UI.
- What happens when the user navigates to a page beyond the last page? The system should cap at the last available page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST perform fuzzy search against component names, matching partial and approximate strings.
- **FR-002**: System MUST search component inline aliases (aliases stored in catalog JSON) alongside component names.
- **FR-003**: System MUST maintain a separate alias database mapping groups of synonymous component terms (e.g., "combobox" ↔ "autocomplete" ↔ "typeahead").
- **FR-004**: System MUST expand search queries using the alias database bidirectionally—searching for any term in an alias group MUST return results for all terms in that group.
- **FR-005**: System MUST debounce search input to avoid excessive processing during rapid typing.
- **FR-006**: System MUST display results in a card grid layout, with each card showing the component preview, name, design system name, and category.
- **FR-007**: System MUST display the total result count next to the COMPONENTS heading in the format "N results".
- **FR-008**: System MUST paginate results when the total exceeds a single page, providing navigation controls to move between pages.
- **FR-009**: System MUST reset pagination to the first page when the search query changes or a filter is applied.
- **FR-010**: System MUST provide design system filter chips (e.g., "All", "MUI", "Tailwind") that narrow results to a specific design system.
- **FR-011**: System MUST combine search query filtering and design system filtering—both filters operate together.
- **FR-012**: System MUST display a loading skeleton while catalog data is being fetched.
- **FR-013**: System MUST display "Browse components" with an explanatory prompt when the search field is empty and the catalog is loaded.
- **FR-014**: System MUST display "No results for [query]" when a search yields zero matches (substituting the actual query text).
- **FR-015**: System MUST deduplicate results when a component matches through multiple paths (name, inline alias, and alias database expansion).
- **FR-016**: System MUST clear the search field and reset to the default browse state when the user activates the clear action.

### Key Entities

- **Component**: A UI element from a design system catalog. Has a name, ID, aliases, category, preview, description, and props. Belongs to exactly one design system.
- **Design System**: A collection of components (e.g., Material UI, Tailwind UI). Has a name, version, and component list.
- **Alias Group**: A set of synonymous terms that refer to the same UI pattern concept (e.g., {"combobox", "autocomplete", "typeahead", "select with search"}). Stored in a separate alias database. Membership is bidirectional and transitive.
- **Search Result**: A component matched by a search query, with relevance score and match metadata. Deduplicated by the combination of design system ID and component ID.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can find a component by typing its name or any known synonym within 2 seconds of starting to type.
- **SC-002**: Alias-expanded searches return all equivalent components—searching for any synonym in an alias group returns 100% of the components that match any term in that group.
- **SC-003**: Result count next to the COMPONENTS heading accurately reflects the total number of matching components at all times.
- **SC-004**: Pagination controls allow users to navigate through large result sets without the view becoming unresponsive.
- **SC-005**: Empty state messaging is contextually correct: "Browse components" for empty queries, "No results for X" for zero-match queries, and a loading skeleton during catalog fetch.
- **SC-006**: Filtering by design system correctly narrows results—selecting a filter chip and verifying result count shows only components from the selected system.
- **SC-007**: No duplicate results appear when a component matches via multiple search paths (direct name, inline alias, alias database expansion).

## Assumptions

- The alias database is a static data file maintained as part of the project (not fetched from a remote service).
- Each catalog JSON file follows the existing schema where components may optionally include an `aliases` array.
- The page size for pagination is a reasonable default (e.g., 8–12 cards per page) chosen to fit the Figma plugin viewport without scrolling excessively.
- The debounce interval for search input follows the existing 250ms convention in the codebase.
- Filter chips are dynamically generated from the loaded catalog data (one chip per design system, plus an "All" chip).
- The Browse view layout follows the design shown in the reference screenshot: search bar at top, filter chips below, COMPONENTS section header with result count, then a card grid.
