import { Card, View, Text, Badge, Actionable } from 'reshaped';
import type { SearchableComponent } from '../hooks/useSearch';
import type Fuse from 'fuse.js';
import { HighlightedText } from './HighlightedText';
import { HtmlPreview } from './HtmlPreview';

interface ResultCardProps {
  component: SearchableComponent;
  matches?: readonly Fuse.FuseResultMatch[];
  onClick?: () => void;
}

export function ResultCard({ component, matches, onClick }: ResultCardProps) {
  const cardContent = (
    <View gap={3} className="result-card-content">
      {/* Badge positioned absolutely at top-right */}
      <span className="result-card-badge-positioned" title={component.designSystemName}>
        <Badge color="neutral" size="small">
          {component.designSystemName}
        </Badge>
      </span>

      <div className="result-card-preview-box">
        {component.html ? (
          <HtmlPreview 
            html={component.html}
            className="result-card-preview"
            showDimensions={false}
          />
        ) : (
          <span className="result-card-preview-fallback">
            {component.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Component info — simplified without inline badge */}
      <View gap={2} className="result-card-info">
        <View direction="row" align="center" gap={2} className="result-card-title-row">
          <span className="result-card-name" title={component.name}>
            <Text variant="body-2" weight="regular">
              <HighlightedText text={component.name} matches={matches} fieldName="name" />
            </Text>
          </span>
        </View>
        <Text variant="caption-1" color="neutral">
          {component.category}
        </Text>
      </View>
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
