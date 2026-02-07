import { useState, useCallback, useEffect } from 'react';
import { usePluginMessage } from './hooks/usePluginMessage';
import { useSearch } from './hooks/useSearch';
import { SearchBar } from './components/SearchBar';
import { ResultsList } from './components/ResultsList';
import type { DesignSystem } from './types/catalog';
import type { PluginMessage } from './types/messages';

function App() {
  const [catalogData, setCatalogData] = useState<DesignSystem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleMessage = useCallback((message: PluginMessage) => {
    if (message.type === 'CATALOG_DATA') {
      setCatalogData(message.payload.designSystems);
      setIsLoading(false);
    } else if (message.type === 'PLACEMENT_COMPLETE') {
      // Show success notification
      console.log('Component placed:', message.payload.nodeName);
      if (message.payload.warnings.length > 0) {
        console.warn('Placement warnings:', message.payload.warnings);
      }
    } else if (message.type === 'PLACEMENT_ERROR') {
      // Show error notification
      console.error('Placement error:', message.payload.error);
    }
  }, []);

  const { sendMessage } = usePluginMessage(handleMessage);
  const { query, search, results, totalResults } = useSearch(catalogData);

  // Send PLUGIN_READY on mount
  useEffect(() => {
    sendMessage({ type: 'PLUGIN_READY' });
  }, [sendMessage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on Cmd/Ctrl+F
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        searchInput?.focus();
      }
      
      // Clear search on Escape
      if (e.key === 'Escape') {
        search('');
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.value = '';
          searchInput.blur();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [search]);

  const handleComponentPlace = useCallback((componentId: string, designSystemId: string, html: string) => {
    const requestId = `${Date.now()}-${Math.random()}`;
    sendMessage({
      type: 'PLACE_COMPONENT',
      payload: {
        designSystemId,
        componentId,
        html,
      },
      requestId,
    });
  }, [sendMessage]);

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">Loading catalog...</div>
      </div>
    );
  }

  // Check for empty catalog
  if (catalogData.length === 0) {
    return (
      <div className="container">
        <div className="results-empty">
          <div className="results-empty-icon">📦</div>
          <h3>No design systems loaded</h3>
          <p>See documentation to add catalog data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Design System Catalog</h1>
        <p>{catalogData.length} design systems • {results.length} components</p>
      </div>
      
      <SearchBar 
        onSearch={search} 
        resultCount={query ? totalResults : undefined}
      />
      
      <ResultsList
        results={results}
        query={query}
        onComponentPlace={handleComponentPlace}
      />
    </div>
  );
}

export default App;
