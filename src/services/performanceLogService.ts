import { supabase } from './supabase';

/**
 * Service pour gérer les logs de performance des clients
 */

export interface PerformanceSet {
  set_number: number;
  reps_achieved?: number;
  load_achieved?: string;
  rpe?: number;
  notes?: string;
}

/**
 * Enregistre les performances pour plusieurs séries d'un exercice
 * 
 * @param clientSessionExerciseId - ID de l'exercice dans client_session_exercises
 * @param clientId - ID du client
 * @param sets - Tableau des performances par série
 * @returns true si succès, false sinon
 */
export const bulkCreatePerformanceLogs = async (
  clientSessionExerciseId: string,
  clientId: string,
  sets: PerformanceSet[]
): Promise<boolean> => {
  try {
    const logsToInsert = sets.map((set) => ({
      client_session_exercise_id: clientSessionExerciseId,
      client_id: clientId,
      set_number: set.set_number,
      reps_achieved: set.reps_achieved,
      load_achieved: set.load_achieved,
      rpe: set.rpe,
      notes: set.notes,
      performed_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('performance_logs')
      .insert(logsToInsert);

    if (error) {
      console.error('Erreur lors de l\'enregistrement des performances:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de l\'enregistrement des performances:', error);
    return false;
  }
};

/**
 * Récupère les performances d'un client pour un exercice donné
 * 
 * @param clientSessionExerciseId - ID de l'exercice
 * @param clientId - ID du client
 * @returns Tableau des performances ou tableau vide
 */
export const getPerformanceLogs = async (
  clientSessionExerciseId: string,
  clientId: string
): Promise<PerformanceSet[]> => {
  try {
    const { data, error } = await supabase
      .from('performance_logs')
      .select('*')
      .eq('client_session_exercise_id', clientSessionExerciseId)
      .eq('client_id', clientId)
      .order('set_number', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des performances:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale lors de la récupération des performances:', error);
    return [];
  }
};

/**
 * FONCTION DE COMPATIBILITÉ - Pour migration progressive
 * Sauvegarde un log de performance de séance (ancienne signature)
 * 
 * @deprecated Utiliser bulkCreatePerformanceLogs à la place
 */
export const savePerformanceLog = async (
  clientId: string,
  programAssignmentId: string | null,
  sessionId: string,
  performanceLog: any
): Promise<string | null> => {
  try {
    // Extraire les exercices du performanceLog
    const exerciseLogs = performanceLog.exerciseLogs || [];
    
    if (exerciseLogs.length === 0) {
      console.warn('Aucun exercice à enregistrer');
      return null;
    }

    // Pour chaque exercice, enregistrer les performances
    for (const exerciseLog of exerciseLogs) {
      const exerciseId = exerciseLog.exerciseId;
      const loggedSets = exerciseLog.loggedSets || [];

      // Trouver le client_session_exercise_id correspondant
      // On suppose que exerciseId est déjà le client_session_exercise_id
      // Sinon il faudrait faire une requête pour le trouver
      
      const sets: PerformanceSet[] = loggedSets.map((set: any, index: number) => ({
        set_number: index + 1,
        reps_achieved: parseInt(set.reps) || undefined,
        load_achieved: set.load || undefined,
        rpe: undefined, // Pas de RPE dans l'ancien format
        notes: set.comment || undefined,
      })).filter((set: PerformanceSet) => set.reps_achieved || set.load_achieved);

      if (sets.length > 0) {
        await bulkCreatePerformanceLogs(exerciseId.toString(), clientId, sets);
      }
    }

    // Retourner un ID fictif pour la compatibilité
    return 'legacy-log-id';
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du log de performance (legacy):', error);
    return null;
  }
};
