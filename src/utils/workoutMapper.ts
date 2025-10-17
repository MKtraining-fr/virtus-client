import { WorkoutSession, WorkoutProgram, WorkoutExercise } from '../types';
import { Program, Session, SessionExercise } from '../services/programService';

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
  };
};

export const mapWorkoutSessionToSession = (
  workoutSession: WorkoutSession,
  programId: string | null,
  weekNumber: number,
  coachId: string
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
): Omit<SessionExercise, 'id' | 'session_id'> => {
  // Extraire les détails de la première série comme référence
  const firstDetail = workoutExercise.details[0] || {
    reps: '12',
    load: { value: '', unit: 'kg' },
    tempo: '2010',
    rest: '60s',
  };

  return {
    exercise_id: workoutExercise.exerciseId || null,
    exercise_order: workoutExercise.id,
    sets: parseInt(workoutExercise.sets) || 0,
    reps: firstDetail.reps || null,
    load: firstDetail.load.value
      ? `${firstDetail.load.value}${firstDetail.load.unit}`
      : null,
    tempo: firstDetail.tempo || null,
    rest_time: firstDetail.rest || null,
    intensification: workoutExercise.intensification || null,
    notes: workoutExercise.notes || null,
    alternatives: workoutExercise.alternatives || null,
  };
};

// Supabase -> Frontend

export const mapProgramToWorkoutProgram = (program: Program): Partial<WorkoutProgram> => {
  return {
    id: program.id,
    name: program.name,
    objective: program.objective || '',
    weekCount: program.week_count,
    sessionsByWeek: {}, // À remplir avec les séances
  };
};

export const mapSessionToWorkoutSession = (session: Session): WorkoutSession => {
  return {
    id: session.session_order,
    name: session.name,
    exercises: [], // À remplir avec les exercices
  };
};

export const mapSessionExerciseToWorkoutExercise = (
  sessionExercise: SessionExercise,
  exerciseName?: string,
  illustrationUrl?: string
): WorkoutExercise => {
  // Parser la charge (ex: "80kg" -> { value: "80", unit: "kg" })
  const loadMatch = sessionExercise.load?.match(/^(\d+(?:\.\d+)?)(kg|lbs|%)?$/);
  const loadValue = loadMatch ? loadMatch[1] : '';
  const loadUnit = loadMatch ? (loadMatch[2] || 'kg') : 'kg';

  // Créer les détails pour chaque série
  const sets = sessionExercise.sets || 0;
  const details = Array.from({ length: sets }, () => ({
    reps: sessionExercise.reps || '12',
    load: { value: loadValue, unit: loadUnit as 'kg' | 'lbs' | '%' },
    tempo: sessionExercise.tempo || '2010',
    rest: sessionExercise.rest_time || '60s',
  }));

  return {
    id: sessionExercise.exercise_order,
    name: exerciseName || 'Exercice',
    exerciseId: sessionExercise.exercise_id || '',
    illustrationUrl: illustrationUrl || '',
    sets: String(sets),
    details,
    intensification: sessionExercise.intensification || '',
    notes: sessionExercise.notes || '',
    alternatives: sessionExercise.alternatives || [],
  };
};

/**
 * Reconstruit un WorkoutProgram complet à partir d'un Program Supabase et de ses sessions
 */
export const reconstructWorkoutProgram = (
  program: Program,
  sessions: Session[],
  sessionExercises: Map<string, SessionExercise[]>,
  exerciseNames: Map<string, { name: string; illustrationUrl: string }>
): WorkoutProgram => {
  const sessionsByWeek: Record<number, WorkoutSession[]> = {};

  // Grouper les sessions par semaine
  sessions.forEach((session) => {
    const weekNumber = session.week_number;
    if (!sessionsByWeek[weekNumber]) {
      sessionsByWeek[weekNumber] = [];
    }

    const workoutSession = mapSessionToWorkoutSession(session);
    
    // Ajouter les exercices à la séance
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

  // Trier les séances par session_order dans chaque semaine
  Object.keys(sessionsByWeek).forEach((week) => {
    sessionsByWeek[Number(week)].sort((a, b) => a.id - b.id);
  });

  return {
    id: program.id,
    name: program.name,
    objective: program.objective || '',
    weekCount: program.week_count,
    sessionsByWeek,
  };
};

