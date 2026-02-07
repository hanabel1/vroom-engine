import { describe, it, expect } from 'vitest';
import { parseInlineStyles } from '../../src/plugin/converter/styles';

describe('parseInlineStyles', () => {
  it('parses box-shadow into structured data', () => {
    const styles = parseInlineStyles('box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);');

    expect(styles.boxShadow?.length).toBe(1);
    expect(styles.boxShadow?.[0]).toMatchObject({
      offsetX: 0,
      offsetY: 1,
      blur: 2,
      spread: 0,
    });
    expect(styles.boxShadow?.[0]?.color?.a).toBeCloseTo(0.1);
  });

  it('supports text-transform and unitless line-height', () => {
    const styles = parseInlineStyles('font-size: 16px; line-height: 1.5; text-transform: uppercase;');

    expect(styles.textTransform).toBe('uppercase');
    expect(styles.lineHeight).toBe(24);
  });

  it('parses margin shorthand values', () => {
    const styles = parseInlineStyles('margin: 4px 8px 12px 16px;');

    expect(styles.margin).toEqual({ top: 4, right: 8, bottom: 12, left: 16 });
  });
});
