import { supabase } from './supabase';

/**
 * Service pour la gestion des exercices de séances via la table session_exercises
 * Ce service remplace l'approche JSON stockée dans sessions.exercises
 */

export interface SessionExerciseData {
  session_id: string;
  exercise_id: string;
  coach_id: string;
  exercise_order: number;
  sets: number;
  reps: string;
  load?: string;
  tempo?: string;
  rest_time?: string;
  intensification?: string;
  notes?: string;
}

/**
 * Récupère tous les exercices d'une séance depuis la table session_exercises
 * @param sessionId - ID de la séance
 * @returns Liste des exercices de la séance
 */
export const getSessionExercises = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('session_exercises')
      .select('*')
      .eq('session_id', sessionId)
      .order('exercise_order', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des exercices de séance:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale lors de la récupération des exercices de séance:', error);
    return [];
  }
};

/**
 * Crée un exercice dans une séance
 * @param exerciseData - Données de l'exercice
 * @returns L'exercice créé ou null en cas d'erreur
 */
export const createSessionExercise = async (
  exerciseData: SessionExerciseData
) => {
  try {
    const { data, error } = await supabase
      .from('session_exercises')
      .insert(exerciseData)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création de l'exercice de séance:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erreur globale lors de la création de l'exercice de séance:", error);
    throw error;
  }
};

/**
 * Crée plusieurs exercices dans une séance en batch
 * @param exercises - Liste des exercices à créer
 * @returns Liste des exercices créés
 */
export const createSessionExercisesBatch = async (
  exercises: SessionExerciseData[]
) => {
  try {
    if (exercises.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('session_exercises')
      .insert(exercises)
      .select();

    if (error) {
      console.error('Erreur lors de la création batch des exercices de séance:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale lors de la création batch des exercices de séance:', error);
    throw error;
  }
};

/**
 * Met à jour un exercice de séance
 * @param exerciseId - ID de l'exercice
 * @param updates - Données à mettre à jour
 * @returns L'exercice mis à jour ou null en cas d'erreur
 */
export const updateSessionExercise = async (
  exerciseId: string,
  updates: Partial<SessionExerciseData>
) => {
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

    if (error) {
      console.error("Erreur lors de la mise à jour de l'exercice de séance:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Erreur globale lors de la mise à jour de l'exercice de séance:", error);
    return null;
  }
};

/**
 * Supprime un exercice de séance
 * @param exerciseId - ID de l'exercice
 * @returns true si succès, false sinon
 */
export const deleteSessionExercise = async (exerciseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('session_exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) {
      console.error("Erreur lors de la suppression de l'exercice de séance:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur globale lors de la suppression de l'exercice de séance:", error);
    return false;
  }
};

/**
 * Supprime tous les exercices d'une séance
 * @param sessionId - ID de la séance
 * @returns true si succès, false sinon
 */
export const deleteAllSessionExercises = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('session_exercises')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('Erreur lors de la suppression des exercices de la séance:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la suppression des exercices de la séance:', error);
    return false;
  }
};
