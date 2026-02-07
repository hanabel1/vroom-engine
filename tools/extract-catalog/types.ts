import type { ComponentType, ReactElement, ReactNode } from 'react';

export type Category = 'input' | 'display' | 'navigation' | 'feedback' | 'layout' | 'surface';

export interface ComponentEntry {
  name: string;
  aliases?: string[];
  category: Category;
  description?: string;
  element: ReactElement;
  variants?: Record<string, ReactElement>;
}

export interface ComponentRegistry {
  systemId: string;
  systemName: string;
  version: string;
  sourceUrl?: string;
  /** Optional React wrapper (e.g. ThemeProvider) rendered around each component during extraction. */
  wrapper?: ComponentType<{ children: ReactNode }>;
  components: Record<string, ComponentEntry>;
}

export interface StyleFilterConfig {
  allowlist: string[];
  denylist: string[];
}
