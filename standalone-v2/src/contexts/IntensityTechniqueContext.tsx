import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { IntensityTechnique, IntensityTechniqueParams } from '../types/intensity-techniques';

/**
 * Context pour gérer la technique d'intensification active
 * Permet de changer dynamiquement l'interface de l'IronTrack
 */

interface IntensityTechniqueContextType {
  /** Technique d'intensification actuellement active */
  currentTechnique: IntensityTechnique;
  
  /** Paramètres de la technique active */
  currentParams: IntensityTechniqueParams | null;
  
  /** Changer la technique active */
  setTechnique: (technique: IntensityTechnique, params?: IntensityTechniqueParams) => void;
  
  /** Réinitialiser à STANDARD */
  resetToStandard: () => void;
}

const IntensityTechniqueContext = createContext<IntensityTechniqueContextType | undefined>(undefined);

interface IntensityTechniqueProviderProps {
  children: ReactNode;
}

export const IntensityTechniqueProvider: React.FC<IntensityTechniqueProviderProps> = ({ children }) => {
  // Initialiser depuis localStorage dès le début pour éviter le flash
  const [currentTechnique, setCurrentTechnique] = useState<IntensityTechnique>(() => {
    const saved = localStorage.getItem('irontrack_intensity_technique') as IntensityTechnique;
    return saved || 'STANDARD';
  });
  const [currentParams, setCurrentParams] = useState<IntensityTechniqueParams | null>(() => {
    const saved = localStorage.getItem('irontrack_intensity_params');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved params:', e);
        return null;
      }
    }
    return null;
  });

  const setTechnique = (technique: IntensityTechnique, params?: IntensityTechniqueParams) => {
    setCurrentTechnique(technique);
    setCurrentParams(params || null);
    
    // Sauvegarder dans localStorage pour persistance
    localStorage.setItem('irontrack_intensity_technique', technique);
    if (params) {
      localStorage.setItem('irontrack_intensity_params', JSON.stringify(params));
    } else {
      localStorage.removeItem('irontrack_intensity_params');
    }
  };

  const resetToStandard = () => {
    setTechnique('STANDARD');
  };

  return (
    <IntensityTechniqueContext.Provider
      value={{
        currentTechnique,
        currentParams,
        setTechnique,
        resetToStandard,
      }}
    >
      {children}
    </IntensityTechniqueContext.Provider>
  );
};

/**
 * Hook pour accéder au contexte de technique d'intensification
 */
export const useIntensityTechnique = () => {
  const context = useContext(IntensityTechniqueContext);
  if (context === undefined) {
    throw new Error('useIntensityTechnique must be used within IntensityTechniqueProvider');
  }
  return context;
};
