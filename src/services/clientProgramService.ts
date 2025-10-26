import { supabase } from './supabase';

// Types pour les programmes clients (instances)
export interface ClientProgram {
  id: string;
  program_template_id?: string;
  client_id: string;
  coach_id: string;
  name: string;
  objective?: string;
  week_count: number;
  assigned_at: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'paused';
  current_week: number;
  current_session_index: number;
  created_at: string;
  updated_at: string;
}

export interface ClientProgramInput {
  program_template_id?: string;
  client_id: string;
  name: string;
  objective?: string;
  week_count: number;
  start_date?: string;
  end_date?: string;
}

export interface ClientSession {
  id: string;
  session_template_id?: string;
  client_program_id?: string;
  client_id: string;
  coach_id: string;
  name: string;
  week_number: number;
  session_order: number;
  status: 'pending' | 'completed' | 'skipped';
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientSessionInput {
  session_template_id?: string;
  client_program_id?: string;
  client_id: string;
  name: string;
  week_number: number;
  session_order: number;
}

// Assigner un programme à un client (créer une instance)
export const assignProgramToClient = async (
  programData: ClientProgramInput
): Promise<ClientProgram | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('client_programs')
      .insert({
        coach_id: user.id,
        ...programData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning program to client:', error);
    return null;
  }
};

// Récupérer les programmes d'un client
export const getClientPrograms = async (clientId: string): Promise<ClientProgram[]> => {
  try {
    const { data, error } = await supabase
      .from('client_programs')
      .select('*')
      .eq('client_id', clientId)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching client programs:', error);
    return [];
  }
};

// Récupérer un programme client par ID
export const getClientProgramById = async (programId: string): Promise<ClientProgram | null> => {
  try {
    const { data, error } = await supabase
      .from('client_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching client program:', error);
    return null;
  }
};

// Mettre à jour un programme client
export const updateClientProgram = async (
  programId: string,
  updates: Partial<
    ClientProgramInput & { status?: string; current_week?: number; current_session_index?: number }
  >
): Promise<ClientProgram | null> => {
  try {
    const { data, error } = await supabase
      .from('client_programs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', programId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating client program:', error);
    return null;
  }
};

// Supprimer un programme client
export const deleteClientProgram = async (programId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('client_programs').delete().eq('id', programId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting client program:', error);
    return false;
  }
};

// Assigner une séance à un client (créer une instance)
export const assignSessionToClient = async (
  sessionData: ClientSessionInput
): Promise<ClientSession | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('client_sessions')
      .insert({
        coach_id: user.id,
        ...sessionData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning session to client:', error);
    return null;
  }
};

// Récupérer les séances d'un client
export const getClientSessions = async (clientId: string): Promise<ClientSession[]> => {
  try {
    const { data, error } = await supabase
      .from('client_sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching client sessions:', error);
    return [];
  }
};

// Récupérer les séances d'un programme client
export const getClientProgramSessions = async (
  clientProgramId: string
): Promise<ClientSession[]> => {
  try {
    const { data, error } = await supabase
      .from('client_sessions')
      .select('*')
      .eq('client_program_id', clientProgramId)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching client program sessions:', error);
    return [];
  }
};

// Mettre à jour une séance client
export const updateClientSession = async (
  sessionId: string,
  updates: Partial<ClientSessionInput & { status?: string; completed_at?: string; notes?: string }>
): Promise<ClientSession | null> => {
  try {
    const { data, error } = await supabase
      .from('client_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating client session:', error);
    return null;
  }
};

// Marquer une séance client comme complétée
export const completeClientSession = async (sessionId: string): Promise<ClientSession | null> => {
  return updateClientSession(sessionId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
};
