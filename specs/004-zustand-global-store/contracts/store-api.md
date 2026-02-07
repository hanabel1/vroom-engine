# Store API Contract

**Feature Branch**: `004-zustand-global-store`
**Created**: 2026-02-07

## Public API Surface

This document defines the public contract of the Zustand global store. All UI components interact with state exclusively through these interfaces.

### Store Hook

**Module**: `src/ui/store.ts`
**Export**: `useAppStore`

```ts
import { useAppStore } from '@/ui/store';

// Read a single field (primitive selector — minimal re-renders)
const view = useAppStore((s) => s.view);

// Read an action
const setView = useAppStore((s) => s.setView);

// Read multiple fields (use useShallow to avoid unnecessary re-renders)
const { searchQuery, activeFilters } = useAppStore(
  useShallow((s) => ({ searchQuery: s.searchQuery, activeFilters: s.activeFilters }))
);
```

### Selector Hooks

**Module**: `src/ui/selectors.ts`

#### `useEnabledSystems()`

```ts
function useEnabledSystems(): DesignSystem[]
```

Returns only the design systems whose IDs are in `enabledSystemIds`. Re-renders only when the filtered result changes (shallow comparison).

#### `useActiveComponent()`

```ts
function useActiveComponent(): Component | null
```

Returns the full `Component` object matching `activeComponent.id` and `activeComponent.designSystemId`. Returns `null` when no component is selected or when the referenced component is not found in any loaded design system.

#### `useFilteredComponents()`

```ts
function useFilteredComponents(): SearchableComponent[]
```

Returns a flattened array of all components from enabled systems, each augmented with `designSystemId` and `designSystemName`. When `activeFilters` is non-empty, further restricts to only those design system IDs. Returns the full unfiltered list when `activeFilters` is empty.

### Store Actions Contract

All actions are synchronous and update state immediately.

#### Catalog Actions

| Action | Parameters | State Changes | Postconditions |
|--------|-----------|---------------|----------------|
| `setCatalogData` | `systems: DesignSystem[]` | `designSystems = systems`, `enabledSystemIds = new Set(systems.map(s => s.id))`, `isLoading = false` | All systems enabled. Loading complete. |
| `toggleSystem` | `systemId: string, enabled: boolean` | `enabledSystemIds` updated (new Set reference) | Only the targeted system's membership changes. |

#### UI Actions

| Action | Parameters | State Changes | Postconditions |
|--------|-----------|---------------|----------------|
| `setView` | `view: 'browse' \| 'detail' \| 'manage'` | `view = view` | Does not clear `activeComponent`. |
| `setActiveComponent` | `comp: { id: string; designSystemId: string } \| null` | `activeComponent = comp` | Does not change `view`. |
| `setSearchQuery` | `query: string` | `searchQuery = query` | — |
| `setActiveFilters` | `filters: string[]` | `activeFilters = filters` | — |
| `openDetail` | `componentId: string, designSystemId: string` | `view = 'detail'`, `activeComponent = { id: componentId, designSystemId }` | Atomic: both fields set in one `set()` call. |
| `goBack` | *(none)* | `view = 'browse'`, `activeComponent = null` | Atomic: both fields set in one `set()` call. |

#### Placement Actions

| Action | Parameters | State Changes | Postconditions |
|--------|-----------|---------------|----------------|
| `startPlacement` | *(none)* | `placementStatus = 'placing'`, `placementError = null`, `placementWarnings = []` | Previous error/warnings cleared. |
| `completePlacement` | `nodeName: string, warnings: string[]` | `placementStatus = 'success'`, `placementWarnings = warnings` | `nodeName` is logged/available for UI but not stored (only warnings persisted). |
| `failPlacement` | `error: string` | `placementStatus = 'error'`, `placementError = error` | — |
| `resetPlacement` | *(none)* | `placementStatus = 'idle'`, `placementError = null`, `placementWarnings = []` | Full reset to initial placement state. |

### Integration Points

#### Plugin Message Handler (App.tsx)

The message handler maps incoming `PluginMessage` types to store actions:

| Message Type | Store Action |
|-------------|-------------|
| `CATALOG_DATA` | `setCatalogData(message.payload.designSystems)` |
| `PLACEMENT_STARTED` | `startPlacement()` |
| `PLACEMENT_COMPLETE` | `completePlacement(message.payload.nodeName, message.payload.warnings)` |
| `PLACEMENT_ERROR` | `failPlacement(message.payload.error)` |

#### SearchBar Component

| Current Prop | Replaced By |
|-------------|-------------|
| `onSearch: (query: string) => void` | `useAppStore((s) => s.setSearchQuery)` |
| Internal `value` state | Local state remains for debounced input; debounced value syncs to `store.setSearchQuery` |

#### ResultsList Component

| Current Prop | Replaced By |
|-------------|-------------|
| `results: SearchResult[]` | `useFilteredComponents()` selector + Fuse.js search in component |
| `query: string` | `useAppStore((s) => s.searchQuery)` |
| `onComponentPlace` callback | `useAppStore((s) => s.startPlacement)` + `sendMessage()` |
| `onComponentClick` callback | `useAppStore((s) => s.openDetail)` |

### Non-Functional Constraints

- **Thread safety**: N/A (single-threaded browser environment)
- **Persistence**: None. Store is ephemeral and resets on plugin close/reload.
- **Serialization**: Store state is not serialized. `Set<string>` and `Fuse` instances do not need JSON compatibility.
- **Devtools**: No Zustand devtools middleware in initial implementation. Can be added later without API changes.
