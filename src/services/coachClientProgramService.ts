import { supabase } from './supabase';

/**
 * Service pour récupérer les programmes assignés à un client
 * depuis le point de vue du coach (pour affichage dans le profil client)
 */

export interface ClientAssignedProgramSummary {
  id: string;
  name: string;
  objective: string;
  startDate: string;
  endDate?: string;
  currentWeek: number;
  currentSession: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  weekCount: number;
  assignmentId: string;
  clientProgramId: string;
}

/**
 * Récupère tous les programmes assignés à un client (vue coach)
 * 
 * @param clientId - ID du client
 * @returns Liste des programmes assignés avec informations de base
 */
export const getClientAssignedProgramsForCoach = async (
  clientId: string
): Promise<ClientAssignedProgramSummary[]> => {
  try {
    const { data: assignments, error } = await supabase
      .from('program_assignments')
      .select(`
        id,
        start_date,
        end_date,
        current_week,
        current_session,
        status,
        client_program_id,
        client_programs (
          id,
          name,
          objective,
          week_count
        )
      `)
      .eq('client_id', clientId)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des programmes assignés:', error);
      return [];
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    // Mapper les données vers le format attendu
    const programs: ClientAssignedProgramSummary[] = assignments
      .filter((assignment) => assignment.client_programs)
      .map((assignment) => {
        const program = assignment.client_programs as any;
        return {
          id: program.id,
          name: program.name,
          objective: program.objective || '',
          startDate: assignment.start_date,
          endDate: assignment.end_date || undefined,
          currentWeek: assignment.current_week || 1,
          currentSession: assignment.current_session || 1,
          status: assignment.status as 'active' | 'paused' | 'completed' | 'cancelled',
          weekCount: program.week_count,
          assignmentId: assignment.id,
          clientProgramId: assignment.client_program_id,
        };
      });

    return programs;
  } catch (error) {
    console.error('Erreur globale lors de la récupération des programmes assignés:', error);
    return [];
  }
};

/**
 * Récupère les détails complets d'un programme assigné (pour le modal de détails)
 * 
 * @param clientProgramId - ID du programme client
 * @returns Détails complets du programme ou null
 */
export const getClientProgramDetails = async (clientProgramId: string) => {
  try {
    // Récupérer le programme
    const { data: program, error: programError } = await supabase
      .from('client_programs')
      .select('*')
      .eq('id', clientProgramId)
      .single();

    if (programError || !program) {
      console.error('Erreur lors de la récupération du programme:', programError);
      return null;
    }

    // Récupérer les séances
    const { data: sessions, error: sessionsError } = await supabase
      .from('client_sessions')
      .select('*')
      .eq('program_id', clientProgramId)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });

    if (sessionsError) {
      console.error('Erreur lors de la récupération des séances:', sessionsError);
      return null;
    }

    // Récupérer les exercices
    const sessionIds = sessions?.map((s) => s.id) || [];
    
    const { data: exercises, error: exercisesError } = await supabase
      .from('client_session_exercises')
      .select(`
        *,
        exercises (
          id,
          name,
          image_url
        )
      `)
      .in('session_id', sessionIds)
      .order('exercise_order', { ascending: true });

    if (exercisesError) {
      console.error('Erreur lors de la récupération des exercices:', exercisesError);
      return null;
    }

    // Construire la structure sessionsByWeek
    const sessionsByWeek: { [week: number]: any[] } = {};

    for (const session of sessions || []) {
      const weekNumber = session.week_number || 1;
      
      if (!sessionsByWeek[weekNumber]) {
        sessionsByWeek[weekNumber] = [];
      }

      const sessionExercises = exercises?.filter((ex) => ex.session_id === session.id) || [];

      const workoutExercises = sessionExercises.map((ex) => {
        const exerciseInfo = ex.exercises as any;
        return {
          id: ex.id,
          exerciseId: ex.exercise_id,
          name: exerciseInfo?.name || 'Exercice inconnu',
          sets: ex.sets?.toString() || '3',
          details: [{
            reps: ex.reps || '10',
            load: { value: ex.load || '0', unit: 'kg' },
            tempo: ex.tempo || '2-0-2-0',
            rest: ex.rest_time || '60s',
          }],
          intensification: ex.intensification || '',
          notes: ex.notes || '',
          illustrationUrl: exerciseInfo?.image_url || '',
        };
      });

      sessionsByWeek[weekNumber].push({
        id: session.id,
        name: session.name,
        exercises: workoutExercises,
      });
    }

    return {
      id: program.id,
      name: program.name,
      objective: program.objective || '',
      weekCount: program.week_count,
      sessionsByWeek,
    };
  } catch (error) {
    console.error('Erreur globale lors de la récupération des détails du programme:', error);
    return null;
  }
};
