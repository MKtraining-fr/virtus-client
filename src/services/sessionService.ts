import { supabase } from './supabase';

// Types pour les séances (matrices)
export interface Session {
  id: string;
  program_id?: string;
  coach_id: string;
  name: string;
  week_number: number;
  session_order: number;
  created_at: string;
  updated_at: string;
}

export interface SessionInput {
  program_id?: string;
  name: string;
  week_number: number;
  session_order: number;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  coach_id: string;
  exercise_order: number;
  sets?: number;
  reps?: string;
  load?: string;
  tempo?: string;
  rest_time?: string;
  intensification?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionExerciseInput {
  exercise_id: string;
  exercise_order: number;
  sets?: number;
  reps?: string;
  load?: string;
  tempo?: string;
  rest_time?: string;
  intensification?: string;
  notes?: string;
}

// Créer une nouvelle séance (matrice)
export const createSession = async (sessionData: SessionInput): Promise<Session | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        coach_id: user.id,
        ...sessionData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
};

// Récupérer toutes les séances d'un coach
export const getCoachSessions = async (): Promise<Session[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching coach sessions:', error);
    return [];
  }
};

// Récupérer les séances d'un programme spécifique
export const getProgramSessions = async (programId: string): Promise<Session[]> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching program sessions:', error);
    return [];
  }
};

// Récupérer une séance par ID
export const getSessionById = async (sessionId: string): Promise<Session | null> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
};

// Mettre à jour une séance
export const updateSession = async (
  sessionId: string,
  updates: Partial<SessionInput>
): Promise<Session | null> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating session:', error);
    return null;
  }
};

// Supprimer une séance
export const deleteSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('sessions').delete().eq('id', sessionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
};

// Ajouter un exercice à une séance
export const addExerciseToSession = async (
  sessionId: string,
  exerciseData: SessionExerciseInput
): Promise<SessionExercise | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('session_exercises')
      .insert({
        session_id: sessionId,
        coach_id: user.id,
        ...exerciseData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding exercise to session:', error);
    return null;
  }
};

// Récupérer les exercices d'une séance
export const getSessionExercises = async (sessionId: string): Promise<SessionExercise[]> => {
  try {
    const { data, error } = await supabase
      .from('session_exercises')
      .select('*')
      .eq('session_id', sessionId)
      .order('exercise_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching session exercises:', error);
    return [];
  }
};

// Mettre à jour un exercice de séance
export const updateSessionExercise = async (
  exerciseId: string,
  updates: Partial<SessionExerciseInput>
): Promise<SessionExercise | null> => {
  try {
    const { data, error } = await supabase
      .from('session_exercises')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', exerciseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating session exercise:', error);
    return null;
  }
};

// Supprimer un exercice d'une séance
export const deleteSessionExercise = async (exerciseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('session_exercises').delete().eq('id', exerciseId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting session exercise:', error);
    return false;
  }
};
