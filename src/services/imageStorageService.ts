import { supabase } from './supabase';
import { logger } from '../utils/logger';

/**
 * Service de gestion des images dans Supabase Storage
 */

const BUCKET_NAME = 'exercise-images';

/**
 * Upload une image vers Supabase Storage
 * @param file - Le fichier image à uploader
 * @param exerciseName - Le nom de l'exercice (utilisé pour nommer le fichier)
 * @returns L'URL publique de l'image ou null en cas d'erreur
 */
export const uploadExerciseImage = async (
  file: File,
  exerciseName: string
): Promise<string | null> => {
  try {
    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedName = exerciseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${sanitizedName}-${timestamp}.${fileExtension}`;

    logger.info('Upload d\'image vers Supabase Storage', { fileName, fileSize: file.size });

    // Upload du fichier
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      logger.error('Erreur lors de l\'upload de l\'image', { error });
      throw error;
    }

    // Récupérer l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    logger.info('Image uploadée avec succès', { url: publicUrlData.publicUrl });

    return publicUrlData.publicUrl;
  } catch (error) {
    logger.error('Exception lors de l\'upload de l\'image', { error });
    return null;
  }
};

/**
 * Supprimer une image de Supabase Storage
 * @param imageUrl - L'URL de l'image à supprimer
 * @returns true si la suppression a réussi, false sinon
 */
export const deleteExerciseImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extraire le nom du fichier de l'URL
    const fileName = imageUrl.split('/').pop();
    if (!fileName) {
      logger.error('Impossible d\'extraire le nom du fichier de l\'URL', { imageUrl });
      return false;
    }

    logger.info('Suppression d\'image de Supabase Storage', { fileName });

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);

    if (error) {
      logger.error('Erreur lors de la suppression de l\'image', { error });
      return false;
    }

    logger.info('Image supprimée avec succès', { fileName });
    return true;
  } catch (error) {
    logger.error('Exception lors de la suppression de l\'image', { error });
    return false;
  }
};

/**
 * Remplacer une image existante par une nouvelle
 * @param oldImageUrl - L'URL de l'ancienne image (à supprimer)
 * @param newFile - Le nouveau fichier image
 * @param exerciseName - Le nom de l'exercice
 * @returns L'URL publique de la nouvelle image ou null en cas d'erreur
 */
export const replaceExerciseImage = async (
  oldImageUrl: string | null,
  newFile: File,
  exerciseName: string
): Promise<string | null> => {
  try {
    // Supprimer l'ancienne image si elle existe et n'est pas en base64
    if (oldImageUrl && !oldImageUrl.startsWith('data:')) {
      await deleteExerciseImage(oldImageUrl);
    }

    // Upload la nouvelle image
    return await uploadExerciseImage(newFile, exerciseName);
  } catch (error) {
    logger.error('Exception lors du remplacement de l\'image', { error });
    return null;
  }
};
