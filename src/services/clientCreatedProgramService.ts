import { supabase } from './supabase';
import { WorkoutProgram, WorkoutSession } from '../types';

export interface ClientCreatedProgram {
  id: string;
  client_id: string;
  coach_id?: string;
  name: string;
  objective: string;
  week_count: number;
  session_count: number;
  total_exercises: number;
  protocol?: string;
  difficulty_level?: string;
  sessions_by_week: Record<number, WorkoutSession[]>;
  created_at: string;
  updated_at: string;
}

/**
 * Calcule le nombre total d'exercices dans un programme
 */
const calculateTotalExercises = (sessionsByWeek: Record<number, WorkoutSession[]>): number => {
  let total = 0;
  Object.values(sessionsByWeek).forEach((sessions) => {
    sessions.forEach((session) => {
      total += session.exercises.length;
    });
  });
  return total;
};

/**
 * Calcule le nombre de séances uniques dans un programme
 */
const calculateSessionCount = (sessionsByWeek: Record<number, WorkoutSession[]>): number => {
  const firstWeekSessions = sessionsByWeek[1] || [];
  return firstWeekSessions.length;
};

/**
 * Sauvegarde un programme créé par un client dans Supabase
 */
export const saveClientCreatedProgram = async (
  program: WorkoutProgram,
  clientId: string,
  coachId?: string
): Promise<ClientCreatedProgram | null> => {
  try {
    const sessionCount = calculateSessionCount(program.sessionsByWeek);
    const totalExercises = calculateTotalExercises(program.sessionsByWeek);

    const { data, error } = await supabase
      .from('client_programs')
      .insert({
        client_id: clientId,
        coach_id: coachId,
        name: program.name,
        objective: program.objective,
        week_count: program.weekCount,
        session_count: sessionCount,
        total_exercises: totalExercises,
        sessions_by_week: program.sessionsByWeek,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase Error (400):', error);
      throw error;
    }
    return data as ClientCreatedProgram;
  } catch (error) {
    console.error('Error saving client created program:', error);
    return null;
  }
};

/**
 * Récupère tous les programmes créés par un client
 */
export const getClientCreatedPrograms = async (
  clientId: string
): Promise<ClientCreatedProgram[]> => {
  try {
    const { data, error } = await supabase
      .from('client_programs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ClientCreatedProgram[];
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
    const { data, error } = await supabase
      .from('client_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (error) throw error;
    return data as ClientCreatedProgram;
  } catch (error) {
    console.error('Error fetching client created program:', error);
    return null;
  }
};

/**
 * Récupère les programmes créés par un client ET visibles par son coach
 */
export const getCoachVisiblePrograms = async (
  coachId: string
): Promise<ClientCreatedProgram[]> => {
  try {
    const { data, error } = await supabase
      .from('client_programs')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ClientCreatedProgram[];
  } catch (error) {
    console.error('Error fetching coach visible programs:', error);
    return [];
  }
};

/**
 * Met à jour un programme créé par un client
 */
export const updateClientCreatedProgram = async (
  programId: string,
  updates: Partial<Omit<ClientCreatedProgram, 'id' | 'created_at' | 'updated_at'>>
): Promise<ClientCreatedProgram | null> => {
  try {
    const { data, error } = await supabase
      .from('client_programs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', programId)
      .select()
      .single();

    if (error) throw error;
    return data as ClientCreatedProgram;
  } catch (error) {
    console.error('Error updating client created program:', error);
    return null;
  }
};

/**
 * Supprime un programme créé par un client
 */
export const deleteClientCreatedProgram = async (programId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('client_programs').delete().eq('id', programId);

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
