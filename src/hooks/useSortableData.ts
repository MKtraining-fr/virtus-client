import { useState, useMemo } from 'react';

export type SortDirection = 'ascending' | 'descending';

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export const useSortableData = <T extends object>(
  items: T[],
  initialConfig: SortConfig<T> = { key: null, direction: 'ascending' }
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(initialConfig);

  const sortedItems = useMemo(() => {
    if (!items) return [];
    let sortableItems = [...items];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        const valA = typeof aValue === 'number' ? aValue : String(aValue).toLowerCase();
        const valB = typeof bValue === 'number' ? bValue : String(bValue).toLowerCase();

        if (valA < valB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortDirection = (key: keyof T) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction;
  };

  return { items: sortedItems, requestSort, getSortDirection };
};