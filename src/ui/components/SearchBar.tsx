import { useState, useEffect } from 'react';
import { TextField, Button } from 'reshaped';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  resultCount?: number;
}

const DEBOUNCE_MS = 250;

export function SearchBar({ onSearch, placeholder = 'Search components or props...', resultCount }: SearchBarProps) {
  const [value, setValue] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, onSearch]);

  const handleClear = () => {
    setValue('');
  };

  return (
    <div className="search-bar">
      <TextField
        name="search"
        className="search-input"
        value={value}
        onChange={({ event, name, value }) => setValue(value)}
        placeholder={placeholder}
      />
      {value && (
        <Button variant="ghost" size="sm" onClick={handleClear} aria-label="Clear search">
          ×
        </Button>
      )}
      {resultCount !== undefined && (
        <div className="search-results-count">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </div>
      )}
    </div>
  );
}
