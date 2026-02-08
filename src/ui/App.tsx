import { useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { FilterChips } from './components/FilterChips';
import { ResultsList } from './components/ResultsList';
import { ComponentDetail } from './components/ComponentDetail';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { useAppStore } from '@/ui/store';
import type { PluginMessage, UIMessage } from './types/messages';

// Direct functions to avoid hook import issues
function sendPluginMessage(message: UIMessage) {
  parent.postMessage({ pluginMessage: message }, '*');
}

function App() {
  const catalogData = useAppStore((s) => s.designSystems);
  const isLoading = useAppStore((s) => s.isLoading);
  const view = useAppStore((s) => s.view);

  // Listen for plugin messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage as PluginMessage;
      if (!message) return;
      
      if (message.type === 'CATALOG_DATA') {
        useAppStore.getState().setCatalogData(message.payload.designSystems);
      } else if (message.type === 'PLACEMENT_COMPLETE') {
        useAppStore.getState().completePlacement(message.payload.nodeName, message.payload.warnings);
      } else if (message.type === 'PLACEMENT_ERROR') {
        useAppStore.getState().failPlacement(message.payload.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Send PLUGIN_READY on mount
  useEffect(() => {
    sendPluginMessage({ type: 'PLUGIN_READY' });
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

  if (view === 'detail') {
    return (
      <div className="container">
        <ComponentDetail />
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
