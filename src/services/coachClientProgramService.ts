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
      .from('client_programs')
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

/**
 * Interface pour les séances complétées d'un client
 */
export interface ClientCompletedSession {
  id: string;
  name: string;
  week_number: number;
  session_order: number;
  status: string;
  completed_at: string;
  client_id: string;
  client_program_id: string;
  client_programs?: {
    id: string;
    name: string;
    coach_id: string;
  };
  client_session_exercises?: Array<{
    id: string;
    exercise_id: string;
    sets: number | null;
    reps: string | null;
    load: string | null;
    exercises?: {
      id: string;
      name: string;
      image_url?: string;
    };
  }>;
}

/**
 * Interface pour les détails de performance d'une séance
 */
export interface SessionPerformanceDetails {
  id: string;
  name: string;
  completed_at: string;
  client_session_exercises?: Array<{
    id: string;
    exercise_id: string;
    sets: number | null;
    reps: string | null;
    load: string | null;
    exercises?: {
      id: string;
      name: string;
    };
    client_exercise_performance?: Array<{
      id: string;
      set_number: number;
      reps_achieved: number | null;
      load_achieved: string | null;
      rpe: number | null;
      notes: string | null;
      performed_at: string;
    }>;
  }>;
}

/**
 * Récupère les séances complétées d'un ou plusieurs clients pour un coach
 * 
 * @param coachId - ID du coach
 * @param clientId - ID du client (optionnel, pour filtrer par client)
 * @returns Liste des séances complétées avec détails
 */
export const getClientCompletedSessions = async (
  coachId: string,
  clientId?: string
): Promise<ClientCompletedSession[]> => {
  try {
    let query = supabase
      .from('client_sessions')
      .select(`
        id,
        name,
        week_number,
        session_order,
        status,
        completed_at,
        client_id,
        client_program_id,
        client_programs!inner (
          id,
          name,
          coach_id
        ),
        client_session_exercises (
          id,
          exercise_id,
          sets,
          reps,
          load,
          exercises (
            id,
            name,
            image_url
          )
        )
      `)
      .eq('client_programs.coach_id', coachId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des séances complétées:', error);
      return [];
    }

    return (data || []) as ClientCompletedSession[];
  } catch (error) {
    console.error('Erreur globale lors de la récupération des séances:', error);
    return [];
  }
};

/**
 * Récupère les détails de performance d'une séance spécifique
 * 
 * @param sessionId - ID de la séance
 * @returns Détails de performance avec logs ou null
 */
