import { supabase } from './supabase';
import { BUCKET_NAMES, VIDEO_CONFIG } from '../constants/videoConfig';

export interface ExerciseVideo {
  id: string;
  clientId: string;
  coachId: string;
  performanceId: string;
  exerciseName?: string;
  setIndex?: number;
  videoUrl: string;
  fileName: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  mimeType: string;
  viewedByCoach: boolean;
  viewedAt?: string;
  coachComment?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Upload une vidéo d'exercice vers Supabase Storage
 */
export async function uploadExerciseVideo(
  clientId: string,
  coachId: string,
  performanceId: string,
  exerciseName: string,
  setIndex: number,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ videoUrl: string; videoId: string } | null> {
  try {
    // Validation de la taille
    if (file.size > VIDEO_CONFIG.MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`La vidéo dépasse la taille maximale de ${VIDEO_CONFIG.MAX_SIZE_MB} MB`);
    }

    // Validation du format
    if (!VIDEO_CONFIG.ACCEPTED_MIME_TYPES.includes(file.type)) {
      throw new Error('Format de vidéo non accepté. Utilisez MP4, MOV ou WEBM.');
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${clientId}/${performanceId}/${timestamp}_${sanitizedFileName}`;

    console.log('Uploading video:', fileName);

    // Upload vers Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAMES.EXERCISE_VIDEOS)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur upload Storage:', uploadError);
      throw uploadError;
    }

    console.log('Video uploaded successfully:', uploadData);

    // Obtenir l'URL publique signée (valide 1 an)
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAMES.EXERCISE_VIDEOS)
      .createSignedUrl(fileName, 31536000); // 1 an en secondes

    if (!urlData?.signedUrl) {
      throw new Error('Impossible de générer l\'URL de la vidéo');
    }

    console.log('Signed URL generated:', urlData.signedUrl);

    // Enregistrer les métadonnées en base de données
    const { data: videoData, error: dbError } = await supabase
      .from('exercise_set_videos')
      .insert({
        client_id: clientId,
        coach_id: coachId && coachId !== '' ? coachId : null,
        performance_id: performanceId,
        exercise_name: exerciseName,
        set_index: setIndex,
        video_url: urlData.signedUrl,
        file_name: fileName,
        file_size_bytes: file.size,
        mime_type: file.type
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Erreur enregistrement BDD:', dbError);
      throw dbError;
    }

    console.log('Video metadata saved:', videoData);

    return {
      videoUrl: urlData.signedUrl,
      videoId: videoData.id
    };
  } catch (error) {
    console.error('Erreur globale upload vidéo:', error);
    return null;
  }
}

/**
 * Récupérer les vidéos d'une performance
 */
export async function getVideosForPerformance(
  performanceId: string
): Promise<ExerciseVideo[]> {
  try {
    const { data, error } = await supabase
      .from('exercise_set_videos')
      .select('*')
      .eq('performance_id', performanceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération vidéos:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      clientId: row.client_id,
      coachId: row.coach_id,
      performanceId: row.performance_id,
      exerciseName: row.exercise_name,
      setIndex: row.set_index,
      videoUrl: row.video_url,
      fileName: row.file_name,
      fileSizeBytes: row.file_size_bytes,
      durationSeconds: row.duration_seconds,
      mimeType: row.mime_type,
      viewedByCoach: row.viewed_by_coach,
      viewedAt: row.viewed_at,
      coachComment: row.coach_comment,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error('Erreur globale récupération vidéos:', error);
    return [];
  }
}

/**
 * Récupérer toutes les vidéos d'un client
 */
export async function getVideosForClient(
  clientId: string,
  limit?: number
): Promise<ExerciseVideo[]> {
  try {
    let query = supabase
      .from('exercise_set_videos')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur récupération vidéos client:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      clientId: row.client_id,
      coachId: row.coach_id,
      performanceId: row.performance_id,
      exerciseName: row.exercise_name,
      setIndex: row.set_index,
      videoUrl: row.video_url,
      fileName: row.file_name,
      fileSizeBytes: row.file_size_bytes,
      durationSeconds: row.duration_seconds,
      mimeType: row.mime_type,
      viewedByCoach: row.viewed_by_coach,
      viewedAt: row.viewed_at,
      coachComment: row.coach_comment,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error('Erreur globale récupération vidéos client:', error);
    return [];
  }
}

/**
 * Marquer une vidéo comme vue par le coach
 */
export async function markVideoAsViewed(
  videoId: string,
  coachId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('exercise_set_videos')
      .update({
        viewed_by_coach: true,
        viewed_at: new Date().toISOString()
      })
      .eq('id', videoId)
      .eq('coach_id', coachId);

    if (error) {
      console.error('Erreur marquage vidéo vue:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale marquage vidéo:', error);
    return false;
  }
}

/**
 * Ajouter un commentaire coach sur une vidéo
 */
export async function addCoachCommentToVideo(
  videoId: string,
  comment: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('exercise_set_videos')
      .update({ 
        coach_comment: comment,
        viewed_by_coach: true,
        viewed_at: new Date().toISOString()
      })
      .eq('id', videoId);

    if (error) {
      console.error('Erreur ajout commentaire:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale ajout commentaire:', error);
    return false;
  }
}

/**
 * Supprimer une vidéo (client uniquement)
 */
export async function deleteExerciseVideo(
  videoId: string,
  fileName: string
): Promise<boolean> {
  try {
    // Supprimer de Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAMES.EXERCISE_VIDEOS)
      .remove([fileName]);

    if (storageError) {
      console.error('Erreur suppression Storage:', storageError);
      return false;
    }

    // Supprimer de la BDD
    const { error: dbError } = await supabase
      .from('exercise_set_videos')
      .delete()
      .eq('id', videoId);

    if (dbError) {
      console.error('Erreur suppression BDD:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale suppression vidéo:', error);
    return false;
  }
}

/**
 * Compter les vidéos non vues pour un coach
 */
export async function countUnviewedVideosForCoach(
  coachId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('exercise_set_videos')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('viewed_by_coach', false);

    if (error) {
      console.error('Erreur comptage vidéos non vues:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erreur globale comptage vidéos:', error);
    return 0;
  }
}
