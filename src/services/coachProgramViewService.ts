import { supabase } from './supabase';

/**
 * Interface pour un programme créé par un client, vu par le coach
 * Version complète avec toutes les métadonnées
 */
export interface ClientCreatedProgramView {
  id: string;
  assignment_id: string | null;
  program_template_id: string | null;
  client_id: string;
  client_name: string; // Nom complet du client
  name: string;
  objective: string;
  week_count: number;
  source_type: 'client_created' | 'coach_assigned';
  modified_by_client: boolean;
  viewed_by_coach: boolean;
  status: string;
  created_at: string;
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
        assignment_id,
        program_template_id,
        client_id,
        name,
        objective,
        week_count,
        source_type,
        modified_by_client,
        viewed_by_coach,
        created_at,
        clients!client_programs_client_id_fkey (
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
      assignment_id: prog.assignment_id,
      program_template_id: prog.program_template_id,
      client_id: prog.client_id,
      client_name: `${prog.clients.first_name} ${prog.clients.last_name}`,
      name: prog.name,
      objective: prog.objective,
      week_count: prog.week_count,
      source_type: prog.source_type,
      modified_by_client: prog.modified_by_client,
      viewed_by_coach: prog.viewed_by_coach,
      status: prog.assignment_id ? 'assigned' : 'draft',
      created_at: prog.created_at,
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
        assignment_id,
        program_template_id,
        client_id,
        name,
        objective,
        week_count,
        source_type,
        modified_by_client,
        viewed_by_coach,
        created_at,
        clients!client_programs_client_id_fkey (
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
      assignment_id: prog.assignment_id,
      program_template_id: prog.program_template_id,
      client_id: prog.client_id,
      client_name: `${prog.clients.first_name} ${prog.clients.last_name}`,
      name: prog.name,
      objective: prog.objective,
      week_count: prog.week_count,
      source_type: prog.source_type,
      modified_by_client: prog.modified_by_client,
      viewed_by_coach: prog.viewed_by_coach,
      status: prog.assignment_id ? 'assigned' : 'draft',
      created_at: prog.created_at,
    }));

    return programs;
  } catch (error) {
    console.error('Erreur lors de la récupération des programmes du client:', error);
    return [];
  }
};

/**
 * Marque un programme comme vu par le coach
 * @param programId - L'ID du programme
 * @returns true si la mise à jour a réussi, false sinon
 */
export const markProgramAsViewedByCoach = async (
  programId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_programs')
      .update({ viewed_by_coach: true })
      .eq('id', programId);

    if (error) {
      console.error('Erreur lors de la mise à jour du statut de visualisation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la mise à jour:', error);
    return false;
  }
};