export const getSessionPerformanceDetails = async (
  sessionId: string
): Promise<SessionPerformanceDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('client_sessions')
      .select(`
        id,
        name,
        completed_at,
        client_session_exercises (
          id,
          exercise_id,
          sets,
          reps,
          load,
          exercises (
            id,
            name
          ),
          client_exercise_performance (
            id,
            set_number,
            reps_achieved,
            load_achieved,
            rpe,
            notes,
            performed_at
          )
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération des détails de performance:', error);
      return null;
    }

    return data as SessionPerformanceDetails;
  } catch (error) {
    console.error('Erreur globale lors de la récupération des détails:', error);
    return null;
  }
};

/**
 * Récupère les statistiques d'entraînement d'un client
 * 
 * @param clientId - ID du client
 * @param coachId - ID du coach (pour vérifier l'accès)
 * @returns Statistiques d'entraînement
 */
export const getClientTrainingStats = async (
  clientId: string,
  coachId: string
): Promise<{
  totalSessions: number;
  completedSessions: number;
  skippedSessions: number;
  pendingSessions: number;
  lastSessionDate: string | null;
} | null> => {
  try {
    // Vérifier que le client appartient bien au coach
    const { data: client, error: clientError } = await supabase
      .from('profiles')
      .select('id, coach_id')
      .eq('id', clientId)
      .eq('coach_id', coachId)
      .single();

    if (clientError || !client) {
      console.error('Client non trouvé ou non autorisé:', clientError);
      return null;
    }

    // Récupérer toutes les séances du client
    const { data: sessions, error: sessionsError } = await supabase
      .from('client_sessions')
      .select('id, status, completed_at')
      .eq('client_id', clientId);

    if (sessionsError) {
      console.error('Erreur lors de la récupération des séances:', sessionsError);
      return null;
    }

    const totalSessions = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
    const skippedSessions = sessions?.filter(s => s.status === 'skipped').length || 0;
    const pendingSessions = sessions?.filter(s => s.status === 'pending').length || 0;

    // Trouver la date de la dernière séance complétée
    const completedSessionsWithDate = sessions?.filter(s => s.status === 'completed' && s.completed_at);
    const lastSessionDate = completedSessionsWithDate && completedSessionsWithDate.length > 0
      ? completedSessionsWithDate.sort((a, b) => 
          new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
        )[0].completed_at
      : null;

    return {
      totalSessions,
      completedSessions,
      skippedSessions,
      pendingSessions,
      lastSessionDate,
    };
  } catch (error) {
    console.error('Erreur globale lors de la récupération des statistiques:', error);
    return null;
  }
};

/**
 * Interface pour les logs de performance avec détails
 */
export interface PerformanceLogDetail {
  id: string;
  session_date: string;
  week_number: number;
  session_number: number;
  exercises_performed: any[];
  total_tonnage: number;
  total_duration_minutes: number;
  notes: string;
  created_at: string;
  program_assignments?: {
    id: string;
    client_programs?: {
      name: string;
      objective: string;
    };
  };
  client_sessions?: {
    name: string;
  };
}

/**
 * Récupère les logs de performance d'un client avec détails complets
 * Compatible avec l'ancienne interface mais utilise les nouvelles tables
 * 
 * @param clientId - ID du client
 * @param limit - Nombre maximum de logs à récupérer
 * @returns Liste des logs de performance avec détails
 */
export const getClientPerformanceLogsWithDetails = async (
  clientId: string,
  limit: number = 100
): Promise<PerformanceLogDetail[]> => {
  try {
    // Récupérer les séances complétées du client
    const { data: sessions, error: sessionsError } = await supabase
      .from('client_sessions')
      .select(`
        id,
        name,
        week_number,
        session_order,
        completed_at,
        created_at,
        client_program_id,
        client_programs!inner (
          id,
          name,
          objective,
          assignment_id,
          program_assignments!inner (
            id
          )
        ),
        client_session_exercises (
          id,
          exercise_id,
          sets,
          reps,
          load,
          exercises (
            id,
            name
          ),
          client_exercise_performance (
            id,
            set_number,
            reps_achieved,
            load_achieved,
            rpe,
            notes
          )
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (sessionsError) {
      console.error('Erreur lors de la récupération des logs de performance:', sessionsError);
      return [];
    }

    // Transformer les données pour correspondre à l'interface attendue
    return (sessions || []).map((session: any) => {
      const exercisesPerformed = (session.client_session_exercises || []).map((ex: any) => ({
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercises?.name || 'Exercice',
        sets: ex.sets,
        reps: ex.reps,
        load: ex.load,
        performance: ex.client_exercise_performance || [],
      }));

      // Calculer le tonnage total
      let totalTonnage = 0;
      exercisesPerformed.forEach((ex: any) => {
        ex.performance.forEach((perf: any) => {
          if (perf.reps_achieved && perf.load_achieved) {
            const loadValue = parseFloat(perf.load_achieved);
            if (!isNaN(loadValue)) {
              totalTonnage += loadValue * perf.reps_achieved;
            }
          }
        });
      });

      return {
        id: session.id,
        session_date: session.completed_at || session.created_at,
        week_number: session.week_number,
        session_number: session.session_order,
        exercises_performed: exercisesPerformed,
        total_tonnage: totalTonnage,
        total_duration_minutes: 0, // Non disponible pour l'instant
        notes: '',
        created_at: session.created_at,
        program_assignments: {
          id: session.client_programs?.program_assignments?.[0]?.id || '',
          client_programs: {
            name: session.client_programs?.name || 'Programme',
            objective: session.client_programs?.objective || '',
          },
        },
        client_sessions: {
          name: session.name,
        },
      } as PerformanceLogDetail;
    });
  } catch (error) {
    console.error('Erreur globale lors de la récupération des logs:', error);
    return [];
  }
};
