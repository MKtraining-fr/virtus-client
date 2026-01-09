import { supabase } from './supabase';

export interface PhotoSession {
  id: string;
  client_id: string;
  coach_id: string;
  session_date: string;
  description: string | null;
  photo_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ClientDocument {
  id: string;
  client_id: string;
  coach_id: string | null;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  description: string | null;
  category: 'medical' | 'identity' | 'contract' | 'progress' | 'nutrition' | 'other';
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadDocumentParams {
  file: File;
  clientId: string;
  coachId: string | null;
  uploadedBy: string;
  category?: 'medical' | 'identity' | 'contract' | 'progress' | 'nutrition' | 'other';
  description?: string;
  sessionId?: string | null;
}

/**
 * Upload un fichier vers Supabase Storage et enregistre les métadonnées dans la table client_documents
 */
export async function uploadClientDocument(params: UploadDocumentParams): Promise<ClientDocument> {
  const { file, clientId, coachId, uploadedBy, category = 'progress', description, sessionId = null } = params;

  try {
    // 1. Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // 2. Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Erreur upload Storage:', uploadError);
      throw new Error(`Erreur lors de l'upload du fichier: ${uploadError.message}`);
    }

    // 3. L'URL sera générée dynamiquement côté client avec createSignedUrl
    // On stocke juste le chemin du fichier
    const fileUrl = fileName;

    // 4. Enregistrer les métadonnées dans la table client_documents
    const { data: docData, error: docError } = await supabase
      .from('client_documents')
      .insert({
        client_id: clientId,
        coach_id: coachId,
        uploaded_by: uploadedBy,
        file_name: file.name,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
        description: description || null,
        category: category,
        session_id: sessionId,
      })
      .select()
      .single();

    if (docError) {
      console.error('Erreur insertion BDD:', docError);
      // Tenter de supprimer le fichier uploadé si l'insertion échoue
      await supabase.storage.from('client-documents').remove([fileName]);
      throw new Error(`Erreur lors de l'enregistrement du document: ${docError.message}`);
    }

    return docData as ClientDocument;
  } catch (error) {
    console.error('Erreur uploadClientDocument:', error);
    throw error;
  }
}

/**
 * Récupère tous les documents d'un client
 */
export async function getClientDocuments(clientId: string): Promise<ClientDocument[]> {
  try {
    const { data, error } = await supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur getClientDocuments:', error);
      throw error;
    }

    return (data || []) as ClientDocument[];
  } catch (error) {
    console.error('Erreur getClientDocuments:', error);
    return [];
  }
}

/**
 * Récupère les documents d'un client visibles par le coach
 */
export async function getClientDocumentsByCoach(clientId: string, coachId: string): Promise<ClientDocument[]> {
  try {
    const { data, error } = await supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur getClientDocumentsByCoach:', error);
      throw error;
    }

    return (data || []) as ClientDocument[];
  } catch (error) {
    console.error('Erreur getClientDocumentsByCoach:', error);
    return [];
  }
}

/**
 * Supprime un document (fichier + métadonnées)
 */
export async function deleteClientDocument(documentId: string): Promise<void> {
  try {
    // 1. Récupérer les infos du document pour obtenir l'URL
    const { data: doc, error: fetchError } = await supabase
      .from('client_documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      throw new Error('Document introuvable');
    }

    // 2. Extraire le chemin du fichier
    // file_url peut être soit un chemin direct (clientId/file.jpg) soit une URL complète
    let filePath = doc.file_url;
    
    // Si c'est une URL complète, extraire le chemin
    if (doc.file_url.startsWith('http://') || doc.file_url.startsWith('https://')) {
      try {
        const url = new URL(doc.file_url);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.indexOf('client-documents');
        if (bucketIndex !== -1) {
          filePath = pathParts.slice(bucketIndex + 1).join('/');
        }
      } catch (urlError) {
        console.error('Erreur parsing URL:', urlError);
        // Si l'URL est invalide, on suppose que c'est déjà un chemin
      }
    }

    // 3. Supprimer le fichier du Storage
    const { error: storageError } = await supabase.storage
      .from('client-documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Erreur suppression Storage:', storageError);
      // On continue quand même pour supprimer les métadonnées
    }

    // 4. Supprimer les métadonnées de la BDD
    const { error: deleteError } = await supabase
      .from('client_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Erreur suppression BDD:', deleteError);
      throw new Error(`Erreur lors de la suppression du document: ${deleteError.message}`);
    }
  } catch (error) {
    console.error('Erreur deleteClientDocument:', error);
    throw error;
  }
}

/**
 * Récupère uniquement les photos d'un client
 */
export async function getClientPhotos(clientId: string): Promise<ClientDocument[]> {
  try {
    const { data, error } = await supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', clientId)
      .eq('category', 'progress')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur getClientPhotos:', error);
      throw error;
    }

    return (data || []) as ClientDocument[];
  } catch (error) {
    console.error('Erreur getClientPhotos:', error);
    return [];
  }
}

/**
 * Récupère uniquement les documents (non-photos) d'un client
 */
