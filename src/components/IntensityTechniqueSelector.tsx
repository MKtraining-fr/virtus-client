import React, { useState, useEffect, useRef } from 'react';
import type { IntensityTechnique } from '../types/intensityTechnique';
import type { IntensityConfig } from '../types/intensityConfig';
import { getAllTechniques } from '../services/intensityTechniqueService';
import { useAuth } from '../context/AuthContext';
import IntensityTechniqueConfigModal from './IntensityTechniqueConfigModal';

interface IntensityTechniqueSelectorProps {
  value: string | null | undefined;
  config: Record<string, any> | null | undefined;
  appliesTo: string | null | undefined;
  onChange: (techniqueId: string | null, config: Record<string, any> | null, appliesTo: string | null) => void;
  disabled?: boolean;
}

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const IntensityTechniqueSelector: React.FC<IntensityTechniqueSelectorProps> = ({
  value,
  config,
  appliesTo,
  onChange,
  disabled = false,
}) => {
  const { user } = useAuth();
  const [techniques, setTechniques] = useState<IntensityTechnique[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTechnique, setSelectedTechnique] = useState<IntensityTechnique | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredTechnique, setHoveredTechnique] = useState<IntensityTechnique | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadTechniques();
    }
  }, [user?.id]);

  useEffect(() => {
    if (value && techniques.length > 0) {
      const technique = techniques.find((t) => t.id === value);
      setSelectedTechnique(technique || null);
    } else {
      setSelectedTechnique(null);
    }
  }, [value, techniques]);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTechniques = async () => {
    try {
      setLoading(true);
      const data = await getAllTechniques(user!.id);
      setTechniques(data);
    } catch (error) {
      console.error('Erreur lors du chargement des techniques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTechniqueSelect = (technique: IntensityTechnique | null) => {
    if (technique) {
      onChange(technique.id, null, 'all_weeks');
      setSelectedTechnique(technique);
    } else {
      onChange(null, null, null);
      setSelectedTechnique(null);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const filteredTechniques = techniques.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Focus sur le champ de recherche quand le dropdown s'ouvre
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Calculer la position du dropdown
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const handleConfigChange = (newConfig: Record<string, any> | null) => {
    if (value) {
      onChange(value, newConfig, appliesTo || 'all_weeks');
    }
  };

  const handleAppliesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (value) {
      onChange(value, config || null, e.target.value);
    }
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="w-full px-3 py-2 border-2 border-primary/20 rounded-xl bg-gray-100 text-sm">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Dropdown personnalisé */}
      <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 border-2 rounded-xl text-sm text-left flex items-center justify-between ${
            disabled
              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white border-primary/20 hover:border-primary/40 cursor-pointer'
          }`}
        >
          <span className={selectedTechnique ? 'text-gray-900' : 'text-gray-400'}>
            {selectedTechnique ? selectedTechnique.name : 'Sélectionner une technique'}
          </span>
          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Liste déroulante */}
        {isOpen && dropdownPosition && (
          <div 
            className="fixed z-[100] bg-white border-2 border-primary/20 rounded-xl shadow-lg"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            {/* Champ de recherche */}
            <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une technique..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Liste scrollable */}
            <div className="max-h-96 overflow-y-auto">
            {/* Option "Aucune" */}
            <div
              onClick={() => handleTechniqueSelect(null)}
              className="px-3 py-2 hover:bg-primary/5 cursor-pointer border-b border-gray-100"
            >
              <div className="font-medium text-gray-900">Aucune technique</div>
              <div className="text-xs text-gray-500 mt-0.5">Retirer la technique d'intensification</div>
            </div>

            {/* Liste des techniques */}
            {filteredTechniques.length === 0 ? (
              <div className="px-3 py-8 text-center text-gray-500 text-sm">
                Aucune technique trouvée
              </div>
            ) : (
              filteredTechniques.map((technique) => (
              <div
                key={technique.id}
                onClick={() => handleTechniqueSelect(technique)}
                onMouseEnter={() => setHoveredTechnique(technique)}
                onMouseLeave={() => setHoveredTechnique(null)}
                className={`px-3 py-2 hover:bg-primary/5 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  value === technique.id ? 'bg-primary/10' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{technique.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{technique.description}</div>
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    {!technique.is_public && (
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                        Perso
                      </span>
                    )}
                    {technique.adaptation_type === 'extra_fields' && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        Config
                      </span>
                    )}
                  </div>
                </div>

                {/* Tooltip au survol */}
                {hoveredTechnique?.id === technique.id && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <div className="font-semibold text-gray-700 mb-1">Protocole :</div>
                    <div className="text-gray-600 whitespace-pre-wrap">{technique.protocol}</div>
                  </div>
                )}
              </div>
            )))}
            </div>
          </div>
        )}
      </div>



      {/* Sélecteur de semaine d'application */}
      {selectedTechnique && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Appliquer à
          </label>
          <div className="flex items-center gap-2">
            <select
              value={appliesTo || 'all_weeks'}
              onChange={(e) => onChange(value, config, e.target.value)}
              disabled={disabled}
              className="flex-1 px-3 py-2 border-2 border-primary/20 rounded-xl text-sm focus:outline-none focus:border-primary"
            >
              <option value="all_weeks">Toutes les semaines</option>
              <option value="last_week">Dernière semaine uniquement</option>
              <option value="specific_weeks">Semaines spécifiques</option>
            </select>
            
            {/* Bouton icône pour ouvrir la modal de configuration */}
            {selectedTechnique.adaptation_type === 'extra_fields' && selectedTechnique.config_schema && (
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                disabled={disabled}
                title="Configurer la technique"
                className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input pour semaines spécifiques */}
      {value && appliesTo === 'specific_weeks' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Numéros de semaines (ex: 1,2,8)
          </label>
          <input
            type="text"
            placeholder="Ex: 1,2,8"
            disabled={disabled}
            className="w-full px-3 py-2 border-2 border-primary/20 rounded-xl text-sm focus:outline-none focus:border-primary"
          />
        </div>
      )}



      {/* Modal de configuration */}
      {selectedTechnique && selectedTechnique.adaptation_type === 'extra_fields' && selectedTechnique.config_schema && (
        <IntensityTechniqueConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          technique={selectedTechnique}
          config={config as IntensityConfig}
          onChange={handleConfigChange}
        />
      )}
    </div>
  );
};

export default IntensityTechniqueSelector;
