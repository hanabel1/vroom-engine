import { useCallback, useEffect } from 'react';
import { usePluginMessage } from './hooks/usePluginMessage';
import { SearchBar } from './components/SearchBar';
import { FilterChips } from './components/FilterChips';
import { ResultsList } from './components/ResultsList';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { useAppStore } from '@/ui/store';
import type { PluginMessage } from './types/messages';

function App() {
  // Read catalog state from store
  const catalogData = useAppStore((s) => s.designSystems);
  const isLoading = useAppStore((s) => s.isLoading);

  const handleMessage = useCallback((message: PluginMessage) => {
    if (message.type === 'CATALOG_DATA') {
      useAppStore.getState().setCatalogData(message.payload.designSystems);
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
        useAppStore.getState().setSearchQuery('');
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.value = '';
          searchInput.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="container">
        <LoadingSkeleton />
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
      </div>
      <SearchBar />

      <FilterChips />

      <ResultsList />
    </div>
  );
}

export default App;
