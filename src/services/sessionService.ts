import { supabase } from './supabase';
import type { Json } from '../types/database';

// Types pour les séances (matrices)
export interface Session {
  id: string;
  program_id?: string | null;
  created_by?: string | null;
  name: string;
  week_number: number;
  session_order: number;
  exercises: Json;
  notes?: string | null;
  description?: string | null;
  day_of_week?: number | null;
  is_template?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface SessionInput {
  program_id?: string;
  name: string;
  week_number: number;
  session_order: number;
  exercises: Json;
  notes?: string;
  description?: string;
  day_of_week?: number;
  is_template?: boolean;
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
        created_by: user.id,
        ...sessionData,
        exercises: sessionData.exercises ?? [],
        is_template: sessionData.is_template ?? true,
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
      .eq('created_by', user.id)
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
    const payload: Partial<SessionInput> & { updated_at: string } = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.exercises !== undefined) {
      payload.exercises = updates.exercises;
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(payload)
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

// Les opérations liées aux exercices individuels sont gérées via le champ JSON `exercises`
// stocké directement dans la table `sessions`.

// Ajouter un exercice à une séance (manipulation du champ JSON exercises)
export const addExerciseToSession = async (
  sessionId: string,
  exerciseData: {
    exercise_id: string;
    exercise_order: number;
    sets: number;
    reps: string;
    load?: string;
    tempo?: string;
    rest_time?: string;
    intensification?: string;
    notes?: string;
  }
): Promise<string | null> => {
  try {
    const session = await getSessionById(sessionId);
    if (!session) {
      console.error('Session not found:', sessionId);
      return null;
    }

    // Récupérer les exercices existants (tableau JSON)
    const exercises = Array.isArray(session.exercises) ? session.exercises : [];
    
    // Générer un ID unique pour le nouvel exercice
    const newExerciseId = `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Ajouter le nouvel exercice
    const newExercise = {
      id: newExerciseId,
      ...exerciseData,
    };
    
    exercises.push(newExercise);

    // Mettre à jour la session avec les exercices modifiés
    const updated = await updateSession(sessionId, { exercises: exercises as Json });
    
    if (!updated) {
      console.error('Failed to update session with new exercise');
      return null;
    }

    return newExerciseId;
  } catch (error) {
    console.error('Error adding exercise to session:', error);
    return null;
  }
};

// Mettre à jour un exercice dans une séance (manipulation du champ JSON exercises)
export const updateSessionExercise = async (
  exerciseId: string,
  updates: {
    exercise_id?: string;
    exercise_order?: number;
    sets?: number;
    reps?: string;
    load?: string;
    tempo?: string;
    rest_time?: string;
    intensification?: string;
    notes?: string;
  }
): Promise<boolean> => {
  try {
    // Trouver la session contenant cet exercice
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Récupérer toutes les sessions du coach
    const sessions = await getCoachSessions();
    
    // Chercher la session contenant l'exercice
    let targetSession: Session | null = null;
    let exerciseIndex = -1;
    
    for (const session of sessions) {
      const exercises = Array.isArray(session.exercises) ? session.exercises : [];
      const index = exercises.findIndex((ex: any) => ex.id === exerciseId);
      
      if (index !== -1) {
        targetSession = session;
        exerciseIndex = index;
        break;
      }
    }
    
    if (!targetSession || exerciseIndex === -1) {
      console.error('Exercise not found:', exerciseId);
      return false;
    }

    // Mettre à jour l'exercice
    const exercises = Array.isArray(targetSession.exercises) ? targetSession.exercises : [];
    exercises[exerciseIndex] = { 
      ...exercises[exerciseIndex], 
      ...updates 
    };

    // Mettre à jour la session
    const updated = await updateSession(targetSession.id, { exercises: exercises as Json });
    return updated !== null;
  } catch (error) {
    console.error('Error updating session exercise:', error);
    return false;
  }
};

// Supprimer un exercice d'une séance (manipulation du champ JSON exercises)
export const deleteSessionExercise = async (exerciseId: string): Promise<boolean> => {
  try {
    // Trouver la session contenant cet exercice
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Récupérer toutes les sessions du coach
    const sessions = await getCoachSessions();
    
    // Chercher la session contenant l'exercice
    let targetSession: Session | null = null;
    
    for (const session of sessions) {
      const exercises = Array.isArray(session.exercises) ? session.exercises : [];
      const hasExercise = exercises.some((ex: any) => ex.id === exerciseId);
      
      if (hasExercise) {
        targetSession = session;
        break;
      }
    }
    
    if (!targetSession) {
      console.error('Exercise not found:', exerciseId);
      return false;
    }

    // Filtrer l'exercice à supprimer
    const exercises = Array.isArray(targetSession.exercises) ? targetSession.exercises : [];
    const updatedExercises = exercises.filter((ex: any) => ex.id !== exerciseId);

    // Mettre à jour la session
    const updated = await updateSession(targetSession.id, { exercises: updatedExercises as Json });
    return updated !== null;
  } catch (error) {
    console.error('Error deleting session exercise:', error);
    return false;
  }
};
