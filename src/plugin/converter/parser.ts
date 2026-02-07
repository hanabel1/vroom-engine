// Type definitions for HTML parsing
// Note: HTML parsing is now done in the UI thread where DOMParser is available
// The parsed structure is then sent to the sandbox via postMessage

export interface ParsedElement {
  tagName: string;
  attributes: Record<string, string>;
  children: (ParsedElement | string)[];
  textContent?: string;
}

// Classify element type for Figma mapping
export function classifyElement(element: ParsedElement): 'frame' | 'text' | 'skip' | 'input' {
  const { tagName, children } = element;

  const skipTags = new Set([
    'br', 'hr', 'script', 'style', 'meta', 'link',
    // SVG elements — cannot be meaningfully converted to Figma frames
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
    'g', 'defs', 'clippath', 'use',
  ]);
  if (skipTags.has(tagName)) {
    return 'skip';
  }

  if (tagName === 'input') {
    return 'input';
  }

  // Elements with only text children
  const hasOnlyTextChildren = children.length > 0 && children.every((child) => typeof child === 'string');
  if (hasOnlyTextChildren) {
    return 'text';
  }

  // Pure text nodes with no children
  if (children.length === 0 && element.textContent) {
    return 'text';
  }

  return 'frame';
}
