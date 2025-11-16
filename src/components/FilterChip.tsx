import React from 'react';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-0.5 text-xs rounded-full border transition-all ${selected ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-client-dark text-gray-800 dark:text-client-light border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
  >
    {label}
  </button>
);

export default FilterChip;
