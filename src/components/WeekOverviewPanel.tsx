import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface WorkoutExercise {
  id: number;
  exerciseId?: string;
  name: string;
  sets: string;
  details: Array<{
    reps: string;
    load: { value: string; unit: string };
    tempo: string;
    rest: string;
  }>;
  weekVariations?: Record<number, any>;
}

interface WeekOverviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: WorkoutExercise;
  totalWeeks: number;
}

export const WeekOverviewPanel: React.FC<WeekOverviewPanelProps> = ({
  isOpen,
  onClose,
  exercise,
  totalWeeks,
}) => {
  if (!isOpen) return null;

  // Fonction pour obtenir les données d'une semaine spécifique
  const getWeekData = (week: number) => {
    if (week === 1 || !exercise.weekVariations || !exercise.weekVariations[week]) {
      // Semaine 1 ou pas de variation : utiliser les données de base
      return {
        sets: exercise.sets,
        details: exercise.details,
      };
    }
    // Semaine avec variations
    const variation = exercise.weekVariations[week];
    return {
      sets: variation.sets !== undefined ? variation.sets : exercise.sets,
      details: variation.details !== undefined ? variation.details : exercise.details,
    };
  };

  // Fonction pour obtenir une plage de valeurs ou une valeur unique
  const getValueRange = (details: any[], field: 'reps' | 'load' | 'tempo' | 'rest') => {
    if (!details || details.length === 0) return '-';
    
    if (field === 'load') {
      const loads = details.map(d => d.load?.value).filter(v => v !== undefined && v !== '');
      if (loads.length === 0) return '-';
      
      const uniqueLoads = [...new Set(loads)];
      if (uniqueLoads.length === 1) {
        const unit = details[0].load?.unit || 'kg';
        return `${uniqueLoads[0]} ${unit}`;
      }
      
      const numericLoads = loads.map(l => parseFloat(l)).filter(n => !isNaN(n));
      if (numericLoads.length === 0) return loads.join(', ');
      
      const min = Math.min(...numericLoads);
      const max = Math.max(...numericLoads);
      const unit = details[0].load?.unit || 'kg';
      return `${min}-${max} ${unit}`;
    }
    
    const values = details.map(d => d[field]).filter(v => v !== undefined && v !== '');
    if (values.length === 0) return '-';
    
    const uniqueValues = [...new Set(values)];
    if (uniqueValues.length === 1) {
      return uniqueValues[0];
    }
    
    return `${values[0]}-${values[values.length - 1]}`;
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-800 shadow-2xl z-50 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: '600px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Vue globale : {exercise.name || 'Exercice'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 64px)' }}>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          Aperçu des paramètres de cet exercice pour toutes les semaines du programme.
        </p>

        {/* Tableau scrollable horizontalement */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 text-xs">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Semaine
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Séries
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Reps
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Charge
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Tempo
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Repos
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
                const weekData = getWeekData(week);
                const isModified = week !== 1 && exercise.weekVariations && exercise.weekVariations[week];

                return (
                  <tr
                    key={week}
                    className={`${
                      isModified
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'bg-white dark:bg-gray-800'
                    } hover:bg-gray-50 dark:hover:bg-gray-700`}
                  >
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 font-semibold text-gray-700 dark:text-gray-300">
                      S{week}
                      {isModified && (
                        <span className="ml-1 text-blue-500 text-xs">●</span>
                      )}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-600 dark:text-gray-400">
                      {weekData.sets}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-600 dark:text-gray-400">
                      {getValueRange(weekData.details, 'reps')}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-600 dark:text-gray-400">
                      {getValueRange(weekData.details, 'load')}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-600 dark:text-gray-400">
                      {getValueRange(weekData.details, 'tempo')}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-600 dark:text-gray-400">
                      {getValueRange(weekData.details, 'rest')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Légende */}
        <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Légende :</p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Semaine de base</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-50 dark:bg-blue-900/20 border border-gray-300 dark:border-gray-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Semaine personnalisée</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
