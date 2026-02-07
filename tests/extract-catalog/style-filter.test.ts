import { describe, it, expect } from 'vitest';
import { diffStyles } from '../../tools/extract-catalog/style-filter';

const createStyle = (values: Record<string, string>): CSSStyleDeclaration =>
  ({
    getPropertyValue: (prop: string) => values[prop] ?? '',
  }) as CSSStyleDeclaration;

describe('diffStyles', () => {
  it('returns diffs against a bare element', () => {
    const computed = createStyle({ color: 'rgb(1, 2, 3)' });
    const baseline = createStyle({ color: 'rgb(0, 0, 0)' });

    expect(diffStyles(computed, baseline)).toEqual({ color: 'rgb(1, 2, 3)' });
  });

  it('filters properties outside the allowlist', () => {
    const computed = createStyle({ color: 'rgb(1, 2, 3)', position: 'absolute' });
    const baseline = createStyle({ color: 'rgb(0, 0, 0)', position: 'static' });

    expect(diffStyles(computed, baseline)).toEqual({ color: 'rgb(1, 2, 3)' });
  });

  it('excludes denylisted properties', () => {
    const computed = createStyle({ cursor: 'pointer' });
    const baseline = createStyle({ cursor: 'auto' });

    expect(diffStyles(computed, baseline)).toEqual({});
  });
});
