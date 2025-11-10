import { supabase } from './supabase';

/**
 * Service pour l'attribution de programmes par les coachs aux clients
 * Implémente le système hybride : duplication du template dans client_created_*
 */

export interface ProgramAssignment {
  id: string;
  program_id: string; // Template original
  client_program_id: string; // Copie dans client_created_programs
  client_id: string;
  coach_id: string;
  start_date: string;
  end_date?: string;
  current_week: number;
  current_session: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

/**
 * Attribue un programme template à un client
 * Duplique le template dans client_created_* et crée un program_assignment
 * 
 * @param templateId - ID du template (table programs)
 * @param clientId - ID du client
 * @param coachId - ID du coach
 * @param startDate - Date de début (format ISO)
 * @returns ID du programme créé ou null en cas d'erreur
 */
export const assignProgramToClient = async (
  templateId: string,
  clientId: string,
  coachId: string,
  startDate: string
): Promise<string | null> => {
  try {
    // Utiliser la fonction RPC atomique pour garantir la cohérence
    const { data, error } = await supabase.rpc('assign_program_to_client_atomic', {
      p_template_id: templateId,
      p_client_id: clientId,
      p_coach_id: coachId,
      p_start_date: startDate,
    });

    if (error) {
      console.error('Erreur lors de l\'appel RPC:', error);
      return null;
    }

    if (!data || !data.success) {
      console.error('Erreur retournée par la fonction:', data?.error || 'Erreur inconnue');
      return null;
    }

    console.log('Programme assigné avec succès:', data.message);
    return data.assignment_id;
  } catch (error) {
    console.error("Erreur globale lors de l'attribution du programme:", error);
    return null;
  }
};

/**
 * Récupère tous les assignments d'un coach
 * @param coachId - ID du coach
 * @returns Liste des assignments
 */
export const getCoachAssignments = async (
  coachId: string
): Promise<ProgramAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des assignments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};

/**
 * Récupère tous les assignments d'un client
 * @param clientId - ID du client
 * @returns Liste des assignments
 */
export const getClientAssignments = async (
  clientId: string
): Promise<ProgramAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des assignments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};

/**
 * Met à jour le statut d'un assignment
 * @param assignmentId - ID de l'assignment
 * @param status - Nouveau statut
 * @returns Succès ou échec
 */
export const updateAssignmentStatus = async (
  assignmentId: string,
  status: 'active' | 'paused' | 'completed' | 'cancelled'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', assignmentId);

    if (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale:', error);
    return false;
  }
};

/**
 * Met à jour la progression d'un assignment
 * @param assignmentId - ID de l'assignment
 * @param currentWeek - Semaine actuelle
 * @param currentSession - Séance actuelle
 * @returns Succès ou échec
 */
export const updateAssignmentProgress = async (
  assignmentId: string,
  currentWeek: number,
  currentSession: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .update({ 
        current_week: currentWeek, 
        current_session: currentSession,
        updated_at: new Date().toISOString() 
      })
      .eq('id', assignmentId);

    if (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale:', error);
    return false;
  }
};
