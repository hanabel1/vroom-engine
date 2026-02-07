# Quickstart: Zustand Global Store

**Feature Branch**: `004-zustand-global-store`
**Created**: 2026-02-07

## Prerequisites

- Node.js 18+ and Yarn
- Existing vroom-engine repo checked out on branch `004-zustand-global-store`

## Setup

```bash
# Install Zustand
yarn add zustand

# Verify it's added to package.json dependencies
cat package.json | grep zustand
```

## File Creation Order

1. **`src/ui/store.ts`** — Global store with three slices (Catalog, UI, Placement)
2. **`src/ui/selectors.ts`** — Derived selector hooks (`useEnabledSystems`, `useActiveComponent`, `useFilteredComponents`)
3. **`tests/unit/store.test.ts`** — Unit tests for store actions
4. **`tests/unit/selectors.test.ts`** — Unit tests for derived selectors

## Migration Order (after store is created and tested)

1. **App.tsx** — Replace message handler to use store actions; replace view routing with `store.view`
2. **SearchBar.tsx** — Read `setSearchQuery` from store instead of prop
3. **ResultsList.tsx** — Use `useFilteredComponents()` selector instead of `results` prop
4. **useSearch.ts** — Refactor to read from store state instead of receiving `catalogData` as parameter

## Key Patterns

### Reading state in a component

```tsx
import { useAppStore } from '@/ui/store';

function MyComponent() {
  // Single field — optimal re-render behavior
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  return <button onClick={() => setView('manage')}>Manage</button>;
}
```

### Using derived selectors

```tsx
import { useEnabledSystems, useFilteredComponents } from '@/ui/selectors';

function BrowseView() {
  const systems = useEnabledSystems();
  const components = useFilteredComponents();

  return (
    <div>
      <p>{systems.length} systems enabled</p>
      <p>{components.length} components available</p>
    </div>
  );
}
```

### Dispatching store actions from message handler

```tsx
import { useAppStore } from '@/ui/store';

// Inside App.tsx message handler:
const handleMessage = useCallback((message: PluginMessage) => {
  const store = useAppStore.getState();

  if (message.type === 'CATALOG_DATA') {
    store.setCatalogData(message.payload.designSystems);
  } else if (message.type === 'PLACEMENT_COMPLETE') {
    store.completePlacement(message.payload.nodeName, message.payload.warnings);
  } else if (message.type === 'PLACEMENT_ERROR') {
    store.failPlacement(message.payload.error);
  }
}, []);
```

### Testing store actions (outside React)

```ts
import { useAppStore } from '@/ui/store';

// Reset store before each test
beforeEach(() => {
  useAppStore.setState({
    designSystems: [],
    enabledSystemIds: new Set(),
    isLoading: true,
    view: 'browse',
    activeComponent: null,
    searchQuery: '',
    activeFilters: [],
    placementStatus: 'idle',
    placementError: null,
    placementWarnings: [],
  });
});

test('setCatalogData populates systems and enables all', () => {
  const systems = [{ id: 'mui', name: 'MUI', version: '5', components: [] }];
  useAppStore.getState().setCatalogData(systems);

  const state = useAppStore.getState();
  expect(state.designSystems).toEqual(systems);
  expect(state.enabledSystemIds.has('mui')).toBe(true);
  expect(state.isLoading).toBe(false);
});
```

## Build & Verify

```bash
# Type-check
npx tsc --noEmit

# Run tests
yarn test

# Build plugin
yarn build

# Dev mode (watch)
yarn dev
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Component doesn't re-render on state change | Selector returns new object/array reference each time | Wrap selector with `useShallow` from `zustand/react/shallow` |
| `Set` mutations don't trigger re-render | Mutating `Set` in place doesn't change reference | Always create `new Set(...)` in store actions |
| Store state is stale in `useCallback` | Closure captures old state | Use `useAppStore.getState()` for non-reactive reads (e.g., in event handlers) |
| TypeScript error on `create<AppStore>()` | Missing double parentheses | Use `create<AppStore>()(...)` — the curried form is required for TypeScript |
