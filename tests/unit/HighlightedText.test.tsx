import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HighlightedText } from '../../src/ui/components/HighlightedText';
import type Fuse from 'fuse.js';

describe('HighlightedText', () => {
  it('renders plain text when no matches provided', () => {
    render(<HighlightedText text="Button Component" matches={undefined} fieldName="name" />);
    
    expect(screen.getByText('Button Component')).toBeInTheDocument();
  });

  it('renders plain text when matches is empty array', () => {
    render(<HighlightedText text="Button Component" matches={[]} fieldName="name" />);
    
    expect(screen.getByText('Button Component')).toBeInTheDocument();
  });

  it('renders plain text when no matching field in matches', () => {
    const matches: readonly Fuse.FuseResultMatch[] = [
      {
        indices: [[0, 3]],
        value: 'Some other value',
        key: 'category',
        refIndex: 0,
      },
    ];
    
    render(<HighlightedText text="Button Component" matches={matches} fieldName="name" />);
    
    expect(screen.getByText('Button Component')).toBeInTheDocument();
  });

  it('highlights matched portions when field matches', () => {
    const matches: readonly Fuse.FuseResultMatch[] = [
      {
        indices: [[0, 5]], // "Button" -> indices [0, 5]
        value: 'Button Component',
        key: 'name',
        refIndex: 0,
      },
    ];
    
    const { container } = render(
      <HighlightedText text="Button Component" matches={matches} fieldName="name" />
    );
    
    const mark = container.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toBe('Button');
  });

  it('highlights multiple match ranges in the same text', () => {
    const matches: readonly Fuse.FuseResultMatch[] = [
      {
        indices: [[0, 2], [7, 11]], // "But" and "Compo"
        value: 'Button Component',
        key: 'name',
        refIndex: 0,
      },
    ];
    
    const { container } = render(
      <HighlightedText text="Button Component" matches={matches} fieldName="name" />
    );
    
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    expect(marks[0]?.textContent).toBe('But');
    expect(marks[1]?.textContent).toBe('Compo');
  });
});
