import { useEffect, useRef, useState } from 'react';

export interface HtmlPreviewProps {
  html: string;
  className?: string;
  showDimensions?: boolean;
}

/**
 * Renders component HTML in a div and optionally shows dimensions.
 * Reusable for detail view and (later) search result thumbnails.
 */
export function HtmlPreview({ html, className, showDimensions = true }: HtmlPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!showDimensions || !containerRef.current || !html) return;

    const contentEl = containerRef.current.querySelector('.html-preview-content');
    const root = contentEl?.firstElementChild as HTMLElement | null;
    if (!root) return;

    const measure = () => {
      if (root.offsetWidth && root.offsetHeight) {
        setDimensions({ width: Math.round(root.offsetWidth), height: Math.round(root.offsetHeight) });
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [html, showDimensions]);

  return (
    <div className={className ? `html-preview ${className}` : 'html-preview'} ref={containerRef}>
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
