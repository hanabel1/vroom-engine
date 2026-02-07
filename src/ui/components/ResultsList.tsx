import { ResultCard } from './ResultCard';
import type { SearchResult } from '../hooks/useSearch';

interface ResultsListProps {
  results: SearchResult[];
  query: string;
  onComponentClick?: (componentId: string, designSystemId: string) => void;
  onComponentPlace?: (componentId: string, designSystemId: string, html: string) => void;
}

export function ResultsList({ results, query, onComponentClick, onComponentPlace }: ResultsListProps) {
  if (results.length === 0 && query.trim()) {
    return (
      <div className="results-empty">
        <div className="results-empty-icon">🔍</div>
        <h3>No results found</h3>
        <p>Try searching for "button", "input", or "card"</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="results-empty">
        <div className="results-empty-icon">📦</div>
        <h3>Browse components</h3>
        <p>Search for components across design systems</p>
      </div>
    );
  }

  // Group results by design system
  const groupedResults = results.reduce((acc, result) => {
    const systemName = result.item.designSystemName;
    if (!acc[systemName]) {
      acc[systemName] = [];
    }
    acc[systemName].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="results-list">
      {Object.entries(groupedResults).map(([systemName, systemResults]) => (
        <div key={systemName} className="results-group">
          <h2 className="results-group-title">{systemName}</h2>
          <div className="results-grid">
            {systemResults.map((result) => (
              <ResultCard
                key={`${result.item.designSystemId}-${result.item.id}`}
                component={result.item}
                onClick={() => onComponentClick?.(result.item.id, result.item.designSystemId)}
                onPlace={() => onComponentPlace?.(result.item.id, result.item.designSystemId, result.item.html)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
