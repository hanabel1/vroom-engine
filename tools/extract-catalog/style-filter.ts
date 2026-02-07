import type { StyleFilterConfig } from './types';

export const STYLE_ALLOWLIST: StyleFilterConfig['allowlist'] = [
  'display',
  'flex-direction',
  'align-items',
  'justify-content',
  'gap',
  'overflow',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'background-color',
  'color',
  'opacity',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-radius',
  'box-shadow',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-transform',
  'text-align',
  'text-decoration',
  'white-space',
];

export const STYLE_DENYLIST: StyleFilterConfig['denylist'] = [
  'cursor',
  'transition',
  'animation',
  'pointer-events',
  'user-select',
];

const isDeniedProperty = (property: string) =>
  STYLE_DENYLIST.includes(property) || property.startsWith('-webkit-');

export const diffStyles = (
  computed: CSSStyleDeclaration,
  baseline: CSSStyleDeclaration,
): Record<string, string> => {
  const diff: Record<string, string> = {};

  for (const property of STYLE_ALLOWLIST) {
    if (isDeniedProperty(property)) {
      continue;
    }

    const value = computed.getPropertyValue(property).trim();
    const baselineValue = baseline.getPropertyValue(property).trim();

    if (!value || value === baselineValue) {
      continue;
    }

    diff[property] = value;
  }

  return diff;
};
