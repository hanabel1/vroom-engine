import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useAppStore } from '@/ui/store';
import { useFilteredComponents } from '@/ui/selectors';
import { createAliasResolver } from '@/ui/services/aliasResolver';
import aliasGroups from '@/catalog/aliases.json';
import type { Component } from '../types/catalog';

export interface SearchableComponent extends Component {
  designSystemId: string;
  designSystemName: string;
}

export interface SearchResult {
  item: SearchableComponent;
  score?: number;
  matches?: readonly Fuse.FuseResultMatch[];
  matchedViaAlias?: boolean;
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

// Create alias resolver instance once
const aliasResolver = createAliasResolver(aliasGroups);

// Constants
const PAGE_SIZE = 8;

export function useSearch() {
  // Read search query and pagination state from store
  const query = useAppStore((state) => state.searchQuery);
  const currentPage = useAppStore((state) => state.currentPage);

  // Get filtered components from selector (handles enabledSystemIds + activeFilters)
  const searchableComponents = useFilteredComponents();

  // Create Fuse index
  const fuse = useMemo(() => {
    return new Fuse(searchableComponents, FUSE_OPTIONS);
  }, [searchableComponents]);

  // Search function with alias expansion
  const results = useMemo(() => {
    if (!query.trim()) {
      // Return all components when no query
      return searchableComponents.map((item) => ({ item }));
    }

    // Get expanded terms from alias resolver
    const expandedTerms = aliasResolver.expandQuery(query);

    // Run search for original query
    const queryResults = fuse.search(query);

    // Run search for each expanded term (if different from original)
    const allResults: Fuse.FuseResult<SearchableComponent>[] = [...queryResults];

    for (const term of expandedTerms) {
      if (term.toLowerCase() !== query.toLowerCase()) {
        const termResults = fuse.search(term);
        allResults.push(...termResults);
      }
    }

    // Deduplicate by component identity (designSystemId + componentId)
    // Keep the best (lowest) score for each component
    const deduplicatedMap = new Map<string, SearchResult>();

    for (const fuseResult of allResults) {
      const key = `${fuseResult.item.designSystemId}:${fuseResult.item.id}`;
      const existingResult = deduplicatedMap.get(key);

      const score = fuseResult.score ?? 0;

      if (!existingResult || (existingResult.score ?? 0) > score) {
        deduplicatedMap.set(key, {
          item: fuseResult.item,
          score: fuseResult.score,
          matches: fuseResult.matches,
          matchedViaAlias: expandedTerms.length > 1, // Mark if alias expansion occurred
        });
      }
    }

    // Convert map to array and sort by score
    return Array.from(deduplicatedMap.values()).sort((a, b) => {
      const scoreA = a.score ?? 0;
      const scoreB = b.score ?? 0;
      return scoreA - scoreB; // Lower score = better match
    });
  }, [query, fuse, searchableComponents]);

  // Pagination logic
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const clampedPage = Math.max(1, Math.min(currentPage, totalPages || 1));

  const paginatedResults = useMemo(() => {
    const startIndex = (clampedPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return results.slice(startIndex, endIndex);
  }, [results, clampedPage]);

  return {
    query,
    results,
    totalResults: results.length,
    paginatedResults,
    totalPages,
    currentPage: clampedPage,
  };
}
