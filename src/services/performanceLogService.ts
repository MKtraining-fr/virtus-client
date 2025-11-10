import { supabase } from './supabase';
import { PerformanceLog, ExerciseLog } from '../types';

/**
 * Sauvegarde un log de performance de séance dans Supabase
 * 
 * @param clientId - ID du client
 * @param programAssignmentId - ID de l'assignement de programme
 * @param sessionId - ID de la séance (client_created_sessions)
 * @param performanceLog - Données de performance de la séance
 * @returns ID du log créé ou null en cas d'erreur
 */
export const savePerformanceLog = async (
  clientId: string,
  programAssignmentId: string | null,
  sessionId: string,
  performanceLog: PerformanceLog
): Promise<string | null> => {
  try {
    // Calculer le tonnage total et la durée (si disponible)
    let totalTonnage = 0;
    
    for (const exerciseLog of performanceLog.exerciseLogs) {
      for (const set of exerciseLog.loggedSets) {
        const reps = parseInt(set.reps, 10) || 0;
        const load = parseFloat(set.load.replace(/[^\d.]/g, '')) || 0;
        totalTonnage += reps * load;
      }
    }

    // Préparer les données pour Supabase
    const { data, error } = await supabase
      .from('performance_logs')
      .insert({
        client_id: clientId,
        program_assignment_id: programAssignmentId,
        session_id: sessionId,
        session_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
        week_number: performanceLog.week,
        session_number: null, // À calculer si nécessaire
        exercises_performed: performanceLog.exerciseLogs,
        total_tonnage: totalTonnage,
        notes: null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erreur lors de la sauvegarde du log de performance:', error);
      return null;
    }

    console.log('Log de performance sauvegardé avec succès:', data.id);
    return data.id;
  } catch (error) {
    console.error('Erreur globale lors de la sauvegarde du log de performance:', error);
    return null;
  }
};

/**
 * Récupère tous les logs de performance d'un client
 * 
 * @param clientId - ID du client
 * @param programAssignmentId - (Optionnel) Filtrer par assignement de programme
 * @returns Liste des logs de performance
 */
export const getClientPerformanceLogs = async (
  clientId: string,
  programAssignmentId?: string
): Promise<PerformanceLog[]> => {
  try {
    let query = supabase
      .from('performance_logs')
      .select('*')
      .eq('client_id', clientId)
      .order('session_date', { ascending: false });

    if (programAssignmentId) {
      query = query.eq('program_assignment_id', programAssignmentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des logs de performance:', error);
      return [];
    }

    // Transformer les données Supabase en format PerformanceLog
    return data.map((log) => ({
      date: new Date(log.session_date).toLocaleDateString('fr-FR'),
      week: log.week_number,
      programName: '', // À récupérer depuis program_assignments si nécessaire
      sessionName: '', // À récupérer depuis client_created_sessions si nécessaire
      exerciseLogs: log.exercises_performed as ExerciseLog[],
    }));
  } catch (error) {
    console.error('Erreur globale lors de la récupération des logs de performance:', error);
    return [];
  }
};

/**
 * Récupère les logs de performance avec les détails du programme et de la séance
 * 
 * @param clientId - ID du client
 * @param limit - Nombre maximum de logs à récupérer
 * @returns Liste des logs avec détails
 */
export const getClientPerformanceLogsWithDetails = async (
  clientId: string,
  limit: number = 50
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('performance_logs')
      .select(`
        id,
        session_date,
        week_number,
        session_number,
        exercises_performed,
        total_tonnage,
        total_duration_minutes,
        notes,
        created_at,
        program_assignments (
          id,
          client_created_programs (
            name,
            objective
          )
        ),
        client_created_sessions (
          name
        )
      `)
      .eq('client_id', clientId)
      .order('session_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur lors de la récupération des logs détaillés:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale lors de la récupération des logs détaillés:', error);
    return [];
  }
};

/**
 * Marque un log de performance comme vu par le coach
 * 
 * @param performanceLogId - ID du log de performance
 * @returns true si succès, false sinon
 */
export const markPerformanceLogAsViewed = async (
  performanceLogId: string
): Promise<boolean> => {
  try {
    // Mettre à jour tous les exerciseLogs pour marquer viewedByCoach = true
    const { data: logData, error: fetchError } = await supabase
      .from('performance_logs')
      .select('exercises_performed')
      .eq('id', performanceLogId)
      .single();

    if (fetchError || !logData) {
      console.error('Erreur lors de la récupération du log:', fetchError);
      return false;
    }

    const exerciseLogs = logData.exercises_performed as ExerciseLog[];
    const updatedLogs = exerciseLogs.map((log) => ({
      ...log,
      loggedSets: log.loggedSets.map((set) => ({
        ...set,
        viewedByCoach: true,
      })),
    }));

    const { error: updateError } = await supabase
      .from('performance_logs')
      .update({ exercises_performed: updatedLogs })
      .eq('id', performanceLogId);

    if (updateError) {
      console.error('Erreur lors de la mise à jour du statut vu:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors du marquage comme vu:', error);
    return false;
  }
};

/**
 * Supprime un log de performance
 * 
 * @param performanceLogId - ID du log à supprimer
 * @returns true si succès, false sinon
 */
export const deletePerformanceLog = async (
  performanceLogId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('performance_logs')
      .delete()
      .eq('id', performanceLogId);

    if (error) {
      console.error('Erreur lors de la suppression du log:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la suppression du log:', error);
    return false;
  }
};
