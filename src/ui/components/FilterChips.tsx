import { Badge, View } from 'reshaped';
import { useDesignSystemOptions } from '@/ui/selectors';
import { useAppStore } from '@/ui/store';

export function FilterChips() {
  const designSystems = useDesignSystemOptions();
  const activeFilters = useAppStore((state) => state.activeFilters);

  const isAllSelected = activeFilters.length === 0;

  const handleFilterClick = (systemId: string | null) => {
    if (systemId === null) {
      // "All" clicked - clear filters
      useAppStore.getState().setActiveFilters([]);
    } else {
      // Single system filter
      useAppStore.getState().setActiveFilters([systemId]);
    }
  };

  return (
    <View direction="row" gap={2} wrap>
      <Badge
        variant="outline"
        color={isAllSelected ? 'primary' : 'neutral'}
        highlighted={isAllSelected}
        onClick={() => handleFilterClick(null)}
      >
        All
      </Badge>
      {designSystems.map((system) => {
        const isSelected = activeFilters.includes(system.id);
        return (
          <Badge
            key={system.id}
            variant="outline"
            color={isSelected ? 'primary' : 'neutral'}
            highlighted={isSelected}
            onClick={() => handleFilterClick(system.id)}
          >
            {system.name}
          </Badge>
        );
      })}
    </View>
  );
}
