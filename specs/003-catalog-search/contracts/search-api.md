# Search API Contract

**Feature Branch**: `003-catalog-search`  
**Created**: 2026-02-07

## Alias Resolver

**Module**: `src/ui/services/aliasResolver.ts`

### `createAliasResolver(aliasGroups: string[][]): AliasResolver`

Factory function that builds a lookup index from the raw alias groups array.

```ts
interface AliasResolver {
  /**
   * Given a search term, returns all synonymous terms from the alias database.
   * If the term is not in any alias group, returns [term] (the original only).
   * Matching is case-insensitive.
   */
  expand(term: string): string[];

  /**
   * Given a multi-word query string, expands each word independently
   * and returns the deduplicated union of all expanded terms.
   */
  expandQuery(query: string): string[];
}
```

**Behavior**:

| Input | Alias Group Exists? | Output |
|-------|---------------------|--------|
| `"combobox"` | Yes: `["combobox", "autocomplete", "typeahead"]` | `["combobox", "autocomplete", "typeahead"]` |
| `"button"` | No | `["button"]` |
| `"ComboBox"` | Yes (case-insensitive) | `["combobox", "autocomplete", "typeahead"]` |
| `""` | N/A | `[]` |

**Internal index structure**: A `Map<string, string[]>` keyed by lowercase term, pointing to the full group array. Built once on construction, O(1) lookup thereafter.

## Search Hook

**Module**: `src/ui/hooks/useSearch.ts`

### `useSearch(): SearchHookResult`

Reads search state from the Zustand store and returns computed results.

```ts
interface SearchHookResult {
  /** Current search query from store */
  query: string;
  /** Full search results (all pages, after alias expansion + dedup) */
  results: SearchResult[];
  /** Total result count */
  totalResults: number;
  /** Current page results (sliced by pagination) */
  paginatedResults: SearchResult[];
  /** Total number of pages */
  totalPages: number;
  /** Current page number (1-indexed) */
  currentPage: number;
}
```

**Search execution flow**:

1. Read `searchQuery` from store.
2. If query is empty → return all `filteredComponents` (no search, browse-all mode).
3. Expand query through `AliasResolver.expandQuery(query)`.
4. For the original query, run `fuse.search(query)`.
5. For each additional expanded term (not already covered by the original), run `fuse.search(term)`.
6. Merge all results, deduplicate by `designSystemId + componentId`, keeping the best (lowest) score.
7. Sort by score ascending (most relevant first).
8. Slice for current page: `results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)`.

**Deduplication rule**: When the same component is matched by multiple search passes (original query + alias terms), keep the entry with the lowest Fuse.js score (best relevance). Mark `matchedViaAlias = true` if the best-scoring match came from an alias-expanded term rather than the original query.

## Component Contracts

### SearchBar

**Module**: `src/ui/components/SearchBar.tsx`

```ts
interface SearchBarProps {
  placeholder?: string;  // default: "Search components..."
}
```

**Internal behavior**:
- Maintains local `value` state for immediate input feedback.
- Debounces (250ms) before calling `store.setSearchQuery(value)`.
- Reads `totalResults` from `useSearch()` for display (not a prop).
- Clear button resets local value and calls `store.setSearchQuery("")`.

### FilterChips

**Module**: `src/ui/components/FilterChips.tsx`

```ts
interface FilterChipsProps {
  // No props — reads from store
}
```

**Internal behavior**:
- Reads `designSystems` from store to generate chip labels.
- Reads `activeFilters` from store for selected state.
- "All" chip is selected when `activeFilters` is empty.
- Clicking a system chip sets `activeFilters` to `[systemId]`.
- Clicking "All" sets `activeFilters` to `[]`.
- Any filter change resets `currentPage` to 1.

### ResultsList

**Module**: `src/ui/components/ResultsList.tsx`

```ts
interface ResultsListProps {
  // No props — reads from store and useSearch()
}
```

**Internal behavior**:
- Reads `paginatedResults`, `totalResults`, `totalPages`, `currentPage`, `query` from `useSearch()`.
- Renders section header: "COMPONENTS" + "N results" count via Reshaped `Text`.
- Renders result cards in a 2-column grid.
- Renders `Pagination` component when `totalPages > 1`.
- Delegates to `EmptyState` when appropriate.

### EmptyState

**Module**: `src/ui/components/EmptyState.tsx`

```ts
interface EmptyStateProps {
  variant: 'browse' | 'no-results';
  query?: string;  // required when variant is 'no-results'
}
```

**Rendered content**:
- `browse`: "Browse components" heading + "Search for components across design systems" subtext.
- `no-results`: "No results for [query]" heading + "Try a different search term" subtext.

### LoadingSkeleton

**Module**: `src/ui/components/LoadingSkeleton.tsx`

```ts
interface LoadingSkeletonProps {
  // No props — renders a fixed skeleton layout
}
```

**Rendered content**: 
- Skeleton search bar (full-width Skeleton).
- Row of 3–4 skeleton chips.
- 2×4 grid of skeleton cards (each: Skeleton rectangle + Skeleton text lines).
