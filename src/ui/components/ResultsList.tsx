import { View, Text, Grid, Pagination } from 'reshaped';
import { ResultCard } from './ResultCard';
import { EmptyState } from './EmptyState';
import { useSearch } from '../hooks/useSearch';
import { useAppStore } from '@/ui/store';
import { usePluginMessage } from '../hooks/usePluginMessage';
import { parseHTMLInUI } from '@/ui/utils/parseHtml';
import type { PlaceComponentMessage } from '@/ui/types/messages';

export function ResultsList() {
  const { query, results, totalResults, paginatedResults, totalPages, currentPage } = useSearch();
  const { sendMessage } = usePluginMessage(() => {});

  // Empty states
  if (results.length === 0 && query.trim()) {
    return <EmptyState variant="no-results" query={query} />;
  }

  if (results.length === 0) {
    return <EmptyState variant="browse" />;
  }

  const handleComponentClick = (componentId: string, designSystemId: string) => {
    useAppStore.getState().openDetail(componentId, designSystemId);
  };

  const handleComponentPlace = (componentId: string, designSystemId: string, html: string) => {
    const parsedElement = parseHTMLInUI(html);
    if (!parsedElement) return;

    useAppStore.getState().startPlacement();
    const msg: PlaceComponentMessage = {
      type: 'PLACE_COMPONENT',
      payload: { designSystemId, componentId, parsedElement },
      requestId: `${Date.now()}-${Math.random()}`,
    };
    sendMessage(msg);
  };

  return (
    <View gap={4}>
      {/* Section header with result count */}
      <View direction="row" align="center" gap={2}>
        <Text variant="title-4" weight="bold">
          COMPONENTS
        </Text>
        <Text variant="body-2" color="neutral">
          {totalResults} {totalResults === 1 ? 'result' : 'results'}
        </Text>
      </View>

      {/* Results grid - 2 columns; fixed-height wrapper so all cards same size */}
      <Grid columns={2} gap={3}>
        {paginatedResults.map((result) => (
          <Grid.Item key={`${result.item.designSystemId}-${result.item.id}`}>
            <div className="result-card-wrapper">
              <ResultCard
                component={result.item}
                matches={result.matches}
                onClick={() => handleComponentClick(result.item.id, result.item.designSystemId)}
              />
            </div>
          </Grid.Item>
        ))}
      </Grid>

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
    </View>
  );
}
