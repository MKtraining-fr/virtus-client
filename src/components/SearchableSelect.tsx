import React, { useState, useMemo, useRef, useEffect } from 'react';

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  className?: string;
  error?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Rechercher...',
  className = '',
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrer les options en fonction du terme de recherche
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(lowerSearch)
    );
  }, [options, searchTerm]);

  // Trouver le label de l'option sélectionnée
  const selectedLabel = useMemo(() => {
    const selected = options.find((opt) => opt.value === value);
    return selected ? selected.label : '';
  }, [options, value]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectOption = (optionValue: string) => {
    // Créer un événement synthétique pour le onChange
    const syntheticEvent = {
      target: {
        name: name || '',
        value: optionValue,
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-600 dark:text-client-subtle mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Bouton d'affichage de la sélection */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-3 md:py-2 text-base md:text-sm border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 dark:bg-client-card dark:border-gray-600 dark:text-client-light text-left flex justify-between items-center ${className}`}
        >
          <span className={!selectedLabel ? 'text-gray-400' : ''}>
            {selectedLabel || 'Sélectionner...'}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown avec recherche */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-client-card border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Champ de recherche */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-client-card text-gray-900 dark:text-client-light"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Liste des options */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectOption(option.value)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      option.value === value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-gray-900 dark:text-client-light'
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Aucun résultat trouvé
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
