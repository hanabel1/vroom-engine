import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAppStore } from '@/ui/store';
import {
  useEnabledSystems,
  useActiveComponent,
  useFilteredComponents,
} from '@/ui/selectors';
import type { DesignSystem } from '@/ui/types/catalog';

describe('Selectors', () => {
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

  const mockSystems: DesignSystem[] = [
    {
      id: 'mui',
      name: 'Material UI',
      version: '5.0.0',
      components: [
        {
          id: 'button',
          name: 'Button',
          category: 'input',
          previewUrl: '',
          html: '<button>Click me</button>',
        },
        {
          id: 'textfield',
          name: 'TextField',
          category: 'input',
          previewUrl: '',
          html: '<input type="text" />',
        },
      ],
    },
    {
      id: 'spectrum',
      name: 'Adobe Spectrum',
      version: '3.0.0',
      components: [
        {
          id: 'action-button',
          name: 'ActionButton',
          category: 'input',
          previewUrl: '',
          html: '<button>Action</button>',
        },
      ],
    },
  ];

  describe('useEnabledSystems', () => {
    it('returns only enabled design systems', () => {
      useAppStore.setState({
        designSystems: mockSystems,
        enabledSystemIds: new Set(['mui']),
      });

      const { result } = renderHook(() => useEnabledSystems());

      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe('mui');
      expect(result.current[0].name).toBe('Material UI');
    });

    it('returns empty array when no systems are enabled', () => {
      useAppStore.setState({
        designSystems: mockSystems,
        enabledSystemIds: new Set(),
      });

      const { result } = renderHook(() => useEnabledSystems());

      expect(result.current).toHaveLength(0);
    });

    it('returns all systems when all are enabled', () => {
      useAppStore.setState({
        designSystems: mockSystems,
        enabledSystemIds: new Set(['mui', 'spectrum']),
      });

      const { result } = renderHook(() => useEnabledSystems());

      expect(result.current).toHaveLength(2);
    });
  });

  describe('useActiveComponent', () => {
    it('returns the full Component object when activeComponent is set', () => {
      useAppStore.setState({
        designSystems: mockSystems,
        activeComponent: { id: 'button', designSystemId: 'mui' },
      });

      const { result } = renderHook(() => useActiveComponent());

      expect(result.current).not.toBeNull();
      expect(result.current?.id).toBe('button');
      expect(result.current?.name).toBe('Button');
      expect(result.current?.category).toBe('input');
    });

    it('returns null when activeComponent is null', () => {
      useAppStore.setState({
        designSystems: mockSystems,
        activeComponent: null,
      });

      const { result } = renderHook(() => useActiveComponent());

      expect(result.current).toBeNull();
    });

    it('returns null when component is not found', () => {
      useAppStore.setState({
        designSystems: mockSystems,
        activeComponent: { id: 'nonexistent', designSystemId: 'mui' },
      });

      const { result } = renderHook(() => useActiveComponent());

      expect(result.current).toBeNull();
    });

    it('returns null when design system is not found', () => {
      useAppStore.setState({
        designSystems: mockSystems,
        activeComponent: { id: 'button', designSystemId: 'nonexistent' },
      });

      const { result } = renderHook(() => useActiveComponent());

      expect(result.current).toBeNull();
    });
  });

  describe('useFilteredComponents', () => {
    it('flattens all components from enabled systems', () => {
      useAppStore.setState({
        designSystems: mockSystems,
        enabledSystemIds: new Set(['mui', 'spectrum']),
        activeFilters: [],
      });

      const { result } = renderHook(() => useFilteredComponents());

      expect(result.current).toHaveLength(3); // 2 from MUI + 1 from Spectrum
      expect(result.current[0].designSystemId).toBe('mui');
      expect(result.current[0].designSystemName).toBe('Material UI');
      expect(result.current[2].designSystemId).toBe('spectrum');
      expect(result.current[2].designSystemName).toBe('Adobe Spectrum');
    });

    it('applies activeFilters when non-empty', () => {
      useAppStore.setState({
        designSystems: mockSystems,
        enabledSystemIds: new Set(['mui', 'spectrum']),
        activeFilters: ['mui'], // Only MUI
      });

      const { result } = renderHook(() => useFilteredComponents());

      expect(result.current).toHaveLength(2); // Only MUI components
      expect(result.current[0].designSystemId).toBe('mui');
      expect(result.current[1].designSystemId).toBe('mui');
    });

    it('returns empty array when no systems are enabled', () => {
      useAppStore.setState({
        designSystems: mockSystems,
        enabledSystemIds: new Set(),
        activeFilters: [],
      });

      const { result } = renderHook(() => useFilteredComponents());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array when activeFilters exclude all enabled systems', () => {
      useAppStore.setState({
        designSystems: mockSystems,
        enabledSystemIds: new Set(['mui']),
        activeFilters: ['spectrum'], // Only Spectrum, but MUI is enabled
      });

      const { result } = renderHook(() => useFilteredComponents());

      expect(result.current).toHaveLength(0);
    });

    it('returns all enabled components when activeFilters is empty', () => {
      useAppStore.setState({
        designSystems: mockSystems,
        enabledSystemIds: new Set(['mui']),
        activeFilters: [], // No filters
      });

      const { result } = renderHook(() => useFilteredComponents());

      expect(result.current).toHaveLength(2); // All MUI components
    });
  });
});