export async function getClientFiles(clientId: string): Promise<ClientDocument[]> {
  try {
    const { data, error } = await supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', clientId)
      .eq('category', 'document')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur getClientFiles:', error);
      throw error;
    }

    return (data || []) as ClientDocument[];
  } catch (error) {
    console.error('Erreur getClientFiles:', error);
    return [];
  }
}

/**
 * Crée une nouvelle session de photos
 */
export async function createPhotoSession(params: {
  clientId: string;
  coachId: string;
  description?: string;
}): Promise<PhotoSession> {
  const { clientId, coachId, description } = params;

  try {
    const { data, error } = await supabase
      .from('photo_sessions')
      .insert({
        client_id: clientId,
        coach_id: coachId,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur createPhotoSession:', error);
      throw new Error(`Erreur lors de la création de la session: ${error.message}`);
    }

    return data as PhotoSession;
  } catch (error) {
    console.error('Erreur createPhotoSession:', error);
    throw error;
  }
}

/**
 * Upload plusieurs photos dans une même session
 */
export async function uploadMultiplePhotos(params: {
  files: File[];
  clientId: string;
  coachId: string;
  uploadedBy: string;
  description?: string;
}): Promise<{ session: PhotoSession; documents: ClientDocument[] }> {
  const { files, clientId, coachId, uploadedBy, description } = params;

  try {
    // 1. Créer une session
    const session = await createPhotoSession({
      clientId,
      coachId,
      description,
    });

    // 2. Upload toutes les photos avec le session_id
    const uploadPromises = files.map((file) =>
      uploadClientDocument({
        file,
        clientId,
        coachId,
        uploadedBy,
        category: 'progress',
        sessionId: session.id,
      })
    );

    const documents = await Promise.all(uploadPromises);

    return { session, documents };
  } catch (error) {
    console.error('Erreur uploadMultiplePhotos:', error);
    throw error;
  }
}

/**
 * Récupère toutes les sessions de photos d'un client pour un coach
 */
export async function getPhotoSessions(clientId: string, coachId: string): Promise<PhotoSession[]> {
  try {
    const { data, error } = await supabase
      .from('photo_sessions')
      .select(`
        *,
        photo_count:client_documents(count)
      `)
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Erreur getPhotoSessions:', error);
      throw error;
    }

    // Transformer les données pour extraire le count
    const sessions = (data || []).map((session: any) => ({
      ...session,
      photo_count: session.photo_count?.[0]?.count || 0,
    }));

    return sessions as PhotoSession[];
  } catch (error) {
    console.error('Erreur getPhotoSessions:', error);
    return [];
  }
}

/**
 * Récupère les photos d'une session spécifique
 */
export async function getSessionPhotos(sessionId: string): Promise<ClientDocument[]> {
  try {
    const { data, error } = await supabase
      .from('client_documents')
      .select('*')
      .eq('session_id', sessionId)
      .eq('category', 'progress')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erreur getSessionPhotos:', error);
      throw error;
    }

    return (data || []) as ClientDocument[];
  } catch (error) {
    console.error('Erreur getSessionPhotos:', error);
    return [];
  }
}

/**
 * Supprime une session de photos et toutes les photos associées
 */
export async function deletePhotoSession(sessionId: string): Promise<void> {
  try {
    // 1. Récupérer toutes les photos de la session
    const photos = await getSessionPhotos(sessionId);

    // 2. Supprimer tous les fichiers du Storage
    const filePaths = photos.map(photo => photo.file_url);
    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('client-documents')
        .remove(filePaths);

      if (storageError) {
        console.error('Erreur suppression Storage:', storageError);
        // On continue quand même
      }
    }

    // 3. Supprimer les métadonnées des documents (cascade via session_id)
    const { error: docsError } = await supabase
      .from('client_documents')
      .delete()
      .eq('session_id', sessionId);

    if (docsError) {
      console.error('Erreur suppression documents:', docsError);
      throw new Error(`Erreur lors de la suppression des documents: ${docsError.message}`);
    }

    // 4. Supprimer la session
    const { error: sessionError } = await supabase
      .from('photo_sessions')
      .delete()
      .eq('id', sessionId);

    if (sessionError) {
      console.error('Erreur suppression session:', sessionError);
      throw new Error(`Erreur lors de la suppression de la session: ${sessionError.message}`);
    }
  } catch (error) {
    console.error('Erreur deletePhotoSession:', error);
    throw error;
  }
}

/**
 * Récupère les sessions de photos d'un client (pour le client lui-même)
 */
export async function getClientOwnPhotoSessions(clientId: string): Promise<PhotoSession[]> {
  try {
    const { data, error } = await supabase
      .from('photo_sessions')
      .select(`
        *,
        photo_count:client_documents(count)
      `)
      .eq('client_id', clientId)
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Erreur getClientOwnPhotoSessions:', error);
      throw error;
    }

    // Transformer les données pour extraire le count
    const sessions = (data || []).map((session: any) => ({
      ...session,
      photo_count: session.photo_count?.[0]?.count || 0,
    }));

    return sessions as PhotoSession[];
  } catch (error) {
    console.error('Erreur getClientOwnPhotoSessions:', error);
    return [];
  }
}
