# Data Model: Catalog Search

**Branch**: `003-catalog-search` | **Date**: 2026-02-07

## Entities

### AliasGroup

Represents a set of synonymous terms for the same UI pattern concept.

**Source**: `src/catalog/aliases.json`  
**Format**: Array of string arrays (each inner array is one group)

| Field | Type | Description |
|-------|------|-------------|
| terms | `string[]` | All synonymous terms in this group. Order is irrelevant — membership is bidirectional and transitive. |

**Validation rules**:
- Each term MUST be a non-empty lowercase string.
- No term may appear in more than one alias group (a term belongs to exactly one group or no group).
- Each group MUST have at least 2 terms (a single-term group is meaningless).
- Terms are compared case-insensitively during search lookup.

**Example**:
```json
["combobox", "autocomplete", "typeahead", "select with search"]
```

### SearchableComponent (existing, unchanged)

Augmented component with design system metadata, used as the search index item.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` | Component identifier within its design system |
| name | `string` | Display name (e.g., "Button") |
| aliases | `string[]?` | Optional inline aliases from catalog JSON |
| description | `string?` | Component description |
| category | `Category` | One of: input, display, navigation, feedback, layout, surface |
| previewUrl | `string` | Path to preview image |
| html | `string` | Inline-styled HTML for Figma placement |
| props | `ComponentProp[]?` | Optional prop definitions |
| variants | `ComponentVariant[]?` | Optional variant definitions |
| designSystemId | `string` | Parent design system ID |
| designSystemName | `string` | Parent design system display name |

### SearchResult (existing, extended)

Result from a Fuse.js search, augmented with alias match metadata.

| Field | Type | Description |
|-------|------|-------------|
| item | `SearchableComponent` | The matched component |
| score | `number?` | Fuse.js relevance score (0 = perfect, 1 = no match) |
| matches | `FuseResultMatch[]?` | Which fields matched and where |
| matchedViaAlias | `boolean` | Whether this result was found via alias expansion (not original query) |

### PaginatedSearchState

State shape for the search + pagination slice in the Zustand store.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| searchQuery | `string` | `""` | Current search input (already exists in store) |
| activeFilters | `string[]` | `[]` | Active design system filter IDs (already exists in store) |
| currentPage | `number` | `1` | Current pagination page (1-indexed) |

### Derived Data (computed, not stored)

| Name | Type | Computed From | Description |
|------|------|---------------|-------------|
| expandedTerms | `string[]` | searchQuery + aliases.json | All search terms after alias expansion |
| filteredComponents | `SearchableComponent[]` | designSystems + enabledSystemIds + activeFilters | Components from enabled + filtered systems |
| searchResults | `SearchResult[]` | filteredComponents + expandedTerms + Fuse.js | Full search results (all pages) |
| totalResults | `number` | searchResults.length | Total count for "N results" display |
| totalPages | `number` | ceil(totalResults / PAGE_SIZE) | Total pagination pages |
| paginatedResults | `SearchResult[]` | searchResults + currentPage + PAGE_SIZE | Current page slice |

## Relationships

```text
DesignSystem (1) ──has──> (*) Component
Component (1) ──has──> (0..*) inline aliases
AliasGroup (*) ──maps──> (*) terms (many-to-many: terms across groups)
SearchQuery (1) ──expands via──> AliasGroup ──to──> expandedTerms
expandedTerms + filteredComponents ──Fuse.js──> SearchResult[]
SearchResult[] ──paginate──> paginatedResults (current page slice)
```

## State Transitions

### Search Flow
```text
IDLE ──[user types]──> DEBOUNCING ──[250ms elapsed]──> SEARCHING ──[results computed]──> DISPLAYING
DISPLAYING ──[user types again]──> DEBOUNCING (resets currentPage to 1)
DISPLAYING ──[user clicks page]──> DISPLAYING (updates currentPage)
DISPLAYING ──[user clicks filter]──> SEARCHING (resets currentPage to 1)
DISPLAYING ──[user clears search]──> IDLE (resets to browse-all state)
```

### Loading Flow
```text
LOADING ──[setCatalogData called]──> LOADED
LOADED ──[search interaction]──> (enters Search Flow above)
```

## Constants

| Name | Value | Description |
|------|-------|-------------|
| PAGE_SIZE | 8 | Cards per page (2 columns × 4 rows) |
| DEBOUNCE_MS | 250 | Search input debounce interval (matches existing) |
| FUSE_THRESHOLD | 0.4 | Fuzzy match threshold (matches existing) |
| FUSE_DISTANCE | 100 | Fuzzy match distance (matches existing) |
