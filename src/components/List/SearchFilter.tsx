'use client';

import React, { useState, useEffect } from 'react';
import { LuSearch, LuX } from 'react-icons/lu';
import { ListItem } from '@/types/list';

interface SearchFilterProps {
  items: ListItem[];
  onFilteredItemsChange: (filteredItems: ListItem[]) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  items,
  onFilteredItemsChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Aplicar búsqueda cuando cambia el criterio
  useEffect(() => {
    const applySearch = () => {
      const filtered = items.filter(item => {
        // Filtrar por término de búsqueda (en título y descripción)
        const matchesQuery = !searchQuery || 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchesQuery;
      });
      
      onFilteredItemsChange(filtered);
    };

    applySearch();
  }, [searchQuery, items, onFilteredItemsChange]);

  return (
    <div className="mb-4">
      <div className="relative">
        <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title or description..."
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-4 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <LuX className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
} 