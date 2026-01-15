/**
 * Utilitaires pour gérer les variations par semaine des exercices
 */

interface WorkoutExerciseBase {
  id: number;
  sets: number | string;
  reps?: string;
  load?: string;
  tempo?: string;
  restTime?: string;
  notes?: string | null;
  isDetailed?: boolean;
  details?: Array<{
    reps: string;
    load: { value: string; unit: 'kg' | 'lbs' | '%' | '@' };
    tempo: string;
    rest: string;
  }>;
  intensification?: { id: number; value: string }[];
  weekVariations?: Record<number, Partial<WorkoutExerciseBase>>;
}

/**
 * Récupère les données d'un exercice pour une semaine spécifique
 * Si la semaine a des variations, elles sont fusionnées avec les valeurs par défaut
 */
export function getExerciseDataForWeek<T extends WorkoutExerciseBase>(
  exercise: T,
  week: number
): T {
  if (!exercise.weekVariations || !exercise.weekVariations[week]) {
    // Pas de variation pour cette semaine, retourner les valeurs par défaut
    return exercise;
  }

  // Fusionner les valeurs par défaut avec les variations de la semaine
  const variation = exercise.weekVariations[week];
  return {
    ...exercise,
    sets: variation.sets ?? exercise.sets,
    reps: variation.reps ?? exercise.reps,
    load: variation.load ?? exercise.load,
    tempo: variation.tempo ?? exercise.tempo,
    restTime: variation.restTime ?? exercise.restTime,
    notes: variation.notes ?? exercise.notes,
    isDetailed: variation.isDetailed ?? exercise.isDetailed,
    details: variation.details ?? exercise.details,
    intensification: variation.intensification ?? exercise.intensification,
  };
}

/**
 * Met à jour un champ d'un exercice pour une semaine spécifique
 */
export function setExerciseDataForWeek<T extends WorkoutExerciseBase>(
  exercise: T,
  week: number,
  field: string,
  value: any
): T {
  const weekVariations = exercise.weekVariations || {};
  const currentVariation = weekVariations[week] || {};

  // Si c'est la semaine 1 (valeurs par défaut), mettre à jour directement l'exercice
  if (week === 1) {
    return {
      ...exercise,
      [field]: value,
    };
  }

  // Pour les autres semaines, stocker dans weekVariations
  return {
    ...exercise,
    weekVariations: {
      ...weekVariations,
      [week]: {
        ...currentVariation,
        [field]: value,
      },
    },
  };
}

/**
 * Duplique les données d'une semaine source vers des semaines cibles
 */
export function duplicateWeekData<T extends WorkoutExerciseBase>(
  exercise: T,
  sourceWeek: number,
  targetWeeks: number[]
): T {
  const sourceData = getExerciseDataForWeek(exercise, sourceWeek);
  const weekVariations = exercise.weekVariations || {};

  const newVariations = { ...weekVariations };

  targetWeeks.forEach((targetWeek) => {
    if (targetWeek === 1) {
      // Ne pas créer de variation pour la semaine 1 (valeurs par défaut)
      return;
    }

    newVariations[targetWeek] = {
      sets: sourceData.sets,
      reps: sourceData.reps,
      load: sourceData.load,
      tempo: sourceData.tempo,
      restTime: sourceData.restTime,
      notes: sourceData.notes,
      isDetailed: sourceData.isDetailed,
      details: sourceData.details ? [...sourceData.details] : undefined,
      intensification: sourceData.intensification ? [...sourceData.intensification] : undefined,
    };
  });

  return {
    ...exercise,
    weekVariations: newVariations,
  };
}

/**
 * Réinitialise les données d'une semaine aux valeurs par défaut
 */
export function resetWeekData<T extends WorkoutExerciseBase>(
  exercise: T,
  week: number
): T {
  if (week === 1) {
    // Ne pas réinitialiser la semaine 1 (valeurs par défaut)
    return exercise;
  }

  if (!exercise.weekVariations || !exercise.weekVariations[week]) {
    // Pas de variation pour cette semaine, rien à réinitialiser
    return exercise;
  }

  const { [week]: removed, ...remainingVariations } = exercise.weekVariations;

  return {
    ...exercise,
    weekVariations:
      Object.keys(remainingVariations).length > 0 ? remainingVariations : undefined,
  };
}

/**
 * Vérifie si une semaine a été personnalisée
 */
export function isWeekCustomized<T extends WorkoutExerciseBase>(
  exercise: T,
  week: number
): boolean {
  if (week === 1) {
    return false; // La semaine 1 est toujours les valeurs par défaut
  }

  return !!(exercise.weekVariations && exercise.weekVariations[week]);
}

/**
 * Récupère la liste des semaines personnalisées
 */
export function getCustomizedWeeks<T extends WorkoutExerciseBase>(
  exercise: T
): number[] {
  if (!exercise.weekVariations) {
    return [];
  }

  return Object.keys(exercise.weekVariations)
    .map((week) => parseInt(week, 10))
    .sort((a, b) => a - b);
}
