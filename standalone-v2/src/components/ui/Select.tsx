import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  fullWidth?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  label,
  error,
  disabled = false,
  searchable = false,
  fullWidth = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable && searchQuery
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus sur l'input de recherche quand le dropdown s'ouvre
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery('');
      }
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`${fullWidth ? 'w-full' : 'w-auto'}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary mb-1">
          {label}
        </label>
      )}

      <div ref={containerRef} className="relative">
        {/* Select Button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`
            flex items-center justify-between w-full px-4 py-2.5 
            bg-bg-secondary dark:bg-bg-secondary 
            border rounded-lg
            text-text-primary dark:text-text-primary
            transition-all
            ${error 
              ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
              : 'border-border dark:border-border focus:ring-2 focus:ring-brand-500'
            }
            ${disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:border-brand-500 cursor-pointer'
            }
            ${isOpen ? 'ring-2 ring-brand-500' : ''}
          `}
        >
          <span className={selectedOption ? '' : 'text-text-tertiary dark:text-text-tertiary'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={18}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-bg-card dark:bg-bg-card border border-border dark:border-border rounded-lg shadow-xl max-h-60 overflow-hidden animate-scale-in">
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-border dark:border-border">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-text-tertiary" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-9 pr-3 py-2 bg-bg-secondary dark:bg-bg-secondary border border-border dark:border-border rounded-lg text-sm text-text-primary dark:text-text-primary placeholder-text-tertiary dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-text-tertiary dark:text-text-tertiary text-center">
                  Aucun résultat
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={`
                      w-full flex items-center justify-between px-4 py-2.5 text-left text-sm
                      transition-colors
                      ${option.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-bg-hover dark:hover:bg-bg-hover cursor-pointer'
                      }
                      ${option.value === value
                        ? 'bg-brand-500/10 text-brand-500'
                        : 'text-text-primary dark:text-text-primary'
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {option.value === value && (
                      <Check size={16} className="text-brand-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Select;
