import React, { useState, useEffect } from 'react';
import type { IntensityTechnique } from '../../types/intensityTechnique';
import { supabase } from '../../services/supabase';

interface IntensityTechniqueDisplayProps {
  techniqueId: string | null | undefined;
  config?: Record<string, any> | null;
  appliesTo?: string | null;
  currentWeek?: number;
  className?: string;
  collapsible?: boolean;
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

const IntensityTechniqueDisplay: React.FC<IntensityTechniqueDisplayProps> = ({
  techniqueId,
  config,
  appliesTo,
  currentWeek,
  className = '',
  collapsible = true,
}) => {
  const [technique, setTechnique] = useState<IntensityTechnique | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (techniqueId) {
      loadTechnique();
    } else {
      setLoading(false);
    }
  }, [techniqueId]);

  const loadTechnique = async () => {
    if (!techniqueId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('intensification_techniques')
        .select('*')
        .eq('id', techniqueId)
        .single();

      if (error) {
        console.error('Erreur lors du chargement de la technique:', error);
        return;
      }

      setTechnique(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la technique:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-100 dark:bg-client-dark rounded-md p-3 ${className}`}>
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!technique) {
    return null;
  }

  // Vérifier si la technique s'applique à la semaine actuelle
  if (appliesTo && currentWeek) {
    const techniqueApplies = appliesTo === 'all_weeks' || appliesTo === `week_${currentWeek}`;
    if (!techniqueApplies) {
      return null;
    }
  }

  if (collapsible) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-gray-100 dark:bg-client-dark text-gray-500 dark:text-client-subtle font-semibold py-2.5 px-4 rounded-md text-left flex justify-between items-center hover:bg-gray-200 dark:hover:bg-client-dark/80 transition-colors"
        >
          <span>
            Technique : <strong className="text-gray-700 dark:text-client-light">{technique.name}</strong>
          </span>
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
        {isExpanded && (
          <div className="p-3 mt-1 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-sm text-gray-700 dark:text-gray-300">{technique.definition || technique.description}</p>
          </div>
        )}
      </div>
    );
  }

  // Mode non-collapsible (affichage direct)
  return (
    <div className={`bg-gray-100 dark:bg-client-dark rounded-md p-3 space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-600 dark:text-client-subtle">
          Technique d'intensification
        </p>
        <span className="text-sm font-bold text-primary">{technique.name}</span>
      </div>
      <p className="text-sm text-gray-700 dark:text-client-light">{technique.description}</p>
      {technique.protocol && (
        <div className="pt-2 border-t border-gray-200 dark:border-client-dark">
          <p className="text-xs font-semibold text-gray-600 dark:text-client-subtle uppercase mb-1">
            Protocole
          </p>
          <p className="text-sm text-gray-700 dark:text-client-light whitespace-pre-wrap">
            {technique.protocol}
          </p>
        </div>
      )}
    </div>
  );
};

export default IntensityTechniqueDisplay;
