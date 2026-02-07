import { useState, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import type { DesignSystem, Component } from '../types/catalog';

export interface SearchableComponent extends Component {
  designSystemId: string;
  designSystemName: string;
}

export interface SearchResult {
  item: SearchableComponent;
  score?: number;
  matches?: readonly Fuse.FuseResultMatch[];
}

const FUSE_OPTIONS: Fuse.IFuseOptions<SearchableComponent> = {
  keys: [
    { name: 'name', weight: 2.0 },
    { name: 'aliases', weight: 1.5 },
    { name: 'category', weight: 0.8 },
    { name: 'designSystemName', weight: 0.5 },
    { name: 'props.name', weight: 0.7 },
  ],
  threshold: 0.4,
  distance: 100,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  shouldSort: true,
};

export function useSearch(catalogData: DesignSystem[]) {
  const [query, setQuery] = useState('');

  // Flatten all components from all design systems
  const searchableComponents = useMemo(() => {
    const components: SearchableComponent[] = [];
    
    for (const designSystem of catalogData) {
      for (const component of designSystem.components) {
        components.push({
          ...component,
          designSystemId: designSystem.id,
          designSystemName: designSystem.name,
        });
      }
    }
    
    return components;
  }, [catalogData]);

  // Create Fuse index
  const fuse = useMemo(() => {
    return new Fuse(searchableComponents, FUSE_OPTIONS);
  }, [searchableComponents]);

  // Search function
  const results = useMemo(() => {
    if (!query.trim()) {
      // Return all components when no query
      return searchableComponents.map(item => ({ item }));
    }
    
    return fuse.search(query);
  }, [query, fuse, searchableComponents]);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  return {
    query,
    search,
    results,
    totalResults: results.length,
  };
}
