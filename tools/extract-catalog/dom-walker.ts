import { diffStyles } from './style-filter';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const serializeStyles = (styles: Record<string, string>) => {
  const entries = Object.entries(styles);
  if (entries.length === 0) {
    return '';
  }

  const serialized = entries.map(([property, value]) => `${property}: ${value};`).join(' ');
  return ` style="${serialized}"`;
};

const warnedPseudoElements = new WeakSet<Element>();

const hasPseudoContent = (element: Element, pseudo: '::before' | '::after') => {
  try {
    const content = window.getComputedStyle(element, pseudo).content;
    return content && content !== 'none' && content !== '""';
  } catch {
    return false;
  }
};

const warnPseudoElements = (element: Element) => {
  if (warnedPseudoElements.has(element)) {
    return;
  }

  const hasBefore = hasPseudoContent(element, '::before');
  const hasAfter = hasPseudoContent(element, '::after');

  if (!hasBefore && !hasAfter) {
    return;
  }

  const identifier = element.className ? ` class="${element.className}"` : '';
  console.warn(
    `[extract-catalog] Pseudo-element content detected on <${element.tagName.toLowerCase()}${identifier}>. Pseudo-elements are skipped.`,
  );
  warnedPseudoElements.add(element);
};

const getBaselineStyles = (element: Element) => {
  const doc = element.ownerDocument;
  if (!doc) {
    return window.getComputedStyle(element);
  }

  const baseline = doc.createElement(element.tagName.toLowerCase());
  const container = element.parentElement ?? doc.body;

  if (!container) {
    return window.getComputedStyle(element);
  }

  container.appendChild(baseline);
  const baselineStyles = window.getComputedStyle(baseline);
  baseline.remove();
  return baselineStyles;
};

export const walkDOM = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent ?? '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();
  warnPseudoElements(element);
  const computedStyles = window.getComputedStyle(element);
  const baselineStyles = getBaselineStyles(element);
  const diff = diffStyles(computedStyles, baselineStyles);

  const childrenHtml = Array.from(element.childNodes)
    .map((child) => walkDOM(child))
    .join('');

  return `<${tagName}${serializeStyles(diff)}>${childrenHtml}</${tagName}>`;
};
