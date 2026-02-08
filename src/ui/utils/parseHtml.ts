/**
 * Parsed element shape sent to plugin for HTML → Figma conversion.
 */
export interface ParsedElement {
  tagName: string;
  attributes: Record<string, string>;
  children: (ParsedElement | string)[];
  textContent?: string;
}

/**
 * Parse HTML string in UI thread (DOMParser available) into a tree
 * suitable for the plugin's converter.
 */
export function parseHTMLInUI(html: string): ParsedElement | null {
  if (!html.trim()) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  if (!body.firstChild) return null;

  const result = parseElement(body.firstChild as Element);
  return typeof result === 'object' && result !== null && 'tagName' in result ? result : null;
}

function parseElement(element: Node): ParsedElement | string | null {
  if (element.nodeType === Node.TEXT_NODE) {
    const text = element.textContent?.trim() || '';
    return text ? text : null;
  }

  if (element.nodeType !== Node.ELEMENT_NODE) return null;

  const el = element as Element;
  const tagName = el.tagName.toLowerCase();

  if (tagName === 'script' || tagName === 'style') return null;

  const attributes: Record<string, string> = {};
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    attributes[attr.name] = attr.value;
  }

  const children: (ParsedElement | string)[] = [];
  for (let i = 0; i < el.childNodes.length; i++) {
    const child = parseElement(el.childNodes[i]);
    if (child) children.push(child);
  }

  return {
    tagName,
    attributes,
    children,
    textContent: el.textContent || undefined,
  };
}
