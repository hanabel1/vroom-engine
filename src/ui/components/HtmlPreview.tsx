import { useEffect, useRef, useState } from 'react';

export interface HtmlPreviewProps {
  html: string;
  className?: string;
  showDimensions?: boolean;
  /** When set, preview is styled for this state (e.g. disabled, hover, focus) if catalog has no variant HTML. */
  previewState?: 'default' | 'hover' | 'focus' | 'disabled';
}

/**
 * Renders component HTML in a div and optionally shows dimensions.
 * Scales content to fit so wide components (e.g. Card) don't appear as a long strip.
 */
export function HtmlPreview({ html, className, showDimensions = true, previewState }: HtmlPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !html) return;

    const container = containerRef.current;
    const contentEl = container.querySelector('.html-preview-content');
    const root = contentEl?.firstElementChild as HTMLElement | null;
    if (!root) return;

    const updateScaleAndDimensions = () => {
      if (!root.isConnected) return;
      const boxW = container.offsetWidth - 32;
      const boxH = container.offsetHeight - 32;
      const contentW = root.offsetWidth;
      const contentH = root.offsetHeight;
      if (contentW > 0 && contentH > 0) {
        const scale = Math.min(boxW / contentW, boxH / contentH, 1);
        root.style.transform = `scale(${scale})`;
        root.style.transformOrigin = 'center center';
        if (showDimensions) {
          setDimensions({ width: Math.round(contentW), height: Math.round(contentH) });
        }
      }
    };

    let ro: ResizeObserver | null = null;
    const rafId = requestAnimationFrame(() => {
      updateScaleAndDimensions();
      ro = new ResizeObserver(updateScaleAndDimensions);
      ro.observe(container);
    });
    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, [html, showDimensions]);

  return (
    <div
      className={className ? `html-preview ${className}` : 'html-preview'}
      ref={containerRef}
      data-preview-state={previewState ?? undefined}
    >
      <div
        className="html-preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {showDimensions && dimensions && (
        <span className="html-preview-dimensions">
          {dimensions.width} × {dimensions.height}
        </span>
      )}
    </div>
  );
}
