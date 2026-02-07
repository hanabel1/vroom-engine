import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/ui/store';
import type { DesignSystem, Component } from '@/ui/types/catalog';
import type { SearchableComponent } from '@/ui/hooks/useSearch';

/**
 * Returns only the design systems whose IDs are in enabledSystemIds.
 * Re-renders only when the filtered result changes (shallow comparison).
 */
export function useEnabledSystems(): DesignSystem[] {
  return useAppStore(
    useShallow((state) =>
      state.designSystems.filter((ds) => state.enabledSystemIds.has(ds.id))
    )
  );
}

/**
 * Returns the full Component object matching activeComponent.id and activeComponent.designSystemId.
 * Returns null when no component is selected or when the referenced component is not found.
 */
export function useActiveComponent(): Component | null {
  return useAppStore((state) => {
    if (!state.activeComponent) {
      return null;
    }

    const designSystem = state.designSystems.find(
      (ds) => ds.id === state.activeComponent!.designSystemId
    );

    if (!designSystem) {
      return null;
    }

    const component = designSystem.components.find(
      (c) => c.id === state.activeComponent!.id
    );

    return component || null;
  });
}

/**
 * Returns a flattened array of all components from enabled systems, each augmented
 * with designSystemId and designSystemName. When activeFilters is non-empty, further
 * restricts to only those design system IDs. Returns the full unfiltered list when
 * activeFilters is empty.
 */
export function useFilteredComponents(): SearchableComponent[] {
  const designSystems = useAppStore((state) => state.designSystems);
  const enabledSystemIds = useAppStore((state) => state.enabledSystemIds);
  const activeFilters = useAppStore((state) => state.activeFilters);

  return useMemo(() => {
    // Get enabled systems
    const enabledSystems = designSystems.filter((ds) =>
      enabledSystemIds.has(ds.id)
    );

    // Apply active filters if any
    const systemsToUse =
      activeFilters.length > 0
        ? enabledSystems.filter((ds) => activeFilters.includes(ds.id))
        : enabledSystems;

    // Flatten components with metadata
    const components: SearchableComponent[] = [];
    for (const designSystem of systemsToUse) {
      for (const component of designSystem.components) {
        components.push({
          ...component,
          designSystemId: designSystem.id,
          designSystemName: designSystem.name,
        });
      }
    }

    return components;
  }, [designSystems, enabledSystemIds, activeFilters]);
}

/**
 * Returns the list of design systems available for filter chips.
 * Each system includes id and name for rendering.
 * Memoized — recomputes only when designSystems changes.
 */
export interface DesignSystemOption {
  id: string;
  name: string;
}

export function useDesignSystemOptions(): DesignSystemOption[] {
  const designSystems = useAppStore((state) => state.designSystems);

  return useMemo(() => {
    return designSystems.map((ds) => ({
      id: ds.id,
      name: ds.name,
    }));
  }, [designSystems]);
}
