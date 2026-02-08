import { useEffect, useRef } from 'react';
import { Card, View, Text, Badge, Button, Actionable } from 'reshaped';
import type { SearchableComponent } from '../hooks/useSearch';
import type Fuse from 'fuse.js';
import { HighlightedText } from './HighlightedText';

interface ResultCardProps {
  component: SearchableComponent;
  matches?: readonly Fuse.FuseResultMatch[];
  onClick?: () => void;
  onPlace?: () => void;
}

const PREVIEW_PADDING = 16;

export function ResultCard({ component, matches, onClick, onPlace }: ResultCardProps) {
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

  const handlePlaceClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (onPlace) {
      onPlace();
    }
  };

  const cardContent = (
    <View gap={3} className="result-card-content">
      <div className="result-card-preview-box">
        {component.html ? (
          <div
            ref={previewRef}
            className="result-card-preview-html"
            dangerouslySetInnerHTML={{ __html: component.html }}
          />
        ) : (
          <span className="result-card-preview-fallback">
            {component.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Component info — name and badge truncate so long text doesn't push layout */}
      <View gap={2} className="result-card-info">
        <View direction="row" align="center" justify="space-between" gap={2} className="result-card-title-row">
          <span className="result-card-name" title={component.name}>
            <Text variant="body-2" weight="bold">
              <HighlightedText text={component.name} matches={matches} fieldName="name" />
            </Text>
          </span>
          <span className="result-card-badge" title={component.designSystemName}>
            <Badge color="neutral" size="small">
              {component.designSystemName}
            </Badge>
          </span>
        </View>
        <Text variant="caption-1" color="neutral">
          {component.category}
        </Text>
      </View>

      {/* Place button */}
      <Button
        fullWidth
        variant="solid"
        color="primary"
        size="small"
        onClick={handlePlaceClick}
      >
        Place
      </Button>
    </View>
  );

  // If onClick is provided, make the card actionable (clickable)
  if (onClick) {
    return (
      <Card padding={3}>
        <Actionable onClick={onClick}>{cardContent}</Actionable>
      </Card>
    );
  }

  return <Card padding={3}>{cardContent}</Card>;
}
