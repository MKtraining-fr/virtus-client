import { supabase } from './supabase';
import { getClientSessionExerciseId, updateSessionStatus } from './clientSessionService';

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
  sets: PerformanceSet[],
  coachId?: string
): Promise<boolean> => {
  try {
    const logsToInsert = sets.map((set) => ({
      client_session_exercise_id: clientSessionExerciseId,
      client_id: clientId,
      coach_id: coachId || null,
      set_number: set.set_number,
      reps_achieved: set.reps_achieved,
      load_achieved: set.load_achieved,
      rpe: set.rpe,
      notes: set.notes,
      performed_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('client_exercise_performance')
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
      .from('client_exercise_performance')
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
  clientSessionId: string, // ✅ CORRECTION: Renommé pour clarifier qu'il s'agit du client_session_id
  performanceLog: any,
  coachId?: string
): Promise<string | null> => {
  try {
    // Extraire les exercices du performanceLog
    const exerciseLogs = performanceLog.exerciseLogs || [];
    
    if (exerciseLogs.length === 0) {
      console.warn('Aucun exercice à enregistrer');
      return null;
    }

    let hasErrors = false;
    let successCount = 0;

    // Pour chaque exercice, enregistrer les performances
    for (const exerciseLog of exerciseLogs) {
      const exerciseId = exerciseLog.exerciseId; // ID de l'exercice dans la table exercises
      const loggedSets = exerciseLog.loggedSets || [];

      // ✅ CORRECTION: Récupérer le client_session_exercise_id correspondant
      const clientSessionExerciseId = await getClientSessionExerciseId(
        clientSessionId,
        exerciseId.toString()
      );

      if (!clientSessionExerciseId) {
        console.error(
          `Impossible de trouver client_session_exercise_id pour exercise_id: ${exerciseId}, session: ${clientSessionId}`
        );
        hasErrors = true;
        continue;
      }
      
      const sets: PerformanceSet[] = loggedSets.map((set: any, index: number) => ({
        set_number: index + 1,
        reps_achieved: parseInt(set.reps) || undefined,
        load_achieved: set.load || undefined,
        rpe: undefined, // Pas de RPE dans l'ancien format
        notes: set.comment || undefined,
      })).filter((set: PerformanceSet) => set.reps_achieved || set.load_achieved);

      if (sets.length > 0) {
        // ✅ CORRECTION: Utiliser le bon ID
        const success = await bulkCreatePerformanceLogs(
          clientSessionExerciseId,
          clientId,
          sets,
          coachId
        );
        
        if (success) {
          successCount++;
        } else {
          console.error(`Échec de sauvegarde pour exercice: ${clientSessionExerciseId}`);
          hasErrors = true;
        }
      }
    }

    // ✅ AJOUT: Mettre à jour le statut de la séance si au moins un exercice a été sauvegardé
    if (successCount > 0) {
      const statusUpdated = await updateSessionStatus(clientSessionId, 'completed');
      if (!statusUpdated) {
        console.warn('Performances enregistrées mais échec de mise à jour du statut de séance');
      }
    }

    // Retourner un ID de succès ou null si tout a échoué
    return successCount > 0 ? `success-${successCount}-exercises` : null;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du log de performance (legacy):', error);
    return null;
  }
};
