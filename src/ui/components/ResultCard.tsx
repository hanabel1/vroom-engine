import { Card, Text, Badge, Button } from 'reshaped';
import type { SearchableComponent } from '../hooks/useSearch';
import type Fuse from 'fuse.js';
import { HighlightedText } from './HighlightedText';
import { HtmlPreview } from './HtmlPreview';
import { useAppStore } from '@/ui/store';

interface ResultCardProps {
  component: SearchableComponent;
  matches?: readonly Fuse.FuseResultMatch[];
}

export function ResultCard({ component, matches }: ResultCardProps) {
  const handleClick = () => {
    useAppStore.getState().openDetail(component.id, component.designSystemId);
  };

  return (
    <Card padding={0} className="result-card-wrapper">
      <div className="result-card-inner" onClick={handleClick} role="button" tabIndex={0}>
        {/* Badge positioned absolutely at top-right */}
        <span className="result-card-badge-positioned" title={component.designSystemName}>
          <Badge color="neutral" size="small">
            {component.designSystemName}
          </Badge>
        </span>

        {/* Preview takes most space */}
        <div className="result-card-preview-box">
          {component.html ? (
            <HtmlPreview html={component.html} showDimensions={false} />
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
      </div>
    </Card>
  );
}
