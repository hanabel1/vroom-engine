import { useEffect, useRef } from 'react';
import { Card, Text, Badge, Button } from 'reshaped';
import type { SearchableComponent } from '../hooks/useSearch';
import type Fuse from 'fuse.js';
import { HighlightedText } from './HighlightedText';

interface ResultCardProps {
  component: SearchableComponent;
  matches?: readonly Fuse.FuseResultMatch[];
  onClick?: () => void;
}

const PREVIEW_PADDING = 16;

export function ResultCard({ component, matches, onClick }: ResultCardProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!component.html || !previewRef.current) return;
    const el = previewRef.current.firstElementChild as HTMLElement | null;
    if (!el) return;

    const fitScale = () => {
      const container = previewRef.current;
      if (!container || !el) return;
      const boxW = container.offsetWidth - PREVIEW_PADDING;
      const boxH = container.offsetHeight - PREVIEW_PADDING;
      const contentW = el.offsetWidth;
      const contentH = el.offsetHeight;
      if (contentW <= 0 || contentH <= 0) return;
      const scale = Math.min(boxW / contentW, boxH / contentH, 1);
      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      el.style.transformOrigin = 'center center';
    };

    fitScale();
    const ro = new ResizeObserver(fitScale);
    ro.observe(previewRef.current);
    return () => ro.disconnect();
  }, [component.html]);

  return (
    <Card padding={0} className="result-card-wrapper">
      <div className="result-card-inner">
        {/* Badge positioned absolutely at top-right */}
        <span className="result-card-badge-positioned" title={component.designSystemName}>
          <Badge color="neutral" size="small">
            {component.designSystemName}
          </Badge>
        </span>

        {/* Preview takes most space */}
        <div className="result-card-preview-box">
          {component.html ? (
            <div
              ref={previewRef}
              className="result-card-preview-html"
              dangerouslySetInnerHTML={{ __html: component.html }}
            />
          ) : (
            <span className="result-card-preview-fallback">{component.name.charAt(0)}</span>
          )}
        </div>

        {/* Title and category at bottom */}
        <div className="result-card-info">
          <span className="result-card-name" title={component.name}>
            <Text variant="body-2" weight="regular">
              <HighlightedText text={component.name} matches={matches} fieldName="name" />
            </Text>
          </span>
          <Text variant="caption-1" color="neutral">
            {component.category}
          </Text>
        </div>

        {/* Button slides from bottom on hover */}
        <div className="result-card-button-container">
          <Button 
            fullWidth 
            variant="solid" 
            color="primary" 
            size="small" 
            onClick={onClick}
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
