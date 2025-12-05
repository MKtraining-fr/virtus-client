import { supabase } from './supabase';
import { Program, Exercise } from '../types';

/**
 * Service pour la gestion des programmes (templates)
 * Ce service gère les opérations CRUD sur la table `programs`
 */

/**
 * Récupère un programme par son ID
 * @param programId - ID du programme
 * @returns Le programme ou null si non trouvé
 */
export const getProgramById = async (programId: string): Promise<Program | null> => {
  try {
    const { data, error } = await supabase
      .from('program_templates')
      .select('*')
      .eq('id', programId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du programme:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur globale lors de la récupération du programme:', error);
    return null;
  }
};

/**
 * Récupère tous les programmes d'un coach
 * @param coachId - ID du coach
 * @returns Liste des programmes
 */
export const getProgramsByCoachId = async (coachId: string): Promise<Program[]> => {
  try {
    const { data, error } = await supabase
      .from('program_templates')
      .select('*')
      // Inclure les programmes créés par le coach ainsi que les modèles globaux (sans coach associé)
      .or(`coach_id.eq.${coachId},coach_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des programmes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale lors de la récupération des programmes:', error);
    return [];
  }
};

/**
 * Récupère les séances d'un programme spécifique
 * Alias pour getProgramSessions de sessionService pour compatibilité
 * @param programId - ID du programme
 * @returns Liste des séances
 */
export const getSessionsByProgramId = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('program_template_id', programId)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des séances:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale lors de la récupération des séances:', error);
    return [];
  }
};

/**
 * Récupère les exercices d'une séance spécifique depuis la table session_exercises
 * @param sessionId - ID de la séance
 * @returns Liste des exercices de la séance
 */
export const getSessionExercisesBySessionId = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('session_exercises')
      .select('*')
      .eq('session_template_id', sessionId)
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
 * Récupère les détails des exercices par leurs IDs
 * @param exerciseIds - Liste des IDs d'exercices
 * @returns Map des exercices avec leur nom et URL d'illustration
 */
export const getExercisesByIds = async (
  exerciseIds: string[]
): Promise<Map<string, { name: string; illustrationUrl: string }>> => {
  try {
    if (exerciseIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase
      .from('exercises')
      .select('id, name, image_url')
      .in('id', exerciseIds);

    if (error) {
      console.error('Erreur lors de la récupération des exercices:', error);
      return new Map();
    }

    const exerciseMap = new Map();
    (data || []).forEach((ex: any) => {
      exerciseMap.set(ex.id, {
        name: ex.name,
        illustrationUrl: ex.image_url || '',
      });
    });

    return exerciseMap;
  } catch (error) {
    console.error('Erreur globale lors de la récupération des exercices:', error);
    return new Map();
  }
};

/**
 * Crée un nouveau programme
 * @param programData - Données du programme
 * @returns Le programme créé ou null en cas d'erreur
 */
export const createProgram = async (programData: {
  coach_id: string;
  name: string;
  objective?: string;
  week_count: number;
  sessions_per_week?: number;
}): Promise<Program | null> => {
  try {
    const { data, error } = await supabase
      .from('program_templates')
      .insert(programData)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du programme:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur globale lors de la création du programme:', error);
    return null;
  }
};

/**
 * Met à jour un programme existant
 * @param programId - ID du programme
 * @param updates - Données à mettre à jour
 * @returns Le programme mis à jour ou null en cas d'erreur
 */
export const updateProgram = async (
  programId: string,
  updates: Partial<{
    name: string;
    objective: string;
    week_count: number;
    sessions_per_week: number;
  }>
): Promise<Program | null> => {
  try {
    const { data, error } = await supabase
      .from('program_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', programId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du programme:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur globale lors de la mise à jour du programme:', error);
    return null;
  }
};

/**
 * Supprime un programme
 * @param programId - ID du programme
 * @returns true si succès, false sinon
 */
export interface ProgramDeletionResult {
  success: boolean;
  /** Liste des clients impactés par la suppression (assignations supprimées) */
  affectedClientIds: string[];
}

export const deleteProgram = async (
  programId: string
): Promise<ProgramDeletionResult> => {
  try {
    // Récupérer les assignations avant la suppression pour informer les clients
    const { data: assignments, error: assignmentsError } = await supabase
      .from('program_assignments')
      .select('id, client_id')
      .eq('program_template_id', programId);

    if (assignmentsError) {
      console.error('Erreur lors de la récupération des assignations du programme:', assignmentsError);
      return { success: false, affectedClientIds: [] };
    }

    const affectedClientIds = Array.from(
      new Set((assignments || []).map((assignment) => assignment.client_id).filter(Boolean))
    );

    // Supprimer d'abord les assignations (cascade sur les données client)
    if ((assignments || []).length > 0) {
      const { error: deleteAssignmentsError } = await supabase
        .from('program_assignments')
        .delete()
        .eq('program_template_id', programId);

      if (deleteAssignmentsError) {
        console.error('Erreur lors de la suppression des assignations liées au programme:', deleteAssignmentsError);
        return { success: false, affectedClientIds };
      }
    }

    // Supprimer ensuite le template du programme
    const { error: deleteProgramError } = await supabase
      .from('program_templates')
      .delete()
      .eq('id', programId);

    if (deleteProgramError) {
      console.error('Erreur lors de la suppression du programme:', deleteProgramError);
      return { success: false, affectedClientIds };
    }

    return { success: true, affectedClientIds };
  } catch (error) {
    console.error('Erreur globale lors de la suppression du programme:', error);
    return { success: false, affectedClientIds: [] };
  }
};
