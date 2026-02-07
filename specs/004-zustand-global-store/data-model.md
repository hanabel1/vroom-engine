# Data Model: Zustand Global Store

**Feature Branch**: `004-zustand-global-store`
**Created**: 2026-02-07

## Store State Shape

The global store (`AppStore`) is a flat object with three logical groupings. All fields are at the top level — no nested slice objects.

### Catalog Slice

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `designSystems` | `DesignSystem[]` | `[]` | All loaded design systems from plugin host |
| `enabledSystemIds` | `Set<string>` | `new Set()` | IDs of design systems currently toggled on |
| `isLoading` | `boolean` | `true` | True until first catalog data is received |

**Actions**:

| Action | Signature | Behavior |
|--------|-----------|----------|
| `setCatalogData` | `(systems: DesignSystem[]) => void` | Sets `designSystems` to the provided array, populates `enabledSystemIds` with all system IDs (all enabled by default), sets `isLoading` to `false` |
| `toggleSystem` | `(systemId: string, enabled: boolean) => void` | Adds or removes `systemId` from `enabledSystemIds`. Creates a new `Set` reference to trigger re-renders |

### UI Slice

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `view` | `'browse' \| 'detail' \| 'manage'` | `'browse'` | Current active view |
| `activeComponent` | `{ id: string; designSystemId: string } \| null` | `null` | Currently selected component for detail view |
| `searchQuery` | `string` | `''` | Current search input value |
| `activeFilters` | `string[]` | `[]` | Design system IDs to filter results by (empty = show all enabled) |

**Actions**:

| Action | Signature | Behavior |
|--------|-----------|----------|
| `setView` | `(view: 'browse' \| 'detail' \| 'manage') => void` | Sets `view` to the provided value |
| `setActiveComponent` | `(comp: { id: string; designSystemId: string } \| null) => void` | Sets `activeComponent` to the provided value |
| `setSearchQuery` | `(query: string) => void` | Sets `searchQuery` to the provided value |
| `setActiveFilters` | `(filters: string[]) => void` | Sets `activeFilters` to the provided array |
| `openDetail` | `(componentId: string, designSystemId: string) => void` | Sets `view` to `'detail'` and `activeComponent` to `{ id: componentId, designSystemId }` |
| `goBack` | `() => void` | Sets `view` to `'browse'` and `activeComponent` to `null` |

### Placement Slice

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `placementStatus` | `'idle' \| 'placing' \| 'success' \| 'error'` | `'idle'` | Current placement lifecycle state |
| `placementError` | `string \| null` | `null` | Error message when `placementStatus` is `'error'` |
| `placementWarnings` | `string[]` | `[]` | Warning messages from last successful placement |

**Actions**:

| Action | Signature | Behavior |
|--------|-----------|----------|
| `startPlacement` | `() => void` | Sets `placementStatus` to `'placing'`, clears `placementError` and `placementWarnings` |
| `completePlacement` | `(nodeName: string, warnings: string[]) => void` | Sets `placementStatus` to `'success'`, sets `placementWarnings` to the provided array |
| `failPlacement` | `(error: string) => void` | Sets `placementStatus` to `'error'`, sets `placementError` to the provided string |
| `resetPlacement` | `() => void` | Sets `placementStatus` to `'idle'`, clears `placementError` and `placementWarnings` |

## Derived Selectors

These are custom React hooks that compute values from store state. They live in `src/ui/selectors.ts`.

| Selector | Return Type | Computation |
|----------|-------------|-------------|
| `useEnabledSystems()` | `DesignSystem[]` | Filters `designSystems` to only those whose `id` is in `enabledSystemIds` |
| `useActiveComponent()` | `Component \| null` | Looks up the full `Component` object from `designSystems` using `activeComponent.id` and `activeComponent.designSystemId`. Returns `null` if `activeComponent` is `null` or not found |
| `useFilteredComponents()` | `SearchableComponent[]` | Flattens all components from enabled systems into a flat array with `designSystemId` and `designSystemName` attached. If `activeFilters` is non-empty, further filters to only those systems. Returns the full list (search/Fuse.js filtering happens in the consuming component or a wrapper hook) |

## State Transitions

### Placement Lifecycle

```
idle ──startPlacement──► placing
                            │
              ┌─────────────┼─────────────┐
              ▼                            ▼
          success                        error
      (nodeName, warnings)          (error message)
              │                            │
              └──────resetPlacement─────────┘
                          │
                          ▼
                        idle
```

### View Navigation

```
browse ──openDetail──► detail
  ▲                      │
  └────goBack────────────┘

browse ──setView('manage')──► manage
  ▲                             │
  └────setView('browse')────────┘

detail ──setView('manage')──► manage
           (activeComponent preserved until goBack or new openDetail)
```

## Entity Relationships

```
AppStore
├── designSystems: DesignSystem[]
│   └── DesignSystem
│       ├── id ◄────── enabledSystemIds (Set membership)
│       ├── name
│       ├── components: Component[]
│       │   └── Component
│       │       ├── id ◄────── activeComponent.id
│       │       ├── name, category, html, etc.
│       │       └── variants, props
│       └── ...
├── enabledSystemIds: Set<string> (references DesignSystem.id)
├── activeComponent: { id, designSystemId } (references Component.id + DesignSystem.id)
└── activeFilters: string[] (references DesignSystem.id)
```

## Existing Types (Unchanged)

The store uses existing types from `src/ui/types/catalog.ts`:

- `DesignSystem` — top-level design system with `id`, `name`, `version`, `components[]`
- `Component` — individual component with `id`, `name`, `category`, `html`, `props[]`, `variants[]`
- `Category` — union type for component categories
- `ComponentProp`, `ComponentVariant`, `PropValue` — nested component metadata

No new type files are needed. The `AppStore` interface is defined in `src/ui/store.ts` alongside the store creation.
