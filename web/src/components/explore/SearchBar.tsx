/**
 * SearchBar Component
 * Barra de búsqueda para explorar eventos
 */

import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterClick: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onFilterClick }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className="relative mb-6">
      <div className="relative flex items-center">
        <div className="absolute left-4 z-10">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Buscar vinos, eventos..."
          value={searchQuery}
          onChange={handleChange}
          className="w-full pl-12 pr-20 py-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-14 z-10 p-2 text-gray-400 hover:text-gray-600"
            aria-label="Limpiar búsqueda"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <button
          onClick={onFilterClick}
          className="absolute right-2 z-10 p-2 text-gray-400 hover:text-purple-600 transition-colors"
          aria-label="Filtros"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;

