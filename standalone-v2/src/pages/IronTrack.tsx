import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Plus,
  Minus,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Exercise {
  id: number;
  name: string;
  sets: Set[];
  notes?: string;
  isExpanded: boolean;
}

interface Set {
  id: number;
  reps: number;
  weight: number;
  completed: boolean;
}

const IronTrack = () => {
  const navigate = useNavigate();
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: 1,
      name: 'Développé couché',
      isExpanded: true,
      sets: [
        { id: 1, reps: 10, weight: 80, completed: false },
        { id: 2, reps: 10, weight: 80, completed: false },
        { id: 3, reps: 10, weight: 80, completed: false },
        { id: 4, reps: 10, weight: 80, completed: false },
      ],
    },
    {
      id: 2,
      name: 'Développé incliné haltères',
      isExpanded: false,
      sets: [
        { id: 1, reps: 12, weight: 30, completed: false },
        { id: 2, reps: 12, weight: 30, completed: false },
        { id: 3, reps: 12, weight: 30, completed: false },
      ],
    },
    {
      id: 3,
      name: 'Écartés poulie vis-à-vis',
      isExpanded: false,
      sets: [
        { id: 1, reps: 15, weight: 15, completed: false },
        { id: 2, reps: 15, weight: 15, completed: false },
        { id: 3, reps: 15, weight: 15, completed: false },
      ],
    },
  ]);

  const toggleExercise = (exerciseId: number) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, isExpanded: !ex.isExpanded } : ex
      )
    );
  };

  const toggleSetComplete = (exerciseId: number, setId: number) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set) =>
                set.id === setId ? { ...set, completed: !set.completed } : set
              ),
            }
          : ex
      )
    );
  };

  const updateSet = (
    exerciseId: number,
    setId: number,
    field: 'reps' | 'weight',
    delta: number
  ) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set) =>
                set.id === setId
                  ? {
                      ...set,
                      [field]: Math.max(0, set[field] + delta),
                    }
                  : set
              ),
            }
          : ex
      )
    );
  };

  const handleFinishWorkout = () => {
    // Logique de sauvegarde de la séance
    navigate('/training');
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header fixe */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-[#6D5DD3] to-[#8B7DE8] px-4 py-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/training')}
            className="text-white active:scale-95 transition-transform"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-base font-bold">IronTrack</h1>
          <button
            onClick={handleFinishWorkout}
            className="bg-white/20 backdrop-blur-sm text-white rounded-lg px-3 py-1.5 text-xs font-bold active:scale-95 transition-transform"
          >
            Terminer
          </button>
        </div>
        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
          <p className="text-white text-sm font-bold">Push - Pectoraux & Triceps</p>
          <div className="flex items-center gap-3 text-white/80 text-xs mt-1">
            <span className="flex items-center gap-1">
              <Dumbbell size={12} />8 exercices
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              60 min
            </span>
          </div>
        </div>
      </div>

      {/* Liste des exercices */}
      <div className="px-4 py-4 space-y-3">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 overflow-hidden"
          >
            {/* Header de l'exercice */}
            <button
              onClick={() => toggleExercise(exercise.id)}
              className="w-full px-4 py-3 flex items-center justify-between active:bg-black/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-violet-600/20 rounded-lg p-2">
                  <Dumbbell size={16} className="text-violet-400" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-bold">{exercise.name}</p>
                  <p className="text-gray-500 text-xs">
                    {exercise.sets.filter((s) => s.completed).length} /{' '}
                    {exercise.sets.length} séries
                  </p>
                </div>
              </div>
              {exercise.isExpanded ? (
                <ChevronUp size={20} className="text-gray-500" />
              ) : (
                <ChevronDown size={20} className="text-gray-500" />
              )}
            </button>

            {/* Séries (expandable) */}
            {exercise.isExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {exercise.sets.map((set, index) => (
                  <div
                    key={set.id}
                    className={`rounded-lg p-3 ${
                      set.completed
                        ? 'bg-green-600/10 border border-green-600/30'
                        : 'bg-black/30 border border-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-xs font-bold">
                        Série {index + 1}
                      </span>
                      <button
                        onClick={() => toggleSetComplete(exercise.id, set.id)}
                        className={`rounded-full p-1 ${
                          set.completed
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 text-gray-500'
                        } active:scale-95 transition-all`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Répétitions */}
                      <div>
                        <p className="text-gray-500 text-[10px] mb-1.5">Répétitions</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateSet(exercise.id, set.id, 'reps', -1)}
                            className="bg-gray-800 rounded-lg p-1.5 active:scale-95 transition-transform"
                          >
                            <Minus size={14} className="text-gray-400" />
                          </button>
                          <span className="text-white text-lg font-bold flex-1 text-center">
                            {set.reps}
                          </span>
                          <button
                            onClick={() => updateSet(exercise.id, set.id, 'reps', 1)}
                            className="bg-gray-800 rounded-lg p-1.5 active:scale-95 transition-transform"
                          >
                            <Plus size={14} className="text-gray-400" />
                          </button>
                        </div>
                      </div>

                      {/* Poids */}
                      <div>
                        <p className="text-gray-500 text-[10px] mb-1.5">Poids (kg)</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateSet(exercise.id, set.id, 'weight', -2.5)
                            }
                            className="bg-gray-800 rounded-lg p-1.5 active:scale-95 transition-transform"
                          >
                            <Minus size={14} className="text-gray-400" />
                          </button>
                          <span className="text-white text-lg font-bold flex-1 text-center">
                            {set.weight}
                          </span>
                          <button
                            onClick={() =>
                              updateSet(exercise.id, set.id, 'weight', 2.5)
                            }
                            className="bg-gray-800 rounded-lg p-1.5 active:scale-95 transition-transform"
                          >
                            <Plus size={14} className="text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bouton flottant pour terminer */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4">
        <button
          onClick={handleFinishWorkout}
          className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl py-4 text-base font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-2xl"
        >
          <Check size={20} strokeWidth={3} />
          Terminer l'entraînement
        </button>
      </div>
    </div>
  );
};

export default IronTrack;
