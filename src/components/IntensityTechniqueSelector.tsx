import React, { useState, useEffect } from 'react';
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

  const handleTechniqueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const techniqueId = e.target.value;
    if (techniqueId === 'none') {
      onChange(null, null, null);
    } else {
      const technique = techniques.find((t) => t.id === techniqueId);
      if (technique) {
        // La config sera initialisée par le configurateur si nécessaire
        onChange(techniqueId, null, 'all_weeks');
      }
    }
  };

  if (loading) {
    return (
      <div className="relative">
        <select
          disabled
          className="w-full px-3 py-2 border-2 border-primary/20 rounded-xl bg-gray-100 text-sm focus:outline-none appearance-none"
        >
          <option>Chargement...</option>
        </select>
        <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <select
          value={value || 'none'}
          onChange={handleTechniqueChange}
          disabled={disabled}
          className="w-full px-3 py-2 border-2 border-primary/20 rounded-xl bg-white text-sm focus:outline-none focus:border-primary/50 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="none">Élément d'intensification</option>
          {techniques.map((technique) => (
            <option key={technique.id} value={technique.id}>
              {technique.name}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Afficher la description si une technique est sélectionnée */}
      {selectedTechnique && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <p className="font-medium">{selectedTechnique.name}</p>
          <p className="mt-1">{selectedTechnique.description}</p>
        </div>
      )}

      {/* Afficher le configurateur si la technique nécessite une configuration */}
      {selectedTechnique && selectedTechnique.adaptation_type === 'extra_fields' && (
        <IntensityTechniqueConfigurator
          technique={selectedTechnique}
          config={config as IntensityConfig | null}
          onChange={(newConfig) => onChange(selectedTechnique.id, newConfig, appliesTo || 'all_weeks')}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default IntensityTechniqueSelector;
