import { Card, View, Text, Badge, Button, Actionable } from 'reshaped';
import type { SearchableComponent } from '../hooks/useSearch';

interface ResultCardProps {
  component: SearchableComponent;
  onClick?: () => void;
  onPlace?: () => void;
}

export function ResultCard({ component, onClick, onPlace }: ResultCardProps) {
  const handlePlaceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlace) {
      onPlace();
    }
  };

  const cardContent = (
    <View gap={3}>
      {/* Preview placeholder */}
      <View
        align="center"
        justify="center"
        backgroundColor="neutral-faded"
        borderRadius="medium"
        height={20}
        width="100%"
      >
        <Text variant="title-3" color="neutral">
          {component.name.charAt(0)}
        </Text>
      </View>

      {/* Component info */}
      <View gap={2}>
        <View direction="row" align="center" justify="space-between" gap={2}>
          <Text variant="body-2" weight="bold">
            {component.name}
          </Text>
          <Badge color="neutral" size="small">
            {component.designSystemName}
          </Badge>
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
