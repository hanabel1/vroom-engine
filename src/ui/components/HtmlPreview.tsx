import { useEffect, useRef, useState } from 'react';

export interface HtmlPreviewProps {
  html: string;
  className?: string;
  showDimensions?: boolean;
  previewState?: 'default' | 'hover' | 'focus' | 'disabled';
}

export function HtmlPreview({ html, className, showDimensions = false, previewState }: HtmlPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content || !html) return;

    const measure = () => {
      const root = content.firstElementChild as HTMLElement | null;
      if (!root) return;

      // Reset transform so we can measure natural size
      root.style.transform = 'none';
      const contentW = root.offsetWidth;
      const contentH = root.offsetHeight;

      if (contentW > 0 && contentH > 0) {
        const boxW = container.offsetWidth - 32;
        const boxH = container.offsetHeight - 32;
        const scale = Math.min(boxW / contentW, boxH / contentH, 1);
        root.style.transform = `scale(${scale})`;
        root.style.transformOrigin = 'center center';

        if (showDimensions) {
          setDimensions({ width: Math.round(contentW), height: Math.round(contentH) });
        }
      }
    };

    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [html, showDimensions]);

  return (
    <div
      className={className ? `html-preview ${className}` : 'html-preview'}
      ref={containerRef}
      data-preview-state={previewState ?? undefined}
    >
      <div
        ref={contentRef}
        className="html-preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {showDimensions && dimensions && (
        <span className="html-preview-dimensions">
          {dimensions.width} x {dimensions.height}
        </span>
      )}
    </div>
  );
}
