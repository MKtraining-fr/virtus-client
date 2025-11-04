import { supabase } from './supabase';
import { WorkoutProgram, WorkoutSession, WorkoutExercise } from '../types';

export interface ClientCreatedProgram {
  id: string;
  client_id: string;
  coach_id?: string;
  name: string;
  objective: string;
  week_count: number;
  session_count: number;
  total_exercises: number;
  sessions_by_week: Record<number, WorkoutSession[]>;
  created_at: string;
  updated_at: string;
}

/**
 * Récupère tous les programmes créés par un client depuis les nouvelles tables
 */
export const getClientCreatedPrograms = async (
  clientId: string
): Promise<ClientCreatedProgram[]> => {
  try {
    // Récupérer les programmes
    const { data: programs, error: programsError } = await supabase
      .from('client_created_programs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (programsError) throw programsError;
    if (!programs || programs.length === 0) return [];

    // Pour chaque programme, récupérer les séances et exercices
    const enrichedPrograms: ClientCreatedProgram[] = [];

    for (const program of programs) {
      // Récupérer les séances du programme
      const { data: sessions, error: sessionsError } = await supabase
        .from('client_created_sessions')
        .select('*')
        .eq('program_id', program.id)
        .order('week_number', { ascending: true })
        .order('session_order', { ascending: true });

      if (sessionsError) throw sessionsError;

      // Construire sessions_by_week
      const sessionsByWeek: Record<number, WorkoutSession[]> = {};
      let totalExercises = 0;

      if (sessions && sessions.length > 0) {
        for (const session of sessions) {
          // Récupérer les exercices de la séance
          const { data: exercises, error: exercisesError } = await supabase
            .from('client_created_session_exercises')
            .select(`
              *,
              exercises:exercise_id (
                id,
                name,
                image_url
              )
            `)
            .eq('session_id', session.id)
            .order('exercise_order', { ascending: true });

          if (exercisesError) throw exercisesError;

          // Construire les exercices au format WorkoutExercise
          const workoutExercises: WorkoutExercise[] = (exercises || []).map((ex: any) => {
            totalExercises++;
            
            // Parser la charge
            const loadParts = ex.load ? ex.load.split(' ') : ['', 'kg'];
            const loadValue = loadParts[0] || '';
            const loadUnit = loadParts[1] || 'kg';

            return {
              id: ex.id,
              exerciseId: ex.exercise_id,
              name: ex.exercises?.name || 'Exercice inconnu',
              illustrationUrl: ex.exercises?.image_url || '',
              sets: ex.sets.toString(),
              isDetailed: false,
              details: Array(ex.sets).fill(null).map(() => ({
                reps: ex.reps,
                load: { value: loadValue, unit: loadUnit },
                tempo: ex.tempo || '2010',
                rest: ex.rest_time || '60s',
              })),
              intensification: ex.intensification ? JSON.parse(ex.intensification) : [],
              alternatives: [],
              notes: ex.notes || undefined,
            };
          });

          // Créer la WorkoutSession
          const workoutSession: WorkoutSession = {
            id: session.id,
            name: session.name,
            exercises: workoutExercises,
          };

          // Ajouter à sessionsByWeek
          const weekNumber = session.week_number || 1;
          if (!sessionsByWeek[weekNumber]) {
            sessionsByWeek[weekNumber] = [];
          }
          sessionsByWeek[weekNumber].push(workoutSession);
        }
      }

      // Calculer session_count (nombre de séances dans la première semaine)
      const sessionCount = sessionsByWeek[1]?.length || 0;

      enrichedPrograms.push({
        id: program.id,
        client_id: program.client_id,
        coach_id: program.coach_id,
        name: program.name,
        objective: program.objective || '',
        week_count: program.week_count,
        session_count: sessionCount,
        total_exercises: totalExercises,
        sessions_by_week: sessionsByWeek,
        created_at: program.created_at,
        updated_at: program.updated_at,
      });
    }

    return enrichedPrograms;
  } catch (error) {
    console.error('Error fetching client created programs:', error);
    return [];
  }
};

/**
 * Récupère un programme créé par un client par son ID
 */
export const getClientCreatedProgramById = async (
  programId: string
): Promise<ClientCreatedProgram | null> => {
  try {
    const { data: program, error: programError } = await supabase
      .from('client_created_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (programError) throw programError;
    if (!program) return null;

    // Récupérer les séances
    const { data: sessions, error: sessionsError } = await supabase
      .from('client_created_sessions')
      .select('*')
      .eq('program_id', program.id)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });

    if (sessionsError) throw sessionsError;

    const sessionsByWeek: Record<number, WorkoutSession[]> = {};
    let totalExercises = 0;

    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        const { data: exercises, error: exercisesError } = await supabase
          .from('client_created_session_exercises')
          .select(`
            *,
            exercises:exercise_id (
              id,
              name,
              illustrationUrl:image_url
            )
          `)
          .eq('session_id', session.id)
          .order('exercise_order', { ascending: true });

        if (exercisesError) throw exercisesError;

        const workoutExercises: WorkoutExercise[] = (exercises || []).map((ex: any) => {
          totalExercises++;
          const loadParts = ex.load ? ex.load.split(' ') : ['', 'kg'];
          const loadValue = loadParts[0] || '';
          const loadUnit = loadParts[1] || 'kg';

          return {
            id: ex.id,
            exerciseId: ex.exercise_id,
            name: ex.exercises?.name || 'Exercice inconnu',
            illustrationUrl: ex.exercises?.illustrationUrl || '',
            sets: ex.sets.toString(),
            isDetailed: false,
            details: Array(ex.sets).fill(null).map(() => ({
              reps: ex.reps,
              load: { value: loadValue, unit: loadUnit },
              tempo: ex.tempo || '2010',
              rest: ex.rest_time || '60s',
            })),
            intensification: ex.intensification ? JSON.parse(ex.intensification) : [],
            alternatives: [],
            notes: ex.notes || undefined,
          };
        });

        const workoutSession: WorkoutSession = {
          id: session.id,
          name: session.name,
          exercises: workoutExercises,
        };

        const weekNumber = session.week_number || 1;
        if (!sessionsByWeek[weekNumber]) {
          sessionsByWeek[weekNumber] = [];
        }
        sessionsByWeek[weekNumber].push(workoutSession);
      }
    }

    const sessionCount = sessionsByWeek[1]?.length || 0;

    return {
      id: program.id,
      client_id: program.client_id,
      coach_id: program.coach_id,
      name: program.name,
      objective: program.objective || '',
      week_count: program.week_count,
      session_count: sessionCount,
      total_exercises: totalExercises,
      sessions_by_week: sessionsByWeek,
      created_at: program.created_at,
      updated_at: program.updated_at,
    };
  } catch (error) {
    console.error('Error fetching client created program:', error);
    return null;
  }
};

