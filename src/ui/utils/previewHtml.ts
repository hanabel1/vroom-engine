function isScaffoldElement(element: Element): boolean {
  const className = (element.getAttribute('class') || '').toLowerCase();
  
  // Figma wrappers
  if (className.includes('ant-design-example-wrapper') || 
      className.includes('sandbox-stage') || 
      className.includes('freeze-motion')) {
    return true;
  }

  const style = (element.getAttribute('style') || '').toLowerCase();
  if (style.includes('display: contents')) {
    return true;
  }

  return false;
}

function findPreferredPreviewRoot(root: Element): Element {
  const explicitExampleWrapper = root.querySelector('[class*="example-wrapper"]');
  if (explicitExampleWrapper) {
    return explicitExampleWrapper;
  }

  let candidate = root;

  // Collapse nested scaffolding wrappers to the first meaningful content root.
  for (let i = 0; i < 8; i++) {
    if (!isScaffoldElement(candidate)) break;

    if (candidate.children.length === 1 && candidate.firstElementChild) {
      candidate = candidate.firstElementChild;
      continue;
    }

    const nonScaffoldChild = Array.from(candidate.children).find((child) => !isScaffoldElement(child));
    if (nonScaffoldChild) {
      candidate = nonScaffoldChild;
    }
    break;
  }

  return candidate;
}

export function optimizePreviewHtml(html: string): string {
  if (!html) return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const root = doc.body.firstElementChild;
    if (!root) return html;

    const previewRoot = findPreferredPreviewRoot(root);
    return previewRoot.outerHTML || html;
  } catch {
    return html;
  }
}
