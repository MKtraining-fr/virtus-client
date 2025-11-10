import { supabase } from './supabase';
import { WorkoutProgram } from '../types';

/**
 * Met à jour un programme créé par le client (ou assigné par le coach)
 * 
 * @param programId - ID du programme (client_created_programs)
 * @param updates - Modifications à apporter
 * @returns true si succès, false sinon
 */
export const updateClientProgram = async (
  programId: string,
  updates: {
    name?: string;
    objective?: string;
    week_count?: number;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_created_programs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', programId);

    if (error) {
      console.error('Erreur lors de la mise à jour du programme:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la mise à jour du programme:', error);
    return false;
  }
};

/**
 * Met à jour une séance d'un programme
 * 
 * @param sessionId - ID de la séance (client_created_sessions)
 * @param updates - Modifications à apporter
 * @returns true si succès, false sinon
 */
export const updateClientSession = async (
  sessionId: string,
  updates: {
    name?: string;
    week_number?: number;
    session_order?: number;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_created_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Erreur lors de la mise à jour de la séance:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la mise à jour de la séance:', error);
    return false;
  }
};

/**
 * Met à jour un exercice d'une séance
 * 
 * @param exerciseId - ID de l'exercice (client_created_session_exercises)
 * @param updates - Modifications à apporter
 * @returns true si succès, false sinon
 */
export const updateClientSessionExercise = async (
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
    const { error } = await supabase
      .from('client_created_session_exercises')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', exerciseId);

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'exercice:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la mise à jour de l\'exercice:', error);
    return false;
  }
};

/**
 * Ajoute une nouvelle séance à un programme
 * 
 * @param programId - ID du programme
 * @param clientId - ID du client
 * @param coachId - ID du coach (optionnel)
 * @param sessionData - Données de la séance
 * @returns ID de la séance créée ou null
 */
export const addSessionToProgram = async (
  programId: string,
  clientId: string,
  coachId: string | null,
  sessionData: {
    name: string;
    week_number: number;
    session_order: number;
  }
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('client_created_sessions')
      .insert({
        program_id: programId,
        client_id: clientId,
        coach_id: coachId,
        name: sessionData.name,
        week_number: sessionData.week_number,
        session_order: sessionData.session_order,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erreur lors de l\'ajout de la séance:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Erreur globale lors de l\'ajout de la séance:', error);
    return null;
  }
};

/**
 * Ajoute un exercice à une séance
 * 
 * @param sessionId - ID de la séance
 * @param clientId - ID du client
 * @param coachId - ID du coach (optionnel)
 * @param exerciseData - Données de l'exercice
 * @returns ID de l'exercice créé ou null
 */
export const addExerciseToSession = async (
  sessionId: string,
  clientId: string,
  coachId: string | null,
  exerciseData: {
    exercise_id: string;
    exercise_order: number;
    sets: number;
    reps: string;
    load: string;
    tempo: string;
    rest_time: string;
    intensification?: string;
    notes?: string;
  }
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('client_created_session_exercises')
      .insert({
        session_id: sessionId,
        client_id: clientId,
        coach_id: coachId,
        exercise_id: exerciseData.exercise_id,
        exercise_order: exerciseData.exercise_order,
        sets: exerciseData.sets,
        reps: exerciseData.reps,
        load: exerciseData.load,
        tempo: exerciseData.tempo,
        rest_time: exerciseData.rest_time,
        intensification: exerciseData.intensification || null,
        notes: exerciseData.notes || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erreur lors de l\'ajout de l\'exercice:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Erreur globale lors de l\'ajout de l\'exercice:', error);
    return null;
  }
};

/**
 * Supprime une séance d'un programme
 * 
 * @param sessionId - ID de la séance à supprimer
 * @returns true si succès, false sinon
 */
export const deleteSession = async (sessionId: string): Promise<boolean> => {
  try {
    // Supprimer d'abord tous les exercices de la séance
    const { error: exercisesError } = await supabase
      .from('client_created_session_exercises')
      .delete()
      .eq('session_id', sessionId);

    if (exercisesError) {
      console.error('Erreur lors de la suppression des exercices:', exercisesError);
      return false;
    }

    // Puis supprimer la séance
    const { error: sessionError } = await supabase
      .from('client_created_sessions')
      .delete()
      .eq('id', sessionId);

    if (sessionError) {
      console.error('Erreur lors de la suppression de la séance:', sessionError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la suppression de la séance:', error);
    return false;
  }
};

/**
 * Supprime un exercice d'une séance
 * 
 * @param exerciseId - ID de l'exercice à supprimer
 * @returns true si succès, false sinon
 */
export const deleteExercise = async (exerciseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_created_session_exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) {
      console.error('Erreur lors de la suppression de l\'exercice:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la suppression de l\'exercice:', error);
    return false;
  }
};

/**
 * Marque un programme comme modifié par le client
 * Cette fonction est appelée automatiquement par le trigger SQL,
 * mais peut être utilisée manuellement si nécessaire
 * 
 * @param programId - ID du programme
 * @returns true si succès, false sinon
 */
export const markProgramAsModified = async (programId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_created_programs')
      .update({
        modified_by_client: true,
        last_modified_at: new Date().toISOString(),
        viewed_by_coach: false,
      })
      .eq('id', programId);

    if (error) {
      console.error('Erreur lors du marquage du programme comme modifié:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors du marquage:', error);
    return false;
  }
};

/**
 * Marque un programme comme vu par le coach
 * 
 * @param programId - ID du programme
 * @returns true si succès, false sinon
 */
export const markProgramAsViewedByCoach = async (programId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_created_programs')
      .update({
        viewed_by_coach: true,
      })
      .eq('id', programId);

    if (error) {
      console.error('Erreur lors du marquage du programme comme vu:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors du marquage comme vu:', error);
    return false;
  }
};
