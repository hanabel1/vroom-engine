import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/ui/store';
import type { DesignSystem } from '@/ui/types/catalog';

describe('AppStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      designSystems: [],
      enabledSystemIds: new Set<string>(),
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

  describe('Catalog Slice', () => {
    it('setCatalogData populates systems and enables all by default', () => {
      const systems: DesignSystem[] = [
        {
          id: 'mui',
          name: 'Material UI',
          version: '5.0.0',
          components: [],
        },
        {
          id: 'spectrum',
          name: 'Adobe Spectrum',
          version: '3.0.0',
          components: [],
        },
      ];

      useAppStore.getState().setCatalogData(systems);

      const state = useAppStore.getState();
      expect(state.designSystems).toEqual(systems);
      expect(state.enabledSystemIds.has('mui')).toBe(true);
      expect(state.enabledSystemIds.has('spectrum')).toBe(true);
      expect(state.enabledSystemIds.size).toBe(2);
      expect(state.isLoading).toBe(false);
    });

    it('toggleSystem adds a system ID when enabled=true', () => {
      useAppStore.getState().toggleSystem('mui', true);

      const state = useAppStore.getState();
      expect(state.enabledSystemIds.has('mui')).toBe(true);
    });

    it('toggleSystem removes a system ID when enabled=false', () => {
      // First add it
      useAppStore.setState({ enabledSystemIds: new Set(['mui', 'spectrum']) });

      // Then remove it
      useAppStore.getState().toggleSystem('mui', false);

      const state = useAppStore.getState();
      expect(state.enabledSystemIds.has('mui')).toBe(false);
      expect(state.enabledSystemIds.has('spectrum')).toBe(true);
    });

    it('toggleSystem creates a new Set reference', () => {
      const initialSet = new Set(['mui']);
      useAppStore.setState({ enabledSystemIds: initialSet });

      useAppStore.getState().toggleSystem('spectrum', true);

      const newSet = useAppStore.getState().enabledSystemIds;
      expect(newSet).not.toBe(initialSet); // Different reference
      expect(newSet.has('mui')).toBe(true);
      expect(newSet.has('spectrum')).toBe(true);
    });
  });

  describe('UI Slice', () => {
    it('setView updates the view state', () => {
      useAppStore.getState().setView('detail');
      expect(useAppStore.getState().view).toBe('detail');

      useAppStore.getState().setView('manage');
      expect(useAppStore.getState().view).toBe('manage');
    });

    it('setActiveComponent updates the active component', () => {
      const comp = { id: 'button', designSystemId: 'mui' };
      useAppStore.getState().setActiveComponent(comp);

      expect(useAppStore.getState().activeComponent).toEqual(comp);
    });

    it('setSearchQuery updates the search query', () => {
      useAppStore.getState().setSearchQuery('button');
      expect(useAppStore.getState().searchQuery).toBe('button');
    });

    it('setActiveFilters updates the active filters', () => {
      useAppStore.getState().setActiveFilters(['mui', 'spectrum']);
      expect(useAppStore.getState().activeFilters).toEqual(['mui', 'spectrum']);
    });

    it('openDetail sets view and activeComponent atomically', () => {
      useAppStore.getState().openDetail('button', 'mui');

      const state = useAppStore.getState();
      expect(state.view).toBe('detail');
      expect(state.activeComponent).toEqual({
        id: 'button',
        designSystemId: 'mui',
      });
    });

    it('goBack resets to browse and clears activeComponent atomically', () => {
      // First set up a detail view
      useAppStore.setState({
        view: 'detail',
        activeComponent: { id: 'button', designSystemId: 'mui' },
      });

      // Then go back
      useAppStore.getState().goBack();

      const state = useAppStore.getState();
      expect(state.view).toBe('browse');
      expect(state.activeComponent).toBeNull();
    });
  });

  describe('Placement Slice', () => {
    it('startPlacement transitions to placing and clears previous errors', () => {
      // Set up previous error state
      useAppStore.setState({
        placementStatus: 'error',
        placementError: 'Previous error',
        placementWarnings: ['Warning 1'],
      });

      // Start new placement
      useAppStore.getState().startPlacement();

      const state = useAppStore.getState();
      expect(state.placementStatus).toBe('placing');
      expect(state.placementError).toBeNull();
      expect(state.placementWarnings).toEqual([]);
    });

    it('completePlacement records warnings and sets status to success', () => {
      const warnings = ['Warning 1', 'Warning 2'];
      useAppStore.getState().completePlacement('Button-1', warnings);

      const state = useAppStore.getState();
      expect(state.placementStatus).toBe('success');
      expect(state.placementWarnings).toEqual(warnings);
    });

    it('failPlacement records error and sets status to error', () => {
      useAppStore.getState().failPlacement('Failed to place component');

      const state = useAppStore.getState();
      expect(state.placementStatus).toBe('error');
      expect(state.placementError).toBe('Failed to place component');
    });

    it('resetPlacement returns to idle and clears all data', () => {
      // Set up error state
      useAppStore.setState({
        placementStatus: 'error',
        placementError: 'Some error',
        placementWarnings: ['Warning'],
      });

      // Reset
      useAppStore.getState().resetPlacement();

      const state = useAppStore.getState();
      expect(state.placementStatus).toBe('idle');
      expect(state.placementError).toBeNull();
      expect(state.placementWarnings).toEqual([]);
    });
  });
});
