import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type IntensityTechnique = 'STANDARD' | 'DROP_SET' | 'REST_PAUSE' | 'SUPER_SET';

interface IntensityTechniqueContextType {
  currentTechnique: IntensityTechnique;
  setCurrentTechnique: (technique: IntensityTechnique) => void;
}

const IntensityTechniqueContext = createContext<IntensityTechniqueContextType | undefined>(undefined);

export const IntensityTechniqueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTechnique, setCurrentTechnique] = useState<IntensityTechnique>(() => {
    const saved = localStorage.getItem('virtus-intensity-technique');
    return (saved as IntensityTechnique) || 'STANDARD';
  });

  useEffect(() => {
    localStorage.setItem('virtus-intensity-technique', currentTechnique);
  }, [currentTechnique]);

  return (
    <IntensityTechniqueContext.Provider value={{ currentTechnique, setCurrentTechnique }}>
      {children}
    </IntensityTechniqueContext.Provider>
  );
};

export const useIntensityTechnique = () => {
  const context = useContext(IntensityTechniqueContext);
  if (context === undefined) {
    throw new Error('useIntensityTechnique must be used within an IntensityTechniqueProvider');
  }
  return context;
};
