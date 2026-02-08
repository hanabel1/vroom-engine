import { View, Text, Grid, Pagination } from 'reshaped';
import { useEffect, useRef, useState } from 'react';
import { ResultCard } from './ResultCard';
import { EmptyState } from './EmptyState';
import { useSearch } from '../hooks/useSearch';
import { useAppStore } from '@/ui/store';

export function ResultsList() {
  const { query, results, totalResults, paginatedResults, totalPages, currentPage } = useSearch();
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (prevCount !== null && prevCount !== totalResults) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setPrevCount(totalResults);
      }, 500);
      return () => clearTimeout(timer);
    } else if (prevCount === null) {
      setPrevCount(totalResults);
    }
  }, [totalResults, prevCount]);

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
      <div className="results-count">
        <Text variant="body-2" color="neutral">
          <span className="results-count-container">
            {isAnimating && prevCount !== null && <span className="results-count-old">{prevCount}</span>}
            <span key={totalResults} className="results-count-new">
              {totalResults}
            </span>
          </span>
        </Text>
      </div>

      {/* Results grid - 2 columns */}
      <div className="results-grid-scroll">
        <Grid columns={2} gap={3}>
          {paginatedResults.map((result) => (
            <Grid.Item key={`${result.item.designSystemId}-${result.item.id}`}>
              <ResultCard component={result.item} matches={result.matches} />
            </Grid.Item>
          ))}
        </Grid>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <View align="center" paddingBottom={4} paddingTop={2}>
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
