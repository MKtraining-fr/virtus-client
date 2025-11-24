import { supabase } from './supabase';
import { WorkoutExercise, WorkoutProgram, WorkoutSession } from '../types';

const mapSessionToWorkoutSession = (session: any): WorkoutSession => {
  const exercises = Array.isArray(session.exercises)
    ? (session.exercises as WorkoutExercise[])
    : [];

  return {
    id: session.id,
    name: session.name,
    exercises,
    weekNumber: session.week_number ?? 1,
    sessionOrder: session.session_order ?? 1,
  } as WorkoutSession;
};

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
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'upcoming';
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
    // Récupérer les assignations
    const { data: assignments, error: assignmentsError } = await supabase
      .from('program_assignments')
      .select(`
        id,
        program_id,
        start_date,
        end_date,
        current_week,
        current_session,
        status,
        programs (
          id,
          name,
          objective,
          week_count
        )
      `)
      .eq('client_id', clientId)
      .order('start_date', { ascending: false });

    if (assignmentsError) {
      console.error('Erreur lors de la récupération des assignations:', assignmentsError);
      return [];
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    return (assignments || []).map((assignment) => {
      const program = assignment.programs;

      return {
        id: program?.id || assignment.program_id,
        name: program?.name || 'Programme',
        objective: program?.objective || '',
        startDate: assignment.start_date,
        endDate: assignment.end_date || undefined,
        currentWeek: assignment.current_week || 1,
        currentSession: assignment.current_session || 1,
        status:
          (assignment.status as ClientAssignedProgramSummary['status']) || 'active',
        weekCount: program?.week_count || 0,
        assignmentId: assignment.id,
        clientProgramId: program?.id || assignment.program_id,
      };
    });
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
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', clientProgramId)
      .single();

    if (programError || !program) {
      console.error('Erreur lors de la récupération du programme:', programError);
      return null;
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('program_id', clientProgramId)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });

    if (sessionsError) {
      console.error('Erreur lors de la récupération des séances:', sessionsError);
      return null;
    }

    const sessionsByWeek: Record<number, WorkoutSession[]> = {};

    for (const session of sessions || []) {
      const weekNumber = session.week_number ?? 1;

      if (!sessionsByWeek[weekNumber]) {
        sessionsByWeek[weekNumber] = [];
      }

      sessionsByWeek[weekNumber].push(mapSessionToWorkoutSession(session));
    }

    return {
      id: program.id,
      name: program.name,
      objective: program.objective || '',
      weekCount: program.week_count,
      sessionsByWeek,
    } as WorkoutProgram;
  } catch (error) {
    console.error('Erreur globale lors de la récupération des détails du programme:', error);
    return null;
  }
};
