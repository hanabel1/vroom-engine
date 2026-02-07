# Quickstart: Catalog Search

**Branch**: `003-catalog-search` | **Date**: 2026-02-07

## Prerequisites

- Node.js 18+ and Yarn installed
- Repository cloned and on branch `003-catalog-search`
- Dependencies installed: `yarn install`

## Build & Run

```bash
# Start development mode (watches both canvas + plugin builds)
yarn dev

# Or build once
yarn build
```

The plugin loads in Figma Desktop via the development plugin manifest.

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/catalog/aliases.json` | Alias database — array of synonym groups |
| `src/ui/services/aliasResolver.ts` | Alias expansion logic (pure function, no React) |
| `src/ui/hooks/useSearch.ts` | Search hook — Fuse.js + alias expansion + pagination |
| `src/ui/store.ts` | Zustand store — search state (query, filters, page) |
| `src/ui/selectors.ts` | Derived selectors (filtered components, paginated results) |
| `src/ui/components/SearchBar.tsx` | Search input with debounce |
| `src/ui/components/FilterChips.tsx` | Design system filter toggle buttons |
| `src/ui/components/ResultsList.tsx` | Paginated result grid + count display |
| `src/ui/components/ResultCard.tsx` | Individual component result card |
| `src/ui/components/EmptyState.tsx` | Empty query / no results states |
| `src/ui/components/LoadingSkeleton.tsx` | Skeleton placeholders during load |

## Testing

```bash
# Run all tests
yarn test

# Run search-specific tests
yarn test -- --grep "alias"
yarn test -- --grep "search"
```

### Key test scenarios

1. **Alias expansion**: Verify `aliasResolver.expand("combobox")` returns all synonyms.
2. **Bidirectionality**: Verify searching from any term in a group finds the same results.
3. **Deduplication**: Verify a component matched via both name and alias appears only once.
4. **Pagination reset**: Verify changing query or filter resets page to 1.
5. **Empty states**: Verify correct message for empty query vs. zero results.

## Adding Aliases

Edit `src/catalog/aliases.json` and add a new group:

```json
["new-term", "synonym-1", "synonym-2"]
```

Rules:
- All terms lowercase.
- No term in more than one group.
- At least 2 terms per group.

## Architecture Overview

```text
User types "combobox"
       │
       ▼
SearchBar (debounces 250ms)
       │
       ▼
store.setSearchQuery("combobox")  ──resets──> currentPage = 1
       │
       ▼
useSearch hook
  ├── aliasResolver.expandQuery("combobox")
  │     └── returns ["combobox", "autocomplete", "typeahead", "select with search"]
  ├── fuse.search("combobox")        ──> results A
  ├── fuse.search("autocomplete")    ──> results B
  ├── fuse.search("typeahead")       ──> results C
  ├── fuse.search("select with search") ──> results D
  ├── merge + deduplicate (by designSystemId + componentId, best score wins)
  └── returns full results
       │
       ▼
ResultsList reads paginatedResults (page slice)
  ├── COMPONENTS heading + "N results" count
  ├── ResultCard grid (2 columns)
  └── Pagination controls (if totalPages > 1)
```
