import { supabase } from './supabase';
import { Exercise } from '../types';

/**
 * Interface représentant un exercice au format Supabase (snake_case)
 */
interface SupabaseExercise {
  id?: string;
  name: string;
  description?: string | null;
  category?: string | null;
  muscle_group?: string | null;
  muscle_group2?: string | null;
  muscle_group3?: string | null;
  secondary_muscle_groups?: string[] | null;
  equipment?: string | null;
  difficulty?: string | null;
  video_url?: string | null;
  image_url?: string | null;
  type?: string | null;
  alternative_1_id?: string | null;
  alternative_2_id?: string | null;
  created_by?: string | null;
  is_public?: boolean;
  is_archived?: boolean;
  archived_at?: string | null;
  ref?: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Convertit un objet Exercise (frontend) en format Supabase (snake_case)
 */
export const exerciseToSupabase = (
  exercise: Partial<Exercise>,
  userId: string,
  isAdmin: boolean
): SupabaseExercise => {
  return {
    name: exercise.name!.trim(),
    description: exercise.description?.trim() || null,
    category: exercise.category?.trim() || null,
    // Répartir les groupes musculaires principaux sur 3 colonnes
    muscle_group: exercise.muscleGroups?.[0] || null,
    muscle_group2: exercise.muscleGroups?.[1] || null,
    muscle_group3: exercise.muscleGroups?.[2] || null,
    secondary_muscle_groups: exercise.secondaryMuscleGroups || null,
    equipment: exercise.equipment || null,
    difficulty: exercise.difficulty || null,
    video_url: exercise.videoUrl?.trim() || null,
    image_url: exercise.illustrationUrl?.trim() || null,
    type: exercise.type || exercise.category || 'musculation',
    // Gérer les alternatives (max 2)
    alternative_1_id: exercise.alternativeIds?.[0] || null,
    alternative_2_id: exercise.alternativeIds?.[1] || null,
    // Admin crée des exercices système (created_by = null), Coach crée des exercices personnels
    created_by: isAdmin ? null : userId,
    // Admin crée des exercices publics par défaut, Coach crée des exercices privés
    is_public: isAdmin ? true : (exercise.isPublic ?? false),
    is_archived: false,
  };
};

/**
 * Convertit un objet Supabase en format Exercise (frontend)
 */
export const supabaseToExercise = (supabaseExercise: SupabaseExercise): Exercise => {
  // Reconstituer le tableau des groupes musculaires principaux
  const muscleGroups: string[] = [
    supabaseExercise.muscle_group,
    supabaseExercise.muscle_group2,
    supabaseExercise.muscle_group3,
  ].filter((group): group is string => Boolean(group));

  // Reconstituer le tableau des alternatives
  const alternativeIds: string[] = [
    supabaseExercise.alternative_1_id,
    supabaseExercise.alternative_2_id,
  ].filter((id): id is string => Boolean(id));

  return {
    id: supabaseExercise.id!,
    name: supabaseExercise.name,
    description: supabaseExercise.description || undefined,
    category: supabaseExercise.category || undefined,
    muscleGroups: muscleGroups.length > 0 ? muscleGroups : undefined,
    secondaryMuscleGroups: supabaseExercise.secondary_muscle_groups || undefined,
    equipment: supabaseExercise.equipment || undefined,
    difficulty: supabaseExercise.difficulty || undefined,
    videoUrl: supabaseExercise.video_url || undefined,
    illustrationUrl: supabaseExercise.image_url || undefined,
    type: supabaseExercise.type || undefined,
    alternativeIds: alternativeIds.length > 0 ? alternativeIds : undefined,
    coachId: supabaseExercise.created_by || undefined,
    isPublic: supabaseExercise.is_public,
    isArchived: supabaseExercise.is_archived,
  };
};

/**
 * Crée un nouvel exercice dans Supabase
 * 
 * @param exercise - Données de l'exercice à créer
 * @param userId - ID de l'utilisateur créateur
 * @param isAdmin - Indique si l'utilisateur est admin
 * @returns L'exercice créé ou null en cas d'erreur
 */
export const createExercise = async (
  exercise: Partial<Exercise>,
  userId: string,
  isAdmin: boolean = false
): Promise<Exercise | null> => {
  try {
    // Validation des champs requis
    if (!exercise.name || exercise.name.trim() === '') {
      throw new Error('Le nom de l\'exercice est obligatoire');
    }

    // Convertir au format Supabase
    const supabaseExercise = exerciseToSupabase(exercise, userId, isAdmin);

    // Insérer dans Supabase
    const { data, error } = await supabase
      .from('exercises')
      .insert(supabaseExercise)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'exercice:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Aucune donnée retournée après l\'insertion');
    }

    // Convertir au format frontend
    return supabaseToExercise(data as SupabaseExercise);
  } catch (error) {
    console.error('Erreur dans createExercise:', error);
    return null;
  }
};

/**
 * Met à jour un exercice existant
 * 
 * @param exerciseId - ID de l'exercice à mettre à jour
 * @param updates - Modifications à apporter
 * @param userId - ID de l'utilisateur effectuant la modification
 * @param isAdmin - Indique si l'utilisateur est admin
 * @returns L'exercice mis à jour ou null en cas d'erreur
 */
export const updateExercise = async (
  exerciseId: string,
  updates: Partial<Exercise>,
  userId: string,
  isAdmin: boolean = false
): Promise<Exercise | null> => {
  try {
    // Convertir au format Supabase
    const supabaseUpdates = exerciseToSupabase(updates, userId, isAdmin);

    // Mettre à jour dans Supabase
    const { data, error } = await supabase
      .from('exercises')
      .update({
        ...supabaseUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', exerciseId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'exercice:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Aucune donnée retournée après la mise à jour');
    }

    // Convertir au format frontend
    return supabaseToExercise(data as SupabaseExercise);
  } catch (error) {
    console.error('Erreur dans updateExercise:', error);
    return null;
  }
};

/**
 * Supprime un exercice (soft delete via archivage)
 * 
 * @param exerciseId - ID de l'exercice à supprimer
 * @returns true si succès, false sinon
 */
export const deleteExercise = async (exerciseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('exercises')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq('id', exerciseId);

    if (error) {
      console.error('Erreur lors de la suppression de l\'exercice:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur dans deleteExercise:', error);
    return false;
  }
};

/**
 * Récupère tous les exercices visibles pour un utilisateur
 * 
 * @param userId - ID de l'utilisateur
 * @param isAdmin - Indique si l'utilisateur est admin
 * @returns Liste des exercices
 */
export const getExercises = async (
  userId: string,
  isAdmin: boolean = false
): Promise<Exercise[]> => {
  try {
    let query = supabase
      .from('exercises')
      .select('*')
      .eq('is_archived', false);

    // Si ce n'est pas un admin, filtrer pour ne montrer que :
    // - Les exercices publics (created_by = null)
    // - Les exercices créés par le coach lui-même
    if (!isAdmin) {
      query = query.or(`created_by.is.null,created_by.eq.${userId}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des exercices:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Convertir au format frontend
    return data.map((ex) => supabaseToExercise(ex as SupabaseExercise));
  } catch (error) {
    console.error('Erreur dans getExercises:', error);
    return [];
  }
};

/**
 * Récupère un exercice par son ID
 * 
 * @param exerciseId - ID de l'exercice
 * @returns L'exercice ou null si non trouvé
 */
export const getExerciseById = async (exerciseId: string): Promise<Exercise | null> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de l\'exercice:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return supabaseToExercise(data as SupabaseExercise);
  } catch (error) {
    console.error('Erreur dans getExerciseById:', error);
    return null;
  }
};
