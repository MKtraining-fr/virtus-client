import { supabase } from './supabase';

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
}

/**
 * Upload un fichier vers Supabase Storage et enregistre les métadonnées dans la table client_documents
 */
export async function uploadClientDocument(params: UploadDocumentParams): Promise<ClientDocument> {
  const { file, clientId, coachId, uploadedBy, category = 'progress', description } = params;

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

    // 3. Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('client-documents')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Impossible d\'obtenir l\'URL du fichier');
    }

    // 4. Enregistrer les métadonnées dans la table client_documents
    const { data: docData, error: docError } = await supabase
      .from('client_documents')
      .insert({
        client_id: clientId,
        coach_id: coachId,
        uploaded_by: uploadedBy,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        description: description || null,
        category: category,
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

    // 2. Extraire le chemin du fichier depuis l'URL
    const url = new URL(doc.file_url);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('client-documents') + 1).join('/');

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
