// HTML parser using DOMParser

export interface ParsedElement {
  tagName: string;
  attributes: Record<string, string>;
  children: (ParsedElement | string)[];
  textContent?: string;
}

// Parse HTML string into tree structure
export function parseHTML(html: string): ParsedElement | null {
  if (!html || !html.trim()) return null;
  
  // Create a temporary div to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;
  
  if (!body.firstChild) return null;
  
  return parseElement(body.firstChild as Element);
}

function parseElement(element: Node): ParsedElement | string | null {
  // Text node
  if (element.nodeType === Node.TEXT_NODE) {
    const text = element.textContent?.trim() || '';
    return text ? text : null;
  }
  
  // Element node
  if (element.nodeType === Node.ELEMENT_NODE) {
    const el = element as Element;
    const tagName = el.tagName.toLowerCase();
    
    // Skip script and style tags
    if (tagName === 'script' || tagName === 'style') {
      return null;
    }
    
    const attributes: Record<string, string> = {};
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      attributes[attr.name] = attr.value;
    }
    
    const children: (ParsedElement | string)[] = [];
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = parseElement(el.childNodes[i]);
      if (child) {
        children.push(child);
      }
    }
    
    return {
      tagName,
      attributes,
      children,
      textContent: el.textContent || undefined,
    };
  }
  
  return null;
}

// Classify element type for Figma mapping
export function classifyElement(element: ParsedElement): 'frame' | 'text' | 'skip' {
  const { tagName, children } = element;
  
  // Text elements
  if (['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label'].includes(tagName)) {
    // Check if it has only text children
    const hasOnlyText = children.every(child => typeof child === 'string');
    if (hasOnlyText) {
      return 'text';
    }
  }
  
  // Pure text nodes with no children
  if (children.length === 0 && element.textContent) {
    return 'text';
  }
  
  // Container elements
  if (['div', 'section', 'button', 'article', 'main', 'header', 'footer', 'nav'].includes(tagName)) {
    return 'frame';
  }
  
  // Input elements (create as frames with placeholder text)
  if (tagName === 'input') {
    return 'frame';
  }
  
  // Default to frame for unknown elements
  return 'frame';
}
