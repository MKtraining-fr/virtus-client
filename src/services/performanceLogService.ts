/**
 * Service pour la gestion des logs de performance
 * Permet aux clients d'enregistrer leurs performances pour chaque série d'exercice
 * 
 * Version refactorisée - 2025-11-19
 */

import { supabase } from './supabase';

export interface PerformanceLog {
  id: string;
  client_session_exercise_id: string;
  client_id: string;
  set_number: number;
  reps_achieved: number | null;
  load_achieved: string | null;
  rpe: number | null; // Rating of Perceived Exertion (1-10)
  notes: string | null;
  performed_at: string;
}

export interface CreatePerformanceLogInput {
  client_session_exercise_id: string;
  client_id: string;
  set_number: number;
  reps_achieved?: number;
  load_achieved?: string;
  rpe?: number;
  notes?: string;
}

/**
 * Enregistre un log de performance pour une série d'exercice
 * 
 * @param input - Données du log de performance
 * @returns Le log créé ou null en cas d'erreur
 */
export const createPerformanceLog = async (
  input: CreatePerformanceLogInput
): Promise<PerformanceLog | null> => {
  try {
    const { data, error } = await supabase
      .from('performance_logs')
      .insert({
        client_session_exercise_id: input.client_session_exercise_id,
        client_id: input.client_id,
        set_number: input.set_number,
        reps_achieved: input.reps_achieved || null,
        load_achieved: input.load_achieved || null,
        rpe: input.rpe || null,
        notes: input.notes || null,
        performed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du log de performance:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur globale:', error);
    return null;
  }
};

/**
 * Met à jour un log de performance existant
 * 
 * @param logId - ID du log à mettre à jour
 * @param updates - Champs à mettre à jour
 * @returns true si succès, false sinon
 */
export const updatePerformanceLog = async (
  logId: string,
  updates: Partial<Omit<CreatePerformanceLogInput, 'client_session_exercise_id' | 'client_id' | 'set_number'>>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('performance_logs')
      .update(updates)
      .eq('id', logId);

    if (error) {
      console.error('Erreur lors de la mise à jour du log:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale:', error);
    return false;
  }
};

/**
 * Récupère tous les logs de performance pour une séance client
 * 
 * @param sessionId - ID de la séance client
 * @returns Liste des logs de performance
 */
export const getPerformanceLogsForSession = async (
  sessionId: string
): Promise<PerformanceLog[]> => {
  try {
    const { data, error } = await supabase
      .from('performance_logs')
      .select(`
        *,
        client_session_exercises!inner(client_session_id)
      `)
      .eq('client_session_exercises.client_session_id', sessionId)
      .order('performed_at', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};

/**
 * Récupère l'historique des performances pour un exercice spécifique d'un client
 * 
 * @param clientId - ID du client
 * @param exerciseId - ID de l'exercice
 * @param limit - Nombre maximum de résultats (par défaut 50)
 * @returns Liste des logs de performance
 */
export const getPerformanceHistoryForExercise = async (
  clientId: string,
  exerciseId: string,
  limit: number = 50
): Promise<PerformanceLog[]> => {
  try {
    const { data, error } = await supabase
      .from('performance_logs')
      .select(`
        *,
        client_session_exercises!inner(exercise_id)
      `)
      .eq('client_id', clientId)
      .eq('client_session_exercises.exercise_id', exerciseId)
      .order('performed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};

/**
 * Supprime un log de performance
 * 
 * @param logId - ID du log à supprimer
 * @returns true si succès, false sinon
 */
export const deletePerformanceLog = async (logId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('performance_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      console.error('Erreur lors de la suppression du log:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale:', error);
    return false;
  }
};

/**
 * Enregistre les performances pour toutes les séries d'un exercice en une fois
 * 
 * @param clientSessionExerciseId - ID de l'exercice de la séance client
 * @param clientId - ID du client
 * @param sets - Tableau des performances par série
 * @returns true si succès, false sinon
 */
export const bulkCreatePerformanceLogs = async (
  clientSessionExerciseId: string,
  clientId: string,
  sets: Array<{
    set_number: number;
    reps_achieved?: number;
    load_achieved?: string;
    rpe?: number;
    notes?: string;
  }>
): Promise<boolean> => {
  try {
    const logs = sets.map((set) => ({
      client_session_exercise_id: clientSessionExerciseId,
      client_id: clientId,
      set_number: set.set_number,
      reps_achieved: set.reps_achieved || null,
      load_achieved: set.load_achieved || null,
      rpe: set.rpe || null,
      notes: set.notes || null,
      performed_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('performance_logs')
      .insert(logs);

    if (error) {
      console.error('Erreur lors de la création en masse des logs:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale:', error);
    return false;
  }
};

/**
 * FONCTION DE COMPATIBILITÉ - À SUPPRIMER APRÈS MIGRATION UI
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
  console.warn('savePerformanceLog est déprécié. Utilisez bulkCreatePerformanceLogs à la place.');
  
  // Pour l'instant, on retourne juste null pour ne pas casser le build
  // Cette fonction devra être implémentée correctement lors de la migration UI
  return null;
};
