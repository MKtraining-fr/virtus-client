import { supabase } from './supabase';

/**
 * Service pour gérer les séances client et leurs exercices
 */

export interface ClientSession {
  id: string;
  client_program_id: string;
  client_id: string;
  name: string;
  week_number: number;
  session_order: number;
  status: 'pending' | 'completed' | 'skipped';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientSessionExercise {
  id: string;
  client_session_id: string;
  exercise_id: string;
  client_id: string;
  exercise_order: number;
  sets: number | null;
  reps: string | null;
  load: string | null;
  tempo: string | null;
  rest_time: string | null;
  intensification: any;
  notes: string | null;
  details: any;
  created_at: string;
  updated_at: string;
}

/**
 * Récupère une séance client par son ID
 * 
 * @param clientSessionId - ID de la séance client
 * @returns La séance client ou null
 */
export const getClientSession = async (
  clientSessionId: string
): Promise<ClientSession | null> => {
  try {
    const { data, error } = await supabase
      .from('client_sessions')
      .select('*')
      .eq('id', clientSessionId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de la séance:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur globale:', error);
    return null;
  }
};

/**
 * Récupère une séance client existante par client_program_id, week_number et session_order
 * 
 * @param clientProgramId - ID du programme client
 * @param weekNumber - Numéro de la semaine
 * @param sessionOrder - Ordre de la séance
 * @returns La séance client ou null
 */
export const findExistingClientSession = async (
  clientProgramId: string,
  weekNumber: number,
  sessionOrder: number
): Promise<ClientSession | null> => {
  try {
    const { data, error } = await supabase
      .from('client_sessions')
      .select('*')
      .eq('client_program_id', clientProgramId)
      .eq('week_number', weekNumber)
      .eq('session_order', sessionOrder)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erreur lors de la recherche de la séance existante:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur globale:', error);
    return null;
  }
};

/**
 * Récupère les exercices d'une séance client
 * 
 * @param clientSessionId - ID de la séance client
 * @returns Tableau des exercices ou tableau vide
 */
export const getClientSessionExercises = async (
  clientSessionId: string
): Promise<ClientSessionExercise[]> => {
  try {
    const { data, error } = await supabase
      .from('client_session_exercises')
      .select('*')
      .eq('client_session_id', clientSessionId)
      .order('exercise_order', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des exercices:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};

/**
 * Met à jour le statut d'une séance client
 * 
 * @param clientSessionId - ID de la séance client
 * @param status - Nouveau statut
 * @returns true si succès, false sinon
 */
export const updateSessionStatus = async (
  clientSessionId: string,
  status: 'pending' | 'completed' | 'skipped'
): Promise<boolean> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Si la séance est complétée, enregistrer la date
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('client_sessions')
      .update(updateData)
      .eq('id', clientSessionId);

    if (error) {
      console.error('Erreur lors de la mise à jour du statut de séance:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale:', error);
    return false;
  }
};

/**
 * Récupère le client_session_exercise_id à partir de l'exercise_id et du client_session_id
 * 
 * @param clientSessionId - ID de la séance client
 * @param exerciseId - ID de l'exercice (dans la table exercises)
 * @returns L'ID du client_session_exercise ou null
 */
export const getClientSessionExerciseId = async (
  clientSessionId: string,
  exerciseId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('client_session_exercises')
      .select('id')
      .eq('client_session_id', clientSessionId)
      .eq('exercise_id', exerciseId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du client_session_exercise_id:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Erreur globale:', error);
    return null;
  }
};

/**
 * Compte le nombre de séances complétées par un client
 * 
 * @param clientId - ID du client
 * @returns Le nombre de séances complétées
 */
export const getCompletedSessionsCount = async (
  clientId: string
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('client_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'completed');

    if (error) {
      console.error('Erreur lors du comptage des séances complétées:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erreur globale lors du comptage:', error);
    return 0;
  }
};

/**
 * Crée une nouvelle séance client
 * 
 * @param data - Données de la séance à créer
 * @returns L'ID de la séance créée ou null
 */
export const createClientSession = async (data: {
  client_program_id: string;
  client_id: string;
  name: string;
  week_number: number;
  session_order: number;
  status?: 'pending' | 'completed' | 'skipped';
}): Promise<string | null> => {
  try {
    const { data: session, error } = await supabase
      .from('client_sessions')
      .insert({
        ...data,
        status: data.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erreur lors de la création de la séance client:', error);
      return null;
    }

    return session?.id || null;
  } catch (error) {
    console.error('Erreur globale lors de la création de la séance:', error);
    return null;
  }
};

/**
 * Crée un nouvel exercice pour une séance client
 * 
 * @param data - Données de l'exercice à créer
 * @returns true si succès, false sinon
 */
export const createClientSessionExercise = async (data: {
  client_session_id: string;
  exercise_id: string;
  client_id: string;
  exercise_order: number;
  sets?: number;
  reps?: string;
  load?: string;
  tempo?: string;
  rest_time?: string;
  intensification?: any;
  notes?: string;
  details?: any;
}): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_session_exercises')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erreur lors de la création de l\'exercice de séance:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la création de l\'exercice:', error);
    return false;
  }
};

/**
 * Récupère le client_program_id à partir de l'assignment_id
 * 
 * @param assignmentId - ID d'assignation du programme
 * @returns L'ID du client_program ou null
 */
export const getClientProgramIdFromAssignment = async (
  assignmentId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('client_programs')
      .select('id')
      .eq('assignment_id', assignmentId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du client_program_id:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Erreur globale:', error);
    return null;
  }
};
