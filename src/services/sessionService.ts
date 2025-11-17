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
