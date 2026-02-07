import { describe, it, expect } from 'vitest';
import { classifyElement, type ParsedElement } from '../../src/plugin/converter/parser';

describe('classifyElement', () => {
  it('classifies input elements as input', () => {
    const element: ParsedElement = {
      tagName: 'input',
      attributes: {},
      children: [],
    };

    expect(classifyElement(element)).toBe('input');
  });

  it('classifies elements with only text children as text', () => {
    const element: ParsedElement = {
      tagName: 'div',
      attributes: {},
      children: ['Hello'],
      textContent: 'Hello',
    };

    expect(classifyElement(element)).toBe('text');
  });

  it('classifies elements with child elements as frame', () => {
    const element: ParsedElement = {
      tagName: 'div',
      attributes: {},
      children: [
        {
          tagName: 'span',
          attributes: {},
          children: ['Nested'],
          textContent: 'Nested',
        },
      ],
    };

    expect(classifyElement(element)).toBe('frame');
  });

  it('skips non-renderable tags', () => {
    const element: ParsedElement = {
      tagName: 'script',
      attributes: {},
      children: [],
    };

    expect(classifyElement(element)).toBe('skip');
  });
});
