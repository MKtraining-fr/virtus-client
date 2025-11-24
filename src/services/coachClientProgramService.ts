import { supabase } from './supabase';
import { WorkoutExercise, WorkoutProgram, WorkoutSession } from '../types';

const mapClientSessionToWorkoutSession = (
  session: any,
  indexOffset = 0
): WorkoutSession => {
  const exercises = Array.isArray(session.client_session_exercises)
    ? (session.client_session_exercises as any[])
    : [];

  const mappedExercises: WorkoutExercise[] = exercises.map((exercise, idx) => ({
    id: idx + 1 + indexOffset,
    dbId: exercise.id,
    exerciseId: exercise.exercise_id,
    name: exercise.exercises?.name || 'Exercice',
    illustrationUrl: exercise.exercises?.image_url || undefined,
    sets: exercise.sets ?? '',
    reps: exercise.reps ?? '',
    load: exercise.load ?? '',
    tempo: exercise.tempo ?? '',
    restTime: exercise.rest_time ?? '',
    intensification: Array.isArray(exercise.intensification)
      ? exercise.intensification.map((value: any, i: number) => ({
          id: i + 1,
          value: String(value),
        }))
      : [],
    notes: exercise.notes ?? undefined,
  }));

  return {
    id: session.id,
    name: session.name,
    exercises: mappedExercises,
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
  status: 'upcoming' | 'active' | 'completed' | 'paused' | 'archived';
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
    const { data: assignments, error: assignmentsError } = await supabase
      .from('program_assignments')
      .select(
        'id, start_date, end_date, current_week, current_session_order, status'
      )
      .eq('client_id', clientId)
      .order('start_date', { ascending: false });

    if (assignmentsError) {
      console.error('Erreur lors de la récupération des assignations:', assignmentsError);
      return [];
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    const assignmentIds = assignments.map((a) => a.id);
    const { data: clientPrograms, error: clientProgramsError } = await supabase
      .from('client_programs')
      .select('id, assignment_id, name, objective, week_count')
      .in('assignment_id', assignmentIds);

    if (clientProgramsError) {
      console.error(
        'Erreur lors de la récupération des programmes clients:',
        clientProgramsError
      );
      return [];
    }

    return (clientPrograms || []).map((program) => {
      const assignment = assignments.find((a) => a.id === program.assignment_id);

      return {
        id: program.id,
        name: program.name || 'Programme',
        objective: program.objective || '',
        startDate: assignment?.start_date || '',
        endDate: assignment?.end_date || undefined,
        currentWeek: assignment?.current_week || 1,
        currentSession: assignment?.current_session_order || 1,
        status:
          (assignment?.status as ClientAssignedProgramSummary['status']) || 'active',
        weekCount: program.week_count || 0,
        assignmentId: assignment?.id || program.assignment_id,
        clientProgramId: program.id,
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
      .from('client_sessions')
      .select(`
        id,
        client_program_id,
        name,
        week_number,
        session_order,
        client_session_exercises (
          id,
          exercise_id,
          sets,
          reps,
          load,
          tempo,
          rest_time,
          intensification,
          notes,
          exercises (
            id,
            name,
            image_url
          )
        )
      `)
      .eq('client_program_id', clientProgramId)
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

      sessionsByWeek[weekNumber].push(
        mapClientSessionToWorkoutSession(session, sessionsByWeek[weekNumber].length)
      );
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
