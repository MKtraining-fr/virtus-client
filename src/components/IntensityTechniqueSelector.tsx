import React, { useState, useEffect, useRef } from 'react';
import type { IntensityTechnique } from '../types/intensityTechnique';
import type { IntensityConfig } from '../types/intensityConfig';
import { getAllTechniques } from '../services/intensityTechniqueService';
import { useAuth } from '../context/AuthContext';
import IntensityTechniqueConfigurator from './IntensityTechniqueConfigurator';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  };

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
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-primary/20 rounded-xl shadow-lg max-h-80 overflow-y-auto">
            {/* Option "Aucune" */}
            <div
              onClick={() => handleTechniqueSelect(null)}
              className="px-3 py-2 hover:bg-primary/5 cursor-pointer border-b border-gray-100"
            >
              <div className="font-medium text-gray-900">Aucune technique</div>
              <div className="text-xs text-gray-500 mt-0.5">Retirer la technique d'intensification</div>
            </div>

            {/* Liste des techniques */}
            {techniques.map((technique) => (
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
            ))}
          </div>
        )}
      </div>

      {/* Description de la technique sélectionnée */}
      {selectedTechnique && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <div className="font-semibold text-gray-700 mb-1">Description</div>
          <div className="text-gray-600">{selectedTechnique.description}</div>
        </div>
      )}

      {/* Sélecteur de semaine d'application */}
      {selectedTechnique && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Appliquer à
          </label>
          <select
            value={appliesTo || 'all_weeks'}
            onChange={handleAppliesChange}
            disabled={disabled}
            className="w-full px-3 py-2 border-2 border-primary/20 rounded-xl text-sm focus:outline-none focus:border-primary"
          >
            <option value="all_weeks">Toutes les semaines</option>
            <option value="week_1">Semaine 1 uniquement</option>
            <option value="week_2">Semaine 2 uniquement</option>
            <option value="week_3">Semaine 3 uniquement</option>
            <option value="week_4">Semaine 4 uniquement</option>
            <option value="week_5">Semaine 5 uniquement</option>
            <option value="week_6">Semaine 6 uniquement</option>
            <option value="week_7">Semaine 7 uniquement</option>
            <option value="week_8">Semaine 8 uniquement</option>
          </select>
        </div>
      )}

      {/* Configurateur pour les techniques adaptatives */}
      {selectedTechnique && selectedTechnique.adaptation_type === 'extra_fields' && selectedTechnique.config_schema && (
        <IntensityTechniqueConfigurator
          technique={selectedTechnique}
          config={config as IntensityConfig}
          onChange={handleConfigChange}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default IntensityTechniqueSelector;
