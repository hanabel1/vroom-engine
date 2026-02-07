# Research: Zustand Global Store

**Feature Branch**: `004-zustand-global-store`
**Created**: 2026-02-07

## Decision 1: State Management Library

**Decision**: Zustand 5.x

**Rationale**: Zustand is the smallest viable library that solves the specific problems in this codebase: prop drilling of catalog data, scattered `useState` hooks, and inability for child components to trigger top-level state changes (e.g., view routing). It integrates natively with React hooks and requires zero boilerplate (no Provider, no reducers, no action types).

**Alternatives considered**:

| Alternative | Bundle Size | Why Rejected |
|-------------|------------|--------------|
| React Context + `useReducer` | 0 KB (built-in) | Re-renders all consumers on any state change. To avoid this, you need multiple contexts + memoization — effectively reimplementing a store with more code. |
| Jotai | ~3.5 KB gzipped | Atom-based model adds conceptual overhead for a store with three tightly related slices. Better suited for independent atoms. |
| Valtio | ~3.8 KB gzipped | Proxy-based reactivity is powerful but less predictable with TypeScript strict mode. Debugging proxied state is harder. |
| Redux Toolkit | ~11 KB gzipped | Overkill for a Figma plugin. Requires Provider, slices, reducers, action creators — excessive ceremony for this scope. |

**Bundle impact**: Zustand 5.x is ~1.1 KB gzipped (~3 KB uncompressed). Current plugin bundle is well under the 5 MB limit. Negligible impact.

## Decision 2: Store Architecture — Single Store with Logical Slices

**Decision**: One `create()` call with three logical slices defined inline (not separate `StateCreator` functions).

**Rationale**: The store has only ~20 state fields and ~15 actions. Splitting into separate `StateCreator` slice files adds typing complexity (each slice needs to know the full store type via generics) without meaningful organizational benefit at this scale. All slices are defined in a single `store.ts` file with clear comment separators.

**When to revisit**: If the store grows beyond ~40 fields or if slices need independent reuse in other projects, extract to separate `StateCreator` functions per the Zustand slices pattern.

**Alternatives considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| Separate `StateCreator` per slice | Adds ~30 lines of generic type annotations. Cross-slice access (e.g., `openDetail` setting both UI and catalog state) requires the full union type in every slice creator. Not worth it at this scale. |
| Multiple separate stores | Breaks atomic updates across slices (e.g., `setCatalogData` needs to update both `designSystems` and `enabledSystemIds`). Forces consumers to subscribe to multiple stores. |

## Decision 3: Derived Selectors Strategy

**Decision**: Custom hooks in `src/ui/selectors.ts` that call `useAppStore` with inline selector functions. Use `useShallow` from `zustand/react/shallow` for selectors that return objects or arrays.

**Rationale**: Zustand re-renders a component only when the selector's return value changes (by `Object.is`). For primitive selectors (e.g., `store.view`), this is automatic. For selectors returning arrays or objects (e.g., filtered component lists), `useShallow` prevents re-renders when the contents haven't changed, only the reference has.

**Pattern**:
```ts
// Primitive — no useShallow needed
const view = useAppStore((s) => s.view);

// Array/object — wrap with useShallow
const enabledSystems = useAppStore(
  useShallow((s) => s.designSystems.filter(ds => s.enabledSystemIds.has(ds.id)))
);
```

**Alternatives considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| Auto-generated selectors (`createSelectors` helper) | Generates a selector for every field, but we need computed/derived selectors (filtered lists, lookups), not just field access. Doesn't solve the actual problem. |
| Reselect-style memoized selectors | Adds another dependency. Zustand's built-in `useShallow` + React `useMemo` inside selector hooks covers all cases. |

## Decision 4: `Set<string>` for `enabledSystemIds`

**Decision**: Use `Set<string>` in the store state. Replace with a new `Set` on every mutation to trigger Zustand's `Object.is` change detection.

**Rationale**: `Set` provides O(1) `has()` lookups, which is used in every selector that filters by enabled systems. The alternative (plain array with `includes()`) is O(n) per check and less idiomatic.

**Caveat**: Zustand uses `Object.is` for equality. Mutating a Set in place (`.add()`, `.delete()`) does not change the reference, so Zustand won't detect the change. Every mutation must create a new Set:

```ts
toggleSystem: (systemId, enabled) => set((state) => {
  const next = new Set(state.enabledSystemIds);
  enabled ? next.add(systemId) : next.delete(systemId);
  return { enabledSystemIds: next };
}),
```

This is a well-documented Zustand pattern for reference-type state.

## Decision 5: Fuse.js Integration with Store

**Decision**: Keep Fuse.js index creation inside the `useFilteredComponents` selector hook using `useMemo`, not in the store itself.

**Rationale**: The Fuse index is a derived computation (depends on `enabledSystems` + `activeFilters`), not state. Putting it in the store would mean either: (a) storing a non-serializable `Fuse` instance in state, or (b) recreating it on every `set()` call. Keeping it in a `useMemo` inside the selector hook means it only rebuilds when the input data changes, and it stays out of the store's state shape.

**Alternatives considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| Store the Fuse index in the store | Non-serializable object in state. Complicates devtools and testing. |
| Rebuild Fuse on every search | Unnecessary recomputation. Building the index is O(n) and should only happen when the component list changes. |

## Decision 6: Migration Strategy

**Decision**: Incremental migration — store + selectors first, then migrate App.tsx, then migrate individual components.

**Rationale**: The store can be created and tested independently of the existing code. Once validated, App.tsx is migrated to dispatch store actions from the message handler and read `view` from the store. Individual components (SearchBar, ResultsList) are then migrated to read from selectors. This avoids a big-bang rewrite and allows each step to be verified independently.

**Migration order**:
1. Add `zustand` dependency
2. Create `store.ts` with all three slices
3. Create `selectors.ts` with derived hooks
4. Write unit tests for store and selectors
5. Migrate App.tsx message handler to use store actions
6. Migrate App.tsx view routing to use `store.view`
7. Migrate SearchBar to read `searchQuery` from store
8. Migrate ResultsList to use `useFilteredComponents()` selector
9. Remove unused `useState` hooks and props from App.tsx
10. Verify all existing behavior is preserved
