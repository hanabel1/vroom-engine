// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { walkDOM } from '../../tools/extract-catalog/dom-walker';

const mount = (element: HTMLElement) => {
  document.body.appendChild(element);
  return () => element.remove();
};

describe('walkDOM', () => {
  it('serializes a single element with inline styles', () => {
    const element = document.createElement('div');
    element.style.color = 'rgb(1, 2, 3)';

    const unmount = mount(element);
    const html = walkDOM(element);
    unmount();

    expect(html).toContain('<div');
    expect(html).toContain('color: rgb(1, 2, 3)');
  });

  it('serializes nested children', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    child.textContent = 'Nested';
    parent.appendChild(child);

    const unmount = mount(parent);
    const html = walkDOM(parent);
    unmount();

    expect(html).toContain('<span');
    expect(html).toContain('Nested');
  });

  it('preserves text nodes', () => {
    const element = document.createElement('p');
    element.appendChild(document.createTextNode('Hello'));

    const unmount = mount(element);
    const html = walkDOM(element);
    unmount();

    expect(html).toContain('Hello');
  });

  it('skips pseudo-element content', () => {
    const style = document.createElement('style');
    style.textContent = '.with-before::before { content: "Pseudo"; }';
    document.head.appendChild(style);

    const element = document.createElement('div');
    element.className = 'with-before';

    const unmount = mount(element);
    const html = walkDOM(element);
    unmount();

    expect(html).not.toContain('Pseudo');
  });
});
