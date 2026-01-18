import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import SetCard from './SetCard';
import SetCardActive from './SetCardActive';
import { useWorkoutStore } from '../../../stores/workoutStore';
import type { WorkoutExercise, PerformanceSet } from '../../../types';

interface SetsCylinderProps {
  exercise: WorkoutExercise;
  previousPerformances?: Record<number, PerformanceSet>;
  loadUnit: string;
  onVideoClick: () => void;
  onNotesClick: () => void;
}

const SetsCylinder: React.FC<SetsCylinderProps> = ({
  exercise,
  previousPerformances,
  loadUnit,
  onVideoClick,
  onNotesClick,
}) => {
  const {
    currentSetIndex,
    performanceData,
    updateSetData,
    goToSet,
    nextSet,
    previousSet,
  } = useWorkoutStore();

  const totalSets = parseInt(exercise.sets, 10) || 0;
  const exerciseId = exercise.id.toString();
  const exercisePerformanceData = performanceData[exerciseId] || [];

  // Calculer les séries visibles (±2 autour de la série active)
  const visibleSets = useMemo(() => {
    const sets = [];
    for (let i = currentSetIndex - 2; i <= currentSetIndex + 2; i++) {
      if (i >= 0 && i < totalSets) {
        sets.push(i);
      }
    }
    return sets;
  }, [currentSetIndex, totalSets]);

  // Configuration des gestures pour swipe vertical
  const bind = useDrag(
    ({ direction: [, dy], velocity: [, vy], last }) => {
      if (!last) return;

      const threshold = 0.5; // Vitesse minimum pour swipe
      if (Math.abs(vy) > threshold) {
        if (dy > 0) {
          // Swipe down → Série précédente
          previousSet();
        } else {
          // Swipe up → Série suivante
          nextSet();
        }
      }
    },
    {
      axis: 'y', // Restreindre au swipe vertical uniquement
      filterTaps: true,
      threshold: 10,
      rubberband: true,
    }
  );

  const handleUpdateSetData = (setIndex: number, data: Partial<PerformanceSet>) => {
    updateSetData(exerciseId, setIndex, data);
  };

  return (
    <div
      {...bind()}
      className="relative w-full h-full overflow-hidden"
      style={{
        perspective: '1200px',
        touchAction: 'pan-y',
      }}
    >
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {visibleSets.map((setIndex) => {
          const distance = Math.abs(setIndex - currentSetIndex);
          const isActive = setIndex === currentSetIndex;
          const setData = exercisePerformanceData[setIndex] || { reps: '', load: '' };
          const previousData = previousPerformances?.[setIndex];

          return (
            <SetCard
              key={setIndex}
              setIndex={setIndex}
              totalSets={totalSets}
              isActive={isActive}
              distance={distance}
              performanceData={setData}
              onSetClick={goToSet}
            >
              {isActive ? (
                <SetCardActive
                  setIndex={setIndex}
                  totalSets={totalSets}
                  performanceData={setData}
                  previousPerformance={previousData}
                  loadUnit={loadUnit}
                  onUpdateData={(data) => handleUpdateSetData(setIndex, data)}
                  onVideoClick={onVideoClick}
                  onNotesClick={onNotesClick}
                />
              ) : (
                <div className="text-center py-2">
                  <div className="text-text-secondary text-sm mb-2">
                    Série {setIndex + 1}/{totalSets}
                  </div>
                  {setData.reps && setData.load ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-accent-green text-2xl">✓</span>
                      <span className="text-text-primary font-semibold">
                        {setData.load}kg × {setData.reps}
                      </span>
                    </div>
                  ) : (
                    <div className="text-text-tertiary text-sm">
                      {setIndex < currentSetIndex ? 'Non complétée' : 'À venir'}
                    </div>
                  )}
                </div>
              )}
            </SetCard>
          );
        })}
      </motion.div>

      {/* Indicateurs de navigation */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5">
        {Array.from({ length: totalSets }).map((_, i) => (
          <button
            key={i}
            onClick={() => goToSet(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentSetIndex
                ? 'bg-brand-primary w-6'
                : i < currentSetIndex
                ? 'bg-accent-green'
                : 'bg-gray-600'
            }`}
            aria-label={`Aller à la série ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default SetsCylinder;
