import { ExerciseLog, PerformanceLog } from '../types';

/**
 * Interface pour les statistiques de séance
 */
export interface SessionStats {
  // Métriques de base
  completionRate: number; // Pourcentage 0-100
  totalSets: number;
  completedSets: number;
  totalExercises: number;
  completedExercises: number;
  
  // Métriques de performance
  averageReps: number;
  averageLoad: number;
  totalTonnage: number;
  loadUnit: string; // 'kg' | 'lbs'
  
  // Comparaison avec semaine précédente
  previousWeekStats?: {
    totalTonnage: number;
    averageLoad: number;
    averageReps: number;
  };
  
  // Progression (calculée)
  tonnageChange?: number; // Pourcentage
  loadChange?: number; // Pourcentage
  repsChange?: number; // Pourcentage
  
  // Métriques optionnelles
  sessionDuration?: number; // Secondes
  personalRecords?: Array<{
    exerciseName: string;
    load: number;
    reps: number;
  }>;
}

/**
 * Interface pour une séance d'entraînement
 */
interface WorkoutSession {
  name: string;
  exercises: Array<{
    id: number;
    exerciseId: number;
    name: string;
    sets: string;
    details?: Array<{
      load: { value: string; unit: string };
      reps: string;
      rest: string;
      tempo: string;
    }>;
  }>;
}

/**
 * Calcule les statistiques d'un log de performance précédent
 */
function calculatePreviousStats(previousLog: PerformanceLog): {
  totalTonnage: number;
  averageLoad: number;
  averageReps: number;
} {
  let totalReps = 0;
  let totalLoad = 0;
  let totalTonnage = 0;
  let totalSets = 0;
  let setsWithLoad = 0;
  
  previousLog.exerciseLogs.forEach(log => {
    log.loggedSets.forEach(set => {
      const reps = parseFloat(set.reps) || 0;
      const load = parseFloat(set.load) || 0;
      
      totalReps += reps;
      totalSets++;
      
      if (load > 0) {
        totalLoad += load;
        setsWithLoad++;
      }
      
      totalTonnage += reps * load;
    });
  });
  
  return {
    totalTonnage: Math.round(totalTonnage),
    averageLoad: setsWithLoad > 0 ? totalLoad / setsWithLoad : 0,
    averageReps: totalSets > 0 ? totalReps / totalSets : 0,
  };
}

/**
 * Calcule les statistiques complètes d'une séance
 * 
 * @param exerciseLogs - Logs des exercices réalisés
 * @param activeSession - Séance programmée
 * @param previousWeekLog - Log de la même séance de la semaine précédente (optionnel)
 * @returns Statistiques calculées de la séance
 */
export function calculateSessionStats(
  exerciseLogs: ExerciseLog[],
  activeSession: WorkoutSession,
  previousWeekLog?: PerformanceLog
): SessionStats {
  // 1. Calculer les séries totales programmées
  const totalSets = activeSession.exercises.reduce(
    (sum, ex) => sum + parseInt(ex.sets || '0', 10),
    0
  );
  
  // 2. Compter les séries réalisées
  const completedSets = exerciseLogs.reduce(
    (sum, log) => sum + log.loggedSets.length,
    0
  );
  
  // 3. Calculer le taux de complétion
  const completionRate = totalSets > 0 
    ? Math.round((completedSets / totalSets) * 100) 
    : 0;
  
  // 4. Calculer les moyennes et le tonnage
  let totalReps = 0;
  let totalLoad = 0;
  let totalTonnage = 0;
  let setsWithLoad = 0;
  
  exerciseLogs.forEach(log => {
    log.loggedSets.forEach(set => {
      const reps = parseFloat(set.reps) || 0;
      const load = parseFloat(set.load) || 0;
      
      totalReps += reps;
      if (load > 0) {
        totalLoad += load;
        setsWithLoad++;
      }
      totalTonnage += reps * load;
    });
  });
  
  const averageReps = completedSets > 0 
    ? totalReps / completedSets 
    : 0;
  const averageLoad = setsWithLoad > 0 
    ? totalLoad / setsWithLoad 
    : 0;
  
  // 5. Calculer les changements vs semaine précédente
  let previousWeekStats: SessionStats['previousWeekStats'];
  let tonnageChange: number | undefined;
  let loadChange: number | undefined;
  let repsChange: number | undefined;
  
  if (previousWeekLog) {
    previousWeekStats = calculatePreviousStats(previousWeekLog);
    
    tonnageChange = previousWeekStats.totalTonnage > 0
      ? ((totalTonnage - previousWeekStats.totalTonnage) / previousWeekStats.totalTonnage) * 100
      : undefined;
      
    loadChange = previousWeekStats.averageLoad > 0
      ? ((averageLoad - previousWeekStats.averageLoad) / previousWeekStats.averageLoad) * 100
      : undefined;
      
    repsChange = previousWeekStats.averageReps > 0
      ? ((averageReps - previousWeekStats.averageReps) / previousWeekStats.averageReps) * 100
      : undefined;
  }
  
  // 6. Déterminer l'unité de charge (kg par défaut, peut être étendu)
  const loadUnit = 'kg';
  
  return {
    completionRate,
    totalSets,
    completedSets,
    totalExercises: activeSession.exercises.length,
    completedExercises: exerciseLogs.length,
    averageReps: Math.round(averageReps * 10) / 10,
    averageLoad: Math.round(averageLoad * 10) / 10,
    totalTonnage: Math.round(totalTonnage),
    loadUnit,
    previousWeekStats,
    tonnageChange: tonnageChange !== undefined ? Math.round(tonnageChange * 10) / 10 : undefined,
    loadChange: loadChange !== undefined ? Math.round(loadChange * 10) / 10 : undefined,
    repsChange: repsChange !== undefined ? Math.round(repsChange * 10) / 10 : undefined,
  };
}

/**
 * Formate un changement de pourcentage pour l'affichage
 * 
 * @param change - Pourcentage de changement
 * @returns Objet avec le texte formaté, la couleur et l'icône
 */
export function formatPercentageChange(change: number | undefined): {
  text: string;
  color: string;
  icon: '↑' | '↓' | '→';
} {
  if (change === undefined) {
    return {
      text: 'Première séance',
      color: 'text-gray-600 dark:text-client-subtle',
      icon: '→',
    };
  }
  
  const absChange = Math.abs(change);
  const sign = change > 0 ? '+' : '';
  
  if (change > 0.5) {
    return {
      text: `${sign}${absChange.toFixed(1)}%`,
      color: 'text-green-600 dark:text-green-400',
      icon: '↑',
    };
  } else if (change < -0.5) {
    return {
      text: `${sign}${absChange.toFixed(1)}%`,
      color: 'text-red-600 dark:text-red-400',
      icon: '↓',
    };
  } else {
    return {
      text: 'Maintenu',
      color: 'text-gray-600 dark:text-client-subtle',
      icon: '→',
    };
  }
}

/**
 * Formate le tonnage pour l'affichage (kg ou tonnes)
 * 
 * @param tonnage - Tonnage en kg
 * @returns Texte formaté avec unité appropriée
 */
export function formatTonnage(tonnage: number): string {
  if (tonnage >= 1000) {
    return `${(tonnage / 1000).toFixed(1)} tonnes`;
  }
  return `${tonnage} kg`;
}
