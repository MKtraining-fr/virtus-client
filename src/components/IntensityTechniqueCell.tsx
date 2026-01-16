import React, { useState, useEffect } from 'react';
import { getTechniqueById } from '../services/intensityTechniqueService';
import type { IntensityTechnique } from '../types/intensityTechnique';

interface IntensityTechniqueCellProps {
  techniqueId: string | null | undefined;
  config?: Record<string, any> | null;
}

const IntensityTechniqueCell: React.FC<IntensityTechniqueCellProps> = ({ techniqueId, config }) => {
  const [technique, setTechnique] = useState<IntensityTechnique | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (techniqueId) {
      loadTechnique();
    }
  }, [techniqueId]);

  const loadTechnique = async () => {
    if (!techniqueId) return;
    
    try {
      setLoading(true);
      const data = await getTechniqueById(techniqueId);
      setTechnique(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la technique:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!techniqueId) {
    return <span className="text-gray-400">-</span>;
  }

  if (loading) {
    return <span className="text-gray-400">...</span>;
  }

  if (!technique) {
    return <span className="text-gray-400">-</span>;
  }

  // Afficher le nom de la technique avec un indicateur si elle a une config
  const hasConfig = config && typeof config === 'object' && Object.keys(config).length > 0;

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-gray-700">{technique.name}</span>
      {hasConfig && (
        <span className="text-xs text-blue-600" title="Technique configurée">
          ⚙️
        </span>
      )}
    </div>
  );
};

export default IntensityTechniqueCell;
