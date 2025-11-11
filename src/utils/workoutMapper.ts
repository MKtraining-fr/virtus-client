import { WorkoutSession, WorkoutProgram, WorkoutExercise } from '../types';
import type { Database } from '../types/database';

type Program = Database['public']['Tables']['programs']['Row'];
type Session = Database['public']['Tables']['sessions']['Row'];
type SessionExercise = any; // La table `session_exercises` n'est pas dans `database.ts`

/**
 * Mapper pour convertir les données entre les structures frontend et Supabase
 */

// Frontend -> Supabase

export const mapWorkoutProgramToProgram = (
  workoutProgram: Partial<WorkoutProgram>,
  coachId: string
): Omit<Program, 'id' | 'created_at' | 'updated_at'> => {
  return {
    coach_id: coachId,
    name: workoutProgram.name || 'Nouveau programme',
    objective: workoutProgram.objective || null,
    week_count: workoutProgram.weekCount || 1,
    sessions_per_week: null,
  };
};

export const mapWorkoutSessionToSession = (
  workoutSession: WorkoutSession,
  programId: string | null,
  weekNumber: number,
  coachId: string | null
): Omit<Session, 'id' | 'created_at' | 'updated_at'> => {
  return {
    program_id: programId,
    coach_id: coachId,
    name: workoutSession.name,
    week_number: weekNumber,
    session_order: workoutSession.id,
  };
};

export const mapWorkoutExerciseToSessionExercise = (
  workoutExercise: WorkoutExercise,
  sessionId: string
): Omit<SessionExercise, 'id' | 'session_exercise_id'> => {
  const firstDetail = workoutExercise.details?.[0] || {
    reps: '12',
    load: { value: '', unit: 'kg' as const },
    tempo: '2010',
    rest: '60s',
  };

  return {
    exercise_id: workoutExercise.exerciseId || null,
    exercise_order: workoutExercise.id,
    sets: parseInt(workoutExercise.sets) || 0,
    reps: firstDetail.reps || null,
    load: firstDetail.load.value ? `${firstDetail.load.value}${firstDetail.load.unit}` : null,
    tempo: firstDetail.tempo || null,
    rest_time: firstDetail.rest || null,
    intensification: workoutExercise.intensification || null,
    notes: workoutExercise.notes || null,
    alternatives: workoutExercise.alternatives || null,
    is_detailed: workoutExercise.isDetailed,
  };
};

// Supabase -> Frontend

export const mapProgramToWorkoutProgram = (program: Program): Partial<WorkoutProgram> => {
  return {
    id: program.id,
    name: program.name,
    objective: program.objective || '',
    weekCount: program.week_count || 0,
    sessionsByWeek: {},
  };
};

export const mapSessionToWorkoutSession = (session: Session): WorkoutSession => {
  return {
    id: session.session_order || 0,
    name: session.name,
    exercises: [],
  };
};

export const mapSessionExerciseToWorkoutExercise = (
  sessionExercise: SessionExercise,
  exerciseName?: string,
  illustrationUrl?: string
): WorkoutExercise => {
  const loadMatch = sessionExercise.load?.match(/^(\d+(?:\.\d+)?)(kg|lbs|%)?$/);
  const loadValue = loadMatch ? loadMatch[1] : '';
  const loadUnit = loadMatch ? loadMatch[2] || 'kg' : 'kg';

  const sets = sessionExercise.sets || 0;
  const details =
    sessionExercise.details && sessionExercise.details.length > 0
      ? sessionExercise.details.map((d) => ({
          reps: d.reps || '12',
          load: d.load || { value: '', unit: 'kg' },
          tempo: d.tempo || '2010',
          rest: d.rest || '60s',
        }))
      : Array.from({ length: sets }, () => ({
          reps: sessionExercise.reps || '12',
          load: { value: loadValue, unit: loadUnit as 'kg' | 'lbs' | '%' },
          tempo: sessionExercise.tempo || '2010',
          rest: sessionExercise.rest_time || '60s',
        }));

  return {
    id: sessionExercise.exercise_order || 0,
    name: exerciseName || 'Exercice',
    exerciseId: sessionExercise.exercise_id || '',
    illustrationUrl: illustrationUrl || '',
    sets: String(sets),
    isDetailed: sessionExercise.details?.length > 0,
    details,
    intensification: sessionExercise.intensification || [],
    notes: sessionExercise.notes || null,
    alternatives: sessionExercise.alternatives || [],
  };
};

export const reconstructWorkoutProgram = (
  program: Program,
  sessions: Session[],
  sessionExercises: Map<string, SessionExercise[]>,
  exerciseNames: Map<string, { name: string; illustrationUrl: string }>
): WorkoutProgram => {
  const sessionsByWeek: Record<number, WorkoutSession[]> = {};

  sessions.forEach((session) => {
    const weekNumber = session.week_number || 1;
    if (!sessionsByWeek[weekNumber]) {
      sessionsByWeek[weekNumber] = [];
    }

    const workoutSession = mapSessionToWorkoutSession(session);

    const exercises = sessionExercises.get(session.id) || [];
    workoutSession.exercises = exercises.map((ex) => {
      const exerciseInfo = exerciseNames.get(ex.exercise_id || '');
      return mapSessionExerciseToWorkoutExercise(
        ex,
        exerciseInfo?.name,
        exerciseInfo?.illustrationUrl
      );
    });

    sessionsByWeek[weekNumber].push(workoutSession);
  });

  Object.keys(sessionsByWeek).forEach((week) => {
    sessionsByWeek[Number(week)].sort((a, b) => a.id - b.id);
  });

  return {
    id: program.id,
    name: program.name,
    objective: program.objective || '',
    weekCount: program.week_count || 0,
    sessionsByWeek,
  };
};
