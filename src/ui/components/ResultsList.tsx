import { View, Text, Grid, Pagination } from 'reshaped';
import { ResultCard } from './ResultCard';
import { EmptyState } from './EmptyState';
import { useSearch } from '../hooks/useSearch';
import { useAppStore } from '@/ui/store';
import { usePluginMessage } from '../hooks/usePluginMessage';

interface ParsedElement {
  tagName: string;
  attributes: Record<string, string>;
  children: (ParsedElement | string)[];
  textContent?: string;
}

export function ResultsList() {
  const { query, results, totalResults, paginatedResults, totalPages, currentPage } = useSearch();
  const { sendMessage } = usePluginMessage();

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
    const requestId = `${Date.now()}-${Math.random()}`;

    // Parse HTML in UI thread (where DOMParser is available)
    const parsedElement = parseHTMLInUI(html);

    useAppStore.getState().startPlacement();

    sendMessage({
      type: 'PLACE_COMPONENT',
      payload: {
        designSystemId,
        componentId,
        parsedElement,
      },
      requestId,
    });
  };

  // Parse HTML using browser's DOMParser (available in UI thread)
  function parseHTMLInUI(html: string) {
    if (!html) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    if (!body.firstChild) return null;

    return parseElement(body.firstChild as Element);
  }

  function parseElement(element: Node): ParsedElement | string | null {
    // Text node
    if (element.nodeType === Node.TEXT_NODE) {
      const text = element.textContent?.trim() || '';
      return text ? text : null;
    }

    // Element node
    if (element.nodeType === Node.ELEMENT_NODE) {
      const el = element as Element;
      const tagName = el.tagName.toLowerCase();

      // Skip script and style tags
      if (tagName === 'script' || tagName === 'style') {
        return null;
      }

      const attributes: Record<string, string> = {};
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        attributes[attr.name] = attr.value;
      }

      const children: (ParsedElement | string)[] = [];
      for (let i = 0; i < el.childNodes.length; i++) {
        const child = parseElement(el.childNodes[i]);
        if (child) {
          children.push(child);
        }
      }

      return {
        tagName,
        attributes,
        children,
        textContent: el.textContent || undefined,
      };
    }

    return null;
  }

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

      {/* Results grid - 2 columns */}
      <Grid columns={2} gap={3}>
        {paginatedResults.map((result) => (
          <Grid.Item key={`${result.item.designSystemId}-${result.item.id}`}>
            <ResultCard
              component={result.item}
              onClick={() => handleComponentClick(result.item.id, result.item.designSystemId)}
              onPlace={() => handleComponentPlace(result.item.id, result.item.designSystemId, result.item.html)}
            />
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
