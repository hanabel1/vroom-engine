# Store Extensions Contract

**Feature Branch**: `003-catalog-search`  
**Created**: 2026-02-07

## Additions to AppStore Interface

These fields and actions are added to the existing `AppStore` interface in `src/ui/store.ts`.

### New State Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `currentPage` | `number` | `1` | Current pagination page (1-indexed) |

### New Actions

| Action | Parameters | State Changes | Postconditions |
|--------|-----------|---------------|----------------|
| `setCurrentPage` | `page: number` | `currentPage = page` | Page must be >= 1 |

### Modified Actions (behavior change)

| Action | Change | Reason |
|--------|--------|--------|
| `setSearchQuery` | Also sets `currentPage = 1` | Changing search query must reset pagination to page 1 (FR-009) |
| `setActiveFilters` | Also sets `currentPage = 1` | Changing filters must reset pagination to page 1 (FR-009) |

## Updated Store Interface (diff)

```ts
export interface AppStore {
  // ... existing fields unchanged ...

  // -- UI slice additions --
  currentPage: number;
  setCurrentPage: (page: number) => void;

  // -- Modified actions (existing signature, new behavior) --
  // setSearchQuery: now also resets currentPage to 1
  // setActiveFilters: now also resets currentPage to 1
}
```

## New Selectors

**Module**: `src/ui/selectors.ts`

### `useSearchResults(): SearchResult[]`

Returns the full (unpaginated) search results after alias expansion and deduplication.

```ts
function useSearchResults(): SearchResult[]
```

- When `searchQuery` is empty: returns all `filteredComponents` mapped as `SearchResult` (browse-all mode).
- When `searchQuery` is non-empty: runs Fuse.js with alias-expanded terms and deduplicates.
- Memoized: recomputes only when `searchQuery`, `filteredComponents`, or alias data changes.

### `usePaginatedResults(): PaginatedResults`

Returns the current page slice and pagination metadata.

```ts
interface PaginatedResults {
  results: SearchResult[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
}

function usePaginatedResults(): PaginatedResults
```

- Reads `currentPage` from store.
- Reads full results from `useSearchResults()`.
- Computes `totalPages = Math.ceil(totalResults / PAGE_SIZE)`.
- Clamps `currentPage` to `[1, totalPages]`.
- Returns the sliced results for the current page.

### `useDesignSystemOptions(): DesignSystemOption[]`

Returns the list of design systems available for filter chips.

```ts
interface DesignSystemOption {
  id: string;
  name: string;
}

function useDesignSystemOptions(): DesignSystemOption[]
```

- Reads `designSystems` from store.
- Returns `[{ id, name }]` for each loaded system.
- Memoized: recomputes only when `designSystems` changes.

## Integration Points

### SearchBar → Store

| Current Pattern | New Pattern |
|----------------|-------------|
| Prop `onSearch: (query: string) => void` | `useAppStore((s) => s.setSearchQuery)` |
| Prop `resultCount?: number` | `useSearch().totalResults` (read internally) |

### FilterChips → Store

| Interaction | Store Action |
|-------------|-------------|
| Click design system chip | `setActiveFilters([systemId])` |
| Click "All" chip | `setActiveFilters([])` |

### ResultsList → Store + useSearch

| Current Pattern | New Pattern |
|----------------|-------------|
| Prop `results: SearchResult[]` | `useSearch().paginatedResults` |
| Prop `query: string` | `useAppStore((s) => s.searchQuery)` |
| N/A | `useSearch().totalResults` for count display |

### Pagination → Store

| Interaction | Store Action |
|-------------|-------------|
| Click page number | `setCurrentPage(page)` |
| Click previous | `setCurrentPage(currentPage - 1)` |
| Click next | `setCurrentPage(currentPage + 1)` |
