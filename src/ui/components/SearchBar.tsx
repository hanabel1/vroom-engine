import { useState, useEffect } from 'react';
import { TextField, Button } from 'reshaped';
import { useAppStore } from '@/ui/store';

const SearchIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

interface SearchBarProps {
  placeholder?: string;
}

const DEBOUNCE_MS = 250;

export function SearchBar({ placeholder = 'Search components...' }: SearchBarProps) {
  const [value, setValue] = useState('');

  // Debounce search and sync to store
  useEffect(() => {
    const timer = setTimeout(() => {
      useAppStore.getState().setSearchQuery(value);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value]);

  const handleClear = () => {
    setValue('');
    useAppStore.getState().setSearchQuery('');
  };

  return (
    <div className="search-bar">
      <TextField
        name="search"
        className="search-input"
        value={value}
        onChange={({ value }) => setValue(value)}
        placeholder={placeholder}
        icon={SearchIcon}
      />
      {value && (
        <Button variant="ghost" size="small" onClick={handleClear} aria-label="Clear search">
          ×
        </Button>
      )}
    </div>
  );
}
