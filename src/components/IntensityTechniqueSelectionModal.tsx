import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { IntensityTechnique } from '../types/intensityTechnique';

interface IntensityTechniqueSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  techniques: IntensityTechnique[];
  selectedTechniqueId: string | null | undefined;
  onSelect: (technique: IntensityTechnique | null) => void;
}

const IntensityTechniqueSelectionModal: React.FC<IntensityTechniqueSelectionModalProps> = ({
  isOpen,
  onClose,
  techniques,
  selectedTechniqueId,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTechnique, setHoveredTechnique] = useState<IntensityTechnique | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredTechniques = techniques.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Focus sur le champ de recherche quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Réinitialiser la recherche quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setHoveredTechnique(null);
    }
  }, [isOpen]);

  const handleSelect = (technique: IntensityTechnique | null) => {
    onSelect(technique);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[200]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sélectionner une technique d'intensification
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Champ de recherche */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une technique..."
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Liste scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Option "Aucune" */}
            <div
              onClick={() => handleSelect(null)}
              className="p-4 mb-2 hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer border-2 border-gray-200 dark:border-gray-700 rounded-xl transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">Aucune technique</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Retirer la technique d'intensification
              </div>
            </div>

            {/* Liste des techniques */}
            {filteredTechniques.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                Aucune technique trouvée
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTechniques.map((technique) => (
                  <div
                    key={technique.id}
                    onClick={() => handleSelect(technique)}
                    onMouseEnter={() => setHoveredTechnique(technique)}
                    onMouseLeave={() => setHoveredTechnique(null)}
                    className={`p-4 hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer border-2 rounded-xl transition-colors ${
                      selectedTechniqueId === technique.id 
                        ? 'border-primary bg-primary/10 dark:bg-primary/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {technique.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {technique.description}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-3 flex-shrink-0">
                        {!technique.is_public && (
                          <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
                            Perso
                          </span>
                        )}
                        {technique.adaptation_type === 'extra_fields' && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
                            Config
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Définition au survol */}
                    {hoveredTechnique?.id === technique.id && technique.definition && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                        <div className="text-gray-600 dark:text-gray-400">
                          {technique.definition}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default IntensityTechniqueSelectionModal;
