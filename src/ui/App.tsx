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

  const handleComponentPlace = useCallback(
    (componentId: string, designSystemId: string, html: string) => {
      const requestId = `${Date.now()}-${Math.random()}`;
      
      // Parse HTML in UI thread (where DOMParser is available)
      const parsedElement = parseHTMLInUI(html);
      
      sendMessage({
        type: 'PLACE_COMPONENT',
        payload: {
          designSystemId,
          componentId,
          parsedElement,
        },
        requestId,
      });
    },
    [sendMessage],
  );

  // Parse HTML using browser's DOMParser (available in UI thread)
  function parseHTMLInUI(html: string) {
    if (!html) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    if (!body.firstChild) return null;

    return parseElement(body.firstChild as Element);
  }

  function parseElement(element: Node): any {
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

      const children: any[] = [];
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
        <p>
          {catalogData.length} design systems • {results.length} components
        </p>
      </div>

      <SearchBar onSearch={search} resultCount={query ? totalResults : undefined} />

      <ResultsList results={results} query={query} onComponentPlace={handleComponentPlace} />
    </div>
  );
}

export default App;
