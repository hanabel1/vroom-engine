import { View, Text } from 'reshaped';

interface EmptyStateProps {
  variant: 'browse' | 'no-results';
  query?: string;
}

export function EmptyState({ variant, query }: EmptyStateProps) {
  if (variant === 'browse') {
    return (
      <View align="center" justify="center" padding={8} gap={2}>
        <Text variant="title-3" weight="bold" align="center">
          Browse components
        </Text>
        <Text variant="body-2" color="neutral" align="center">
          Search for components across design systems
        </Text>
      </View>
    );
  }

  if (variant === 'no-results') {
    return (
      <View align="center" justify="center" padding={8} gap={2}>
        <Text variant="title-3" weight="bold" align="center">
          No results for "{query}"
        </Text>
        <Text variant="body-2" color="neutral" align="center">
          Try a different search term
        </Text>
      </View>
    );
  }

  return null;
}
