import { supabase } from './supabase';

/**
 * Interface pour un programme créé par un client, vu par le coach
 */
export interface ClientCreatedProgramView {
  id: string;
  program_template_id: string;
  client_id: string;
  client_name: string; // Nom complet du client
  name: string;
  objective: string;
  week_count: number;
  status: string;
  created_at: string;
  created_by_client: boolean;
}

/**
 * Récupère tous les programmes créés par les clients d'un coach
 * @param coachId - L'ID du coach
 * @returns Liste des programmes créés par les clients
 */
export const getClientCreatedProgramsForCoach = async (
  coachId: string
): Promise<ClientCreatedProgramView[]> => {
  try {
    const { data, error } = await supabase
      .from('client_created_programs')
      .select(`
        id,
        program_template_id,
        client_id,
        name,
        objective,
        week_count,
        source_type,
        created_at,
        clients!client_created_programs_client_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des programmes créés par les clients:', error);
      throw error;
    }

    // Transformer les données pour inclure le nom complet du client
    const programs: ClientCreatedProgramView[] = (data || []).map((prog: any) => ({
      id: prog.id,
      program_template_id: prog.program_template_id || '',
      client_id: prog.client_id,
      client_name: `${prog.clients.first_name} ${prog.clients.last_name}`,
      name: prog.name,
      objective: prog.objective,
      week_count: prog.week_count,
      status: prog.source_type === 'client_created' ? 'created_by_client' : 'assigned_by_coach',
      created_at: prog.created_at,
      created_by_client: prog.source_type === 'client_created',
    }));

    return programs;
  } catch (error) {
    console.error('Erreur globale lors de la récupération des programmes clients:', error);
    return [];
  }
};

/**
 * Récupère les programmes créés par un client spécifique
 * @param clientId - L'ID du client
 * @returns Liste des programmes créés par ce client
 */
export const getClientCreatedProgramsByClientId = async (
  clientId: string
): Promise<ClientCreatedProgramView[]> => {
  try {
    const { data, error } = await supabase
      .from('client_created_programs')
      .select(`
        id,
        program_template_id,
        client_id,
        name,
        objective,
        week_count,
        source_type,
        created_at,
        clients!client_created_programs_client_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des programmes du client:', error);
      throw error;
    }

    const programs: ClientCreatedProgramView[] = (data || []).map((prog: any) => ({
      id: prog.id,
      program_template_id: prog.program_template_id || '',
      client_id: prog.client_id,
      client_name: `${prog.clients.first_name} ${prog.clients.last_name}`,
      name: prog.name,
      objective: prog.objective,
      week_count: prog.week_count,
      status: prog.source_type === 'client_created' ? 'created_by_client' : 'assigned_by_coach',
      created_at: prog.created_at,
      created_by_client: prog.source_type === 'client_created',
    }));

    return programs;
  } catch (error) {
    console.error('Erreur lors de la récupération des programmes du client:', error);
    return [];
  }
};
