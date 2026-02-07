/**
 * Alias Resolver Service
 * 
 * Provides bidirectional alias expansion for UI component search.
 * Each alias group contains synonymous terms (e.g., "combobox", "autocomplete", "typeahead").
 * When a user searches for any term in a group, the resolver returns all synonyms in that group.
 */

export interface AliasResolver {
  /**
   * Given a search term, returns all synonymous terms from the alias database.
   * If the term is not in any alias group, returns [term] (the original only).
   * Matching is case-insensitive.
   */
  expand(term: string): string[];

  /**
   * Given a multi-word query string, expands each word independently
   * and returns the deduplicated union of all expanded terms.
   */
  expandQuery(query: string): string[];
}

/**
 * Factory function that builds a lookup index from the raw alias groups array.
 * 
 * @param aliasGroups - Array of string arrays, where each inner array is a group of synonyms
 * @returns AliasResolver instance with expand() and expandQuery() methods
 */
export function createAliasResolver(aliasGroups: string[][]): AliasResolver {
  // Build lookup index: Map<lowercase term, full group array>
  const index = new Map<string, string[]>();

  for (const group of aliasGroups) {
    if (group.length < 2) {
      console.warn('[AliasResolver] Skipping group with < 2 terms:', group);
      continue;
    }

    // Store lowercase versions for case-insensitive matching
    const normalizedGroup = group.map((term) => term.toLowerCase());

    // Each term in the group maps to the full group
    for (const term of normalizedGroup) {
      if (index.has(term)) {
        console.warn('[AliasResolver] Duplicate term across groups:', term);
      }
      index.set(term, normalizedGroup);
    }
  }

  return {
    expand(term: string): string[] {
      if (!term) return [];
      
      const normalized = term.toLowerCase().trim();
      const group = index.get(normalized);
      
      // Return full group if found, otherwise return the original term
      return group ? group : [normalized];
    },

    expandQuery(query: string): string[] {
      if (!query) return [];

      // Split query into words, expand each word, collect all results
      const words = query.trim().split(/\s+/);
      const allExpanded = new Set<string>();

      for (const word of words) {
        if (!word) continue;
        const expanded = this.expand(word);
        for (const term of expanded) {
          allExpanded.add(term);
        }
      }

      return Array.from(allExpanded);
    },
  };
}
