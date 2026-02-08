/**
 * Parsed element shape sent to plugin for HTML → Figma conversion.
 */
export interface ParsedElement {
  tagName: string;
  attributes: Record<string, string>;
  children: (ParsedElement | string)[];
  textContent?: string;
}
