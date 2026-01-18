import { create } from 'zustand';
import type { WorkoutExercise, PerformanceSet } from '../types';

interface WorkoutState {
  // Navigation
  currentExerciseIndex: number;
  currentSetIndex: number;

  // Données de la séance
  exercises: WorkoutExercise[];
  performanceData: Record<string, PerformanceSet[]>;

  // État de l'UI
  isRestTimerActive: boolean;
  restTimeLeft: number;
  isOptionsMenuOpen: boolean;
  isVideoRecording: boolean;

  // Actions - Navigation
  goToSet: (setIndex: number) => void;
  nextSet: () => void;
  previousSet: () => void;
  goToExercise: (index: number) => void;
  nextExercise: () => void;
  previousExercise: () => void;

  // Actions - Données
  updateSetData: (
    exerciseId: string,
    setIndex: number,
    data: Partial<PerformanceSet>
  ) => void;
  completeSet: (exerciseId: string, setIndex: number) => void;

  // Actions - UI
  startRestTimer: (duration: number) => void;
  stopRestTimer: () => void;
  toggleOptionsMenu: () => void;
  startVideoRecording: () => void;
  stopVideoRecording: () => void;

  // Initialisation
  initializeWorkout: (exercises: WorkoutExercise[]) => void;
  reset: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  // État initial
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  exercises: [],
  performanceData: {},
  isRestTimerActive: false,
  restTimeLeft: 0,
  isOptionsMenuOpen: false,
  isVideoRecording: false,

  // Navigation - Séries
  goToSet: (setIndex: number) => {
    const { exercises, currentExerciseIndex } = get();
    const currentExercise = exercises[currentExerciseIndex];
    if (!currentExercise) return;

    const totalSets = parseInt(currentExercise.sets, 10) || 0;
    if (setIndex >= 0 && setIndex < totalSets) {
      set({ currentSetIndex: setIndex });

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  },

  nextSet: () => {
    const { currentSetIndex, exercises, currentExerciseIndex } = get();
    const currentExercise = exercises[currentExerciseIndex];
    if (!currentExercise) return;

    const totalSets = parseInt(currentExercise.sets, 10) || 0;
    if (currentSetIndex < totalSets - 1) {
      get().goToSet(currentSetIndex + 1);
    }
  },

  previousSet: () => {
    const { currentSetIndex } = get();
    if (currentSetIndex > 0) {
      get().goToSet(currentSetIndex - 1);
    }
  },

  // Navigation - Exercices
  goToExercise: (index: number) => {
    const { exercises } = get();
    if (index >= 0 && index < exercises.length) {
      set({
        currentExerciseIndex: index,
        currentSetIndex: 0, // Reset à la première série
      });

      // Haptic feedback plus fort
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
    }
  },

  nextExercise: () => {
    const { currentExerciseIndex, exercises } = get();
    if (currentExerciseIndex < exercises.length - 1) {
      get().goToExercise(currentExerciseIndex + 1);
    }
  },

  previousExercise: () => {
    const { currentExerciseIndex } = get();
    if (currentExerciseIndex > 0) {
      get().goToExercise(currentExerciseIndex - 1);
    }
  },

  // Données - Performances
  updateSetData: (exerciseId: string, setIndex: number, data: Partial<PerformanceSet>) => {
    set((state) => {
      const exerciseData = state.performanceData[exerciseId] || [];
      const updatedExerciseData = [...exerciseData];

      // Assurer que l'index existe
      while (updatedExerciseData.length <= setIndex) {
        updatedExerciseData.push({ reps: '', load: '' });
      }

      updatedExerciseData[setIndex] = {
        ...updatedExerciseData[setIndex],
        ...data,
      };

      return {
        performanceData: {
          ...state.performanceData,
          [exerciseId]: updatedExerciseData,
        },
      };
    });
  },

  completeSet: (exerciseId: string, setIndex: number) => {
    const { updateSetData, nextSet } = get();
    updateSetData(exerciseId, setIndex, { isCompleted: true });
    nextSet();
  },

  // UI - Timer
  startRestTimer: (duration: number) => {
    set({ isRestTimerActive: true, restTimeLeft: duration });
  },

  stopRestTimer: () => {
    set({ isRestTimerActive: false, restTimeLeft: 0 });
  },

  // UI - Options
  toggleOptionsMenu: () => {
    set((state) => ({ isOptionsMenuOpen: !state.isOptionsMenuOpen }));
  },

  // UI - Vidéo
  startVideoRecording: () => {
    set({ isVideoRecording: true });
  },

  stopVideoRecording: () => {
    set({ isVideoRecording: false });
  },

  // Initialisation
  initializeWorkout: (exercises: WorkoutExercise[]) => {
    const performanceData: Record<string, PerformanceSet[]> = {};

    exercises.forEach((exercise) => {
      const totalSets = parseInt(exercise.sets, 10) || 0;
      performanceData[exercise.id.toString()] = Array.from(
        { length: totalSets },
        (): PerformanceSet => ({ reps: '', load: '' })
      );
    });

    set({
      exercises,
      performanceData,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
    });
  },

  // Reset
  reset: () => {
    set({
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      exercises: [],
      performanceData: {},
      isRestTimerActive: false,
      restTimeLeft: 0,
      isOptionsMenuOpen: false,
      isVideoRecording: false,
    });
  },
}));
