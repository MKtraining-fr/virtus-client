import { supabase } from './supabase';

export interface ExerciseArchive {
    id: string;
    exercise_id: string;
    exercise_name: string;
    exercise_data: any;
    archived_at: string;
    archived_by: string;
    marked_for_deletion_at: string | null;
}

/**
 * Archive un exercice (soft delete)
 * L'exercice est copié dans la table exercise_archives et marqué comme archivé
 */
export async function archiveExercise(exerciseId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Récupérer les données de l'exercice
        const { data: exercise, error: fetchError } = await supabase
            .from('exercises')
            .select('*')
            .eq('id', exerciseId)
            .single();

        if (fetchError) {
            console.error('Error fetching exercise:', fetchError);
            return { success: false, error: fetchError.message };
        }

        if (!exercise) {
            return { success: false, error: 'Exercise not found' };
        }

        // 2. Créer une entrée dans exercise_archives
        const { error: archiveError } = await supabase
            .from('exercise_archives')
            .insert({
                exercise_id: exerciseId,
                exercise_name: exercise.name,
                exercise_data: exercise,
                archived_by: userId
            });

        if (archiveError) {
            console.error('Error creating archive:', archiveError);
            return { success: false, error: archiveError.message };
        }

        // 3. Supprimer l'exercice de la table exercises
        const { error: deleteError } = await supabase
            .from('exercises')
            .delete()
            .eq('id', exerciseId);

        if (deleteError) {
            console.error('Error deleting exercise:', deleteError);
            return { success: false, error: deleteError.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error in archiveExercise:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Archive plusieurs exercices en une seule opération
 */
export async function archiveMultipleExercises(
    exerciseIds: string[], 
    userId: string
): Promise<{ success: boolean; archivedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let archivedCount = 0;

    for (const exerciseId of exerciseIds) {
        const result = await archiveExercise(exerciseId, userId);
        if (result.success) {
            archivedCount++;
        } else {
            errors.push(`Failed to archive exercise ${exerciseId}: ${result.error}`);
        }
    }

    return {
        success: errors.length === 0,
        archivedCount,
        errors
    };
}

/**
 * Restaure un exercice archivé
 */
export async function restoreExercise(archiveId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Récupérer l'archive
        const { data: archive, error: fetchError } = await supabase
            .from('exercise_archives')
            .select('*')
            .eq('id', archiveId)
            .single();

        if (fetchError) {
            console.error('Error fetching archive:', fetchError);
            return { success: false, error: fetchError.message };
        }

        if (!archive) {
            return { success: false, error: 'Archive not found' };
        }

        // 2. Restaurer l'exercice dans la table exercises
        const { error: restoreError } = await supabase
            .from('exercises')
            .insert(archive.exercise_data);

        if (restoreError) {
            console.error('Error restoring exercise:', restoreError);
            return { success: false, error: restoreError.message };
        }

        // 3. Supprimer l'archive
        const { error: deleteError } = await supabase
            .from('exercise_archives')
            .delete()
            .eq('id', archiveId);

        if (deleteError) {
            console.error('Error deleting archive:', deleteError);
            return { success: false, error: deleteError.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error in restoreExercise:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprime définitivement un exercice archivé
 */
export async function deleteArchivedExercise(archiveId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('exercise_archives')
            .delete()
            .eq('id', archiveId);

        if (error) {
            console.error('Error deleting archived exercise:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error in deleteArchivedExercise:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Récupère tous les exercices archivés pour un utilisateur
 */
export async function getArchivedExercises(userId: string): Promise<{ data: ExerciseArchive[] | null; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('exercise_archives')
            .select('*')
            .eq('archived_by', userId)
            .order('archived_at', { ascending: false });

        if (error) {
            console.error('Error fetching archived exercises:', error);
            return { data: null, error: error.message };
        }

        return { data };
    } catch (error: any) {
        console.error('Unexpected error in getArchivedExercises:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Marque un exercice archivé pour suppression (après 3 mois)
 */
export async function markForDeletion(archiveId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('exercise_archives')
            .update({ marked_for_deletion_at: new Date().toISOString() })
            .eq('id', archiveId);

        if (error) {
            console.error('Error marking for deletion:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error in markForDeletion:', error);
        return { success: false, error: error.message };
    }
}

