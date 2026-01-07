import { supabase } from './supabase';

export interface ClientTrainingInfo {
  id?: string;
  client_id: string;
  experience?: string;
  training_since?: string;
  sessions_per_week?: number;
  session_duration?: number;
  training_type?: string;
  issues?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * Récupère les informations d'entraînement d'un client
 */
export const getClientTrainingInfo = async (clientId: string): Promise<ClientTrainingInfo | null> => {
  try {
    const { data, error } = await supabase
      .from('client_training_info')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) {
      // Si l'erreur est "no rows returned", ce n'est pas une vraie erreur
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching client training info:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getClientTrainingInfo:', error);
    return null;
  }
};

/**
 * Crée ou met à jour les informations d'entraînement d'un client
 */
export const upsertClientTrainingInfo = async (
  trainingInfo: ClientTrainingInfo,
  userId: string
): Promise<ClientTrainingInfo> => {
  try {
    // Vérifier si un enregistrement existe déjà
    const existing = await getClientTrainingInfo(trainingInfo.client_id);

    const dataToUpsert = {
      client_id: trainingInfo.client_id,
      experience: trainingInfo.experience || null,
      training_since: trainingInfo.training_since || null,
      sessions_per_week: trainingInfo.sessions_per_week || null,
      session_duration: trainingInfo.session_duration || null,
      training_type: trainingInfo.training_type || null,
      issues: trainingInfo.issues || null,
      updated_by: userId,
      ...(existing ? {} : { created_by: userId }),
    };

    const { data, error } = await supabase
      .from('client_training_info')
      .upsert([dataToUpsert], { onConflict: 'client_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting client training info:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertClientTrainingInfo:', error);
    throw error;
  }
};

/**
 * Supprime les informations d'entraînement d'un client
 */
export const deleteClientTrainingInfo = async (clientId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('client_training_info')
      .delete()
      .eq('client_id', clientId);

    if (error) {
      console.error('Error deleting client training info:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteClientTrainingInfo:', error);
    throw error;
  }
};
