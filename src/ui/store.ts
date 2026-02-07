import { create } from 'zustand';
import type { DesignSystem } from '@/ui/types/catalog';

// ============================================================================
// Store Interface
// ============================================================================

export interface AppStore {
  // -- Catalog slice --
  designSystems: DesignSystem[];
  enabledSystemIds: Set<string>;
  isLoading: boolean;
  setCatalogData: (systems: DesignSystem[]) => void;
  toggleSystem: (systemId: string, enabled: boolean) => void;

  // -- UI slice --
  view: 'browse' | 'detail' | 'manage';
  activeComponent: { id: string; designSystemId: string } | null;
  searchQuery: string;
  activeFilters: string[];
  currentPage: number;
  setView: (view: AppStore['view']) => void;
  setActiveComponent: (comp: AppStore['activeComponent']) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilters: (filters: string[]) => void;
  setCurrentPage: (page: number) => void;
  openDetail: (componentId: string, designSystemId: string) => void;
  goBack: () => void;

  // -- Placement slice --
  placementStatus: 'idle' | 'placing' | 'success' | 'error';
  placementError: string | null;
  placementWarnings: string[];
  startPlacement: () => void;
  completePlacement: (nodeName: string, warnings: string[]) => void;
  failPlacement: (error: string) => void;
  resetPlacement: () => void;
}

// ============================================================================
// Store Creation
// ============================================================================

export const useAppStore = create<AppStore>()((set) => ({
  // -- Catalog slice state --
  designSystems: [],
  enabledSystemIds: new Set<string>(),
  isLoading: true,

  // -- Catalog slice actions --
  setCatalogData: (systems) =>
    set({
      designSystems: systems,
      enabledSystemIds: new Set(systems.map((s) => s.id)),
      isLoading: false,
    }),

  toggleSystem: (systemId, enabled) =>
    set((state) => {
      const next = new Set(state.enabledSystemIds);
      if (enabled) {
        next.add(systemId);
      } else {
        next.delete(systemId);
      }
      return { enabledSystemIds: next };
    }),

  // -- UI slice state --
  view: 'browse',
  activeComponent: null,
  searchQuery: '',
  activeFilters: [],
  currentPage: 1,

  // -- UI slice actions --
  setView: (view) => set({ view }),

  setActiveComponent: (comp) => set({ activeComponent: comp }),

  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),

  setActiveFilters: (filters) => set({ activeFilters: filters, currentPage: 1 }),

  setCurrentPage: (page) => set({ currentPage: page }),

  openDetail: (componentId, designSystemId) =>
    set({
      view: 'detail',
      activeComponent: { id: componentId, designSystemId },
    }),

  goBack: () =>
    set({
      view: 'browse',
      activeComponent: null,
    }),

  // -- Placement slice state --
  placementStatus: 'idle',
  placementError: null,
  placementWarnings: [],

  // -- Placement slice actions --
  startPlacement: () =>
    set({
      placementStatus: 'placing',
      placementError: null,
      placementWarnings: [],
    }),

  completePlacement: (nodeName, warnings) =>
    set({
      placementStatus: 'success',
      placementWarnings: warnings,
    }),

  failPlacement: (error) =>
    set({
      placementStatus: 'error',
      placementError: error,
    }),

  resetPlacement: () =>
    set({
      placementStatus: 'idle',
      placementError: null,
      placementWarnings: [],
    }),
}));
