import { ToggleButtonGroup, ToggleButton } from 'reshaped';
import { useDesignSystemOptions } from '@/ui/selectors';
import { useAppStore } from '@/ui/store';

export function FilterChips() {
  const designSystems = useDesignSystemOptions();
  const activeFilters = useAppStore((state) => state.activeFilters);

  // Determine selected value: ["all"] when no filters, or [systemId]
  const selectedValue = activeFilters.length === 0 ? ['all'] : activeFilters;

  const handleChange = (args: { value: string[] }) => {
    const newValue = args.value[0]; // Single selection mode
    
    if (!newValue || newValue === 'all') {
      // Clear filters - show all systems
      useAppStore.getState().setActiveFilters([]);
    } else {
      // Set single system filter
      useAppStore.getState().setActiveFilters([newValue]);
    }
  };

  return (
    <ToggleButtonGroup value={selectedValue} onChange={handleChange} selectionMode="single">
      <ToggleButton value="all">All</ToggleButton>
      {designSystems.map((system) => (
        <ToggleButton key={system.id} value={system.id}>
          {system.name}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
