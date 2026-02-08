import { View, Text, Grid, Pagination } from 'reshaped';
import { ResultCard } from './ResultCard';
import { EmptyState } from './EmptyState';
import { useSearch } from '../hooks/useSearch';
import { useAppStore } from '@/ui/store';


export function ResultsList() {
  const { query, results, totalResults, paginatedResults, totalPages, currentPage } = useSearch();

  // Empty states
  if (results.length === 0 && query.trim()) {
    return <EmptyState variant="no-results" query={query} />;
  }

  if (results.length === 0) {
    return <EmptyState variant="browse" />;
  }

  return (
    <div className="results-list">
      {/* Result count */}
      <Text variant="body-2" color="neutral">
        {totalResults} {totalResults === 1 ? 'result' : 'results'}
      </Text>

      {/* Results grid - 2 columns */}
      <div className="results-grid-scroll">
        <Grid columns={2} gap={3}>
          {paginatedResults.map((result) => (
            <Grid.Item key={`${result.item.designSystemId}-${result.item.id}`}>
              <ResultCard
                component={result.item}
                matches={result.matches}
              />
            </Grid.Item>
          ))}
        </Grid>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <View align="center" paddingBlock={4}>
          <Pagination
            page={currentPage}
            total={totalPages}
            onChange={(args) => useAppStore.getState().setCurrentPage(args.page)}
            previousAriaLabel="Previous page"
            nextAriaLabel="Next page"
          />
        </View>
      )}
    </div>
  );
}