/**
 * Supprime un programme créé par un client (cascade delete via FK)
 */
export const deleteClientCreatedProgram = async (programId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_created_programs')
      .delete()
      .eq('id', programId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting client created program:', error);
    return false;
  }
};

/**
 * Convertit un ClientCreatedProgram en WorkoutProgram pour la compatibilité
 */
export const convertToWorkoutProgram = (program: ClientCreatedProgram): WorkoutProgram => {
  return {
    id: program.id,
    name: program.name,
    objective: program.objective,
    weekCount: program.week_count,
    clientId: program.client_id,
    sessionsByWeek: program.sessions_by_week,
  };
};

/**
 * Récupère les programmes créés par les clients d'un coach
 */
export const getCoachVisiblePrograms = async (
  coachId: string
): Promise<ClientCreatedProgram[]> => {
  try {
    const { data: programs, error: programsError } = await supabase
      .from('client_created_programs')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (programsError) throw programsError;
    if (!programs || programs.length === 0) return [];

    // Enrichir avec les séances et exercices (même logique que getClientCreatedPrograms)
    const enrichedPrograms: ClientCreatedProgram[] = [];

    for (const program of programs) {
      const { data: sessions, error: sessionsError } = await supabase
        .from('client_created_sessions')
        .select('*')
        .eq('program_id', program.id)
        .order('week_number', { ascending: true })
        .order('session_order', { ascending: true });

      if (sessionsError) throw sessionsError;

      const sessionsByWeek: Record<number, WorkoutSession[]> = {};
      let totalExercises = 0;

      if (sessions && sessions.length > 0) {
        for (const session of sessions) {
          const { data: exercises, error: exercisesError } = await supabase
            .from('client_created_session_exercises')
            .select(`
              *,
              exercises:exercise_id (
                id,
                name,
                image_url
              )
            `)
            .eq('session_id', session.id)
            .order('exercise_order', { ascending: true });

          if (exercisesError) throw exercisesError;

          const workoutExercises: WorkoutExercise[] = (exercises || []).map((ex: any) => {
            totalExercises++;
            const loadParts = ex.load ? ex.load.split(' ') : ['', 'kg'];
            const loadValue = loadParts[0] || '';
            const loadUnit = loadParts[1] || 'kg';

            return {
              id: ex.id,
              exerciseId: ex.exercise_id,
              name: ex.exercises?.name || 'Exercice inconnu',
              illustrationUrl: ex.exercises?.image_url || '',
              sets: ex.sets.toString(),
              isDetailed: false,
              details: Array(ex.sets).fill(null).map(() => ({
                reps: ex.reps,
                load: { value: loadValue, unit: loadUnit },
                tempo: ex.tempo || '2010',
                rest: ex.rest_time || '60s',
              })),
              intensification: ex.intensification ? JSON.parse(ex.intensification) : [],
              alternatives: [],
              notes: ex.notes || undefined,
            };
          });

          const workoutSession: WorkoutSession = {
            id: session.id,
            name: session.name,
            exercises: workoutExercises,
          };

          const weekNumber = session.week_number || 1;
          if (!sessionsByWeek[weekNumber]) {
            sessionsByWeek[weekNumber] = [];
          }
          sessionsByWeek[weekNumber].push(workoutSession);
        }
      }

      const sessionCount = sessionsByWeek[1]?.length || 0;

      enrichedPrograms.push({
        id: program.id,
        client_id: program.client_id,
        coach_id: program.coach_id,
        name: program.name,
        objective: program.objective || '',
        week_count: program.week_count,
        session_count: sessionCount,
        total_exercises: totalExercises,
        sessions_by_week: sessionsByWeek,
        created_at: program.created_at,
        updated_at: program.updated_at,
      });
    }

    return enrichedPrograms;
  } catch (error) {
    console.error('Error fetching coach visible programs:', error);
    return [];
  }
};
