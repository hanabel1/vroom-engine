import { View, Skeleton, Card, Grid } from 'reshaped';

export function LoadingSkeleton() {
  return (
    <View gap={4}>
      {/* Search bar skeleton */}
      <Skeleton height={10} width="100%" />

      {/* Filter chips skeleton */}
      <View direction="row" gap={2}>
        <Skeleton height={8} width={16} />
        <Skeleton height={8} width={20} />
        <Skeleton height={8} width={24} />
        <Skeleton height={8} width={28} />
      </View>

      {/* Results grid skeleton - 2x4 grid */}
      <Grid columns={2} gap={3}>
        {Array.from({ length: 8 }, (_, i) => (
          <Grid.Item key={i}>
            <Card padding={3}>
              <View gap={2}>
                {/* Preview placeholder skeleton */}
                <Skeleton height={20} width="100%" />
                {/* Component name skeleton */}
                <Skeleton height={4} width="70%" />
                {/* Category skeleton */}
                <Skeleton height={3} width="50%" />
              </View>
            </Card>
          </Grid.Item>
        ))}
      </Grid>
    </View>
  );
}
