import { supabase } from './supabase';

// Types pour les informations client
export interface ClientProfile {
  id: string;
  username?: string;
  avatar_url?: string;
  website?: string;
  medical_info?: string;
  coach_notes?: string;
  updated_at: string;
}

export interface ClientCoachRelationship {
  client_id: string;
  coach_id: string;
  created_at: string;
}

// Récupérer le profil d'un client
export const getClientProfile = async (clientId: string): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', clientId).single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching client profile:', error);
    return null;
  }
};

// Mettre à jour les notes du coach pour un client
export const updateCoachNotes = async (
  clientId: string,
  notes: string
): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        coach_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating coach notes:', error);
    return null;
  }
};

// Mettre à jour les informations médicales d'un client
export const updateMedicalInfo = async (
  clientId: string,
  medicalInfo: string
): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        medical_info: medicalInfo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating medical info:', error);
    return null;
  }
};

// Récupérer tous les clients d'un coach
export const getCoachClients = async (): Promise<ClientProfile[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Récupérer les IDs des clients via la table de relations
    const { data: relationships, error: relError } = await supabase
      .from('client_coach_relationships')
      .select('client_id')
      .eq('coach_id', user.id);

    if (relError) throw relError;

    if (!relationships || relationships.length === 0) {
      return [];
    }

    const clientIds = relationships.map((rel) => rel.client_id);

    // Récupérer les profils des clients
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', clientIds);

    if (profileError) throw profileError;
    return profiles || [];
  } catch (error) {
    console.error('Error fetching coach clients:', error);
    return [];
  }
};

// Ajouter une relation coach-client
export const addClientCoachRelationship = async (
  clientId: string
): Promise<ClientCoachRelationship | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('client_coach_relationships')
      .insert({
        client_id: clientId,
        coach_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding client-coach relationship:', error);
    return null;
  }
};

// Supprimer une relation coach-client
export const removeClientCoachRelationship = async (clientId: string): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('client_coach_relationships')
      .delete()
      .eq('client_id', clientId)
      .eq('coach_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing client-coach relationship:', error);
    return false;
  }
};

// Récupérer l'historique des programmes d'un client (pour affichage dans le créateur de séance)
export const getClientProgramHistory = async (
  clientId: string,
  limit: number = 3
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('client_programs')
      .select('*')
      .eq('client_id', clientId)
      .order('assigned_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching client program history:', error);
    return [];
  }
};
