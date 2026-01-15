import React, { useState } from 'react';

interface DuplicateWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: number;
  totalWeeks: number;
  onConfirm: (targetWeeks: number[]) => void;
}

export const DuplicateWeekModal: React.FC<DuplicateWeekModalProps> = ({
  isOpen,
  onClose,
  currentWeek,
  totalWeeks,
  onConfirm,
}) => {
  const [duplicateMode, setDuplicateMode] = useState<'following' | 'specific' | 'all'>('following');
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    let targetWeeks: number[] = [];

    if (duplicateMode === 'following') {
      // Toutes les semaines suivantes
      targetWeeks = Array.from({ length: totalWeeks - currentWeek }, (_, i) => currentWeek + i + 1);
    } else if (duplicateMode === 'specific') {
      // Semaines spécifiques sélectionnées
      targetWeeks = selectedWeeks;
    } else if (duplicateMode === 'all') {
      // Toutes les semaines sauf la semaine actuelle
      targetWeeks = Array.from({ length: totalWeeks }, (_, i) => i + 1).filter(w => w !== currentWeek);
    }

    onConfirm(targetWeeks);
    onClose();
  };

  const toggleWeekSelection = (week: number) => {
    setSelectedWeeks(prev => 
      prev.includes(week) 
        ? prev.filter(w => w !== week)
        : [...prev, week]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-md w-full mx-4">
        <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">
          Dupliquer les modifications
        </h3>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          Vous pouvez dupliquer les modifications de la Semaine {currentWeek} vers d'autres semaines.
        </p>

        {/* Options de duplication */}
        <div className="space-y-2 mb-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              checked={duplicateMode === 'following'}
              onChange={() => setDuplicateMode('following')}
              className="w-3 h-3"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              Toutes les semaines suivantes ({currentWeek + 1}-{totalWeeks})
            </span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              checked={duplicateMode === 'specific'}
              onChange={() => setDuplicateMode('specific')}
              className="w-3 h-3"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              Semaines spécifiques (sélection manuelle)
            </span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              checked={duplicateMode === 'all'}
              onChange={() => setDuplicateMode('all')}
              className="w-3 h-3"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              Toutes les semaines (1-{totalWeeks})
            </span>
          </label>
        </div>

        {/* Sélection manuelle des semaines */}
        {duplicateMode === 'specific' && (
          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Sélectionnez les semaines :
            </p>
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: totalWeeks }, (_, i) => i + 1)
                .filter(w => w !== currentWeek)
                .map(week => (
                  <button
                    key={week}
                    onClick={() => toggleWeekSelection(week)}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedWeeks.includes(week)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500'
                    }`}
                  >
                    S{week}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={duplicateMode === 'specific' && selectedWeeks.length === 0}
            className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Dupliquer
          </button>
        </div>
      </div>
    </div>
  );
};
