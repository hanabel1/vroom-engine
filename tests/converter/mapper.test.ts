import { describe, it, expect, beforeEach } from 'vitest';
import { mapElementToFigmaNode } from '../../src/plugin/converter/mapper';
import type { ParsedElement } from '../../src/plugin/converter/parser';

function createFrameMock() {
  return {
    type: 'FRAME',
    children: [] as any[],
    appendChild(child: any) {
      this.children.push(child);
    },
    resize(width: number, height: number) {
      this.width = width;
      this.height = height;
    },
  };
}

function createTextMock() {
  return {
    type: 'TEXT',
    characters: '',
  };
}

describe('mapElementToFigmaNode', () => {
  beforeEach(() => {
    (globalThis as any).figma = {
      createFrame: createFrameMock,
      createText: createTextMock,
      loadFontAsync: async () => {},
    };
  });

  it('maps flex alignment and text-transform for a button', async () => {
    const element: ParsedElement = {
      tagName: 'button',
      attributes: {
        style:
          'display: inline-flex; align-items: center; justify-content: center; padding: 6px 16px; ' +
          'font-family: Roboto, sans-serif; font-size: 14px; font-weight: 500; line-height: 24px; ' +
          'letter-spacing: 0.4px; color: #ffffff; background-color: #1976d2; border: none; ' +
          'border-radius: 4px; text-transform: uppercase; min-width: 64px;',
      },
      children: ['Button'],
      textContent: 'Button',
    };

    const node = await mapElementToFigmaNode(element);
    const frame = node as any;
    const textNode = frame.children[0] as any;

    expect(frame.primaryAxisAlignItems).toBe('CENTER');
    expect(frame.counterAxisAlignItems).toBe('CENTER');
    expect(textNode.characters).toBe('BUTTON');
  });

  it('maps box-shadow to effects', async () => {
    const element: ParsedElement = {
      tagName: 'div',
      attributes: {
        style: 'box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);',
      },
      children: [],
    };

    const node = await mapElementToFigmaNode(element);
    const frame = node as any;

    expect(frame.effects?.length).toBe(1);
    expect(frame.effects?.[0]?.type).toBe('DROP_SHADOW');
  });
});
