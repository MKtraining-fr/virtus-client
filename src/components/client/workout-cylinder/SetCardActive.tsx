import React, { useState } from 'react';
import { VideoCameraIcon, PencilIcon } from '../../../constants/icons';
import type { PerformanceSet } from '../../../types';

interface SetCardActiveProps {
  setIndex: number;
  totalSets: number;
  performanceData: PerformanceSet;
  previousPerformance?: { reps: string; load: string };
  recommendedLoad?: number;
  loadUnit: string;
  onUpdateData: (data: Partial<PerformanceSet>) => void;
  onVideoClick: () => void;
  onNotesClick: () => void;
  onDropSetClick?: () => void;
}

const SetCardActive: React.FC<SetCardActiveProps> = ({
  setIndex,
  totalSets,
  performanceData,
  previousPerformance,
  recommendedLoad,
  loadUnit,
  onUpdateData,
  onVideoClick,
  onNotesClick,
  onDropSetClick,
}) => {
  const [weight, setWeight] = useState(performanceData.load || '');
  const [reps, setReps] = useState(performanceData.reps || '');

  const handleWeightChange = (value: string) => {
    setWeight(value);
    onUpdateData({ load: value });
  };

  const handleRepsChange = (value: string) => {
    setReps(value);
    onUpdateData({ reps: value });
  };

  const isCompleted = performanceData.reps && performanceData.load;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-text-primary font-bold text-lg">
            Série {setIndex + 1}/{totalSets}
          </span>
          {isCompleted && (
            <span className="text-accent-green text-xl">✓</span>
          )}
        </div>
        {performanceData.isPR && (
          <span className="text-accent-gold text-sm font-bold">
            🏆 NEW PR
          </span>
        )}
      </div>

      {/* Référence semaine dernière */}
      {previousPerformance && (
        <div className="text-text-tertiary text-sm text-center">
          Semaine dernière: {previousPerformance.load}kg × {previousPerformance.reps} reps
        </div>
      )}

      {/* Inputs */}
      <div className="flex gap-3">
        {/* Input Poids */}
        <div className="flex-1">
          <label className="block text-text-secondary text-xs mb-1 text-center">
            {loadUnit}
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder={previousPerformance?.load || '0'}
            className="w-full bg-bg-primary border-2 border-gray-700 focus:border-brand-primary rounded-xl text-center py-4 text-3xl font-bold text-text-primary placeholder:text-text-disabled transition-colors outline-none"
          />
        </div>

        {/* Input Reps */}
        <div className="flex-1">
          <label className="block text-text-secondary text-xs mb-1 text-center">
            Reps
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => handleRepsChange(e.target.value)}
            placeholder={previousPerformance?.reps || '0'}
            className="w-full bg-bg-primary border-2 border-gray-700 focus:border-brand-primary rounded-xl text-center py-4 text-3xl font-bold text-text-primary placeholder:text-text-disabled transition-colors outline-none"
          />
        </div>
      </div>

      {/* Recommandation */}
      {recommendedLoad && (
        <div className="flex justify-center">
          <button
            onClick={() => handleWeightChange(recommendedLoad.toString())}
            className="px-4 py-2 bg-accent-cyan/20 border border-accent-cyan/50 text-accent-cyan rounded-lg text-sm font-medium hover:bg-accent-cyan/30 transition-colors"
          >
            ↑ Recommandé: {recommendedLoad}kg
          </button>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-2">
        <button
          onClick={onVideoClick}
          className="flex-1 py-3 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <VideoCameraIcon className="w-5 h-5" />
          Vidéo
        </button>
        
        <button
          onClick={onNotesClick}
          className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-text-primary rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <PencilIcon className="w-5 h-5" />
          Notes
        </button>
        
        {onDropSetClick && (
          <button
            onClick={onDropSetClick}
            className="px-4 py-3 bg-gradient-to-r from-accent-orange to-red-500 hover:from-accent-orange/90 hover:to-red-500/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-1"
          >
            ⚡ DROP SET
          </button>
        )}
      </div>

      {/* Notes existantes */}
      {performanceData.notes && (
        <div className="bg-bg-primary rounded-lg p-3 border border-gray-700">
          <div className="text-text-secondary text-xs mb-1">Notes:</div>
          <div className="text-text-primary text-sm">{performanceData.notes}</div>
        </div>
      )}
    </div>
  );
};

export default SetCardActive;
