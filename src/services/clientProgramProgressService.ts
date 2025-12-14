/**
 * Service pour interroger la vue client_program_progress
 * 
 * Cette vue est la SOURCE DE VÉRITÉ UNIQUE pour la progression des clients.
 * Elle calcule automatiquement la progression à partir de client_sessions.
 */

import { supabase } from './supabase';

export interface ClientProgramProgress {
  assignment_id: string;
  client_id: string;
  program_template_id: string;
  coach_id: string;
  start_date: string;
  end_date: string | null;
  assignment_status: string;
  assignment_created_at: string;
  assignment_updated_at: string;
  
  // Progression calculée
  current_week: number;
  current_session_order: number;
  completed_sessions_count: number;
  total_sessions_count: number;
  last_completed_session_at: string | null;
  completed_sessions_this_week: number;
  total_sessions_this_week: number;
}

/**
 * Récupère la progression d'un client pour un assignment donné
 */
export const getClientProgramProgress = async (
  assignmentId: string
): Promise<ClientProgramProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('client_program_progress')
      .select('*')
      .eq('assignment_id', assignmentId)
      .single();

    if (error) {
      console.error('[getClientProgramProgress] Erreur:', error);
      return null;
    }

    return data as ClientProgramProgress;
  } catch (error) {
    console.error('[getClientProgramProgress] Erreur globale:', error);
    return null;
  }
};

/**
 * Récupère la progression de tous les clients d'un coach
 */
export const getAllClientsProgress = async (
  coachId: string
): Promise<ClientProgramProgress[]> => {
  try {
    const { data, error } = await supabase
      .from('client_program_progress')
      .select('*')
      .eq('coach_id', coachId)
      .eq('assignment_status', 'active')
      .order('assignment_updated_at', { ascending: false });

    if (error) {
      console.error('[getAllClientsProgress] Erreur:', error);
      return [];
    }

    return data as ClientProgramProgress[];
  } catch (error) {
    console.error('[getAllClientsProgress] Erreur globale:', error);
    return [];
  }
};

/**
 * Récupère la progression d'un client spécifique
 */
export const getClientProgress = async (
  clientId: string
): Promise<ClientProgramProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('client_program_progress')
      .select('*')
      .eq('client_id', clientId)
      .eq('assignment_status', 'active')
      .order('assignment_created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[getClientProgress] Erreur:', error);
      return null;
    }

    return data as ClientProgramProgress | null;
  } catch (error) {
    console.error('[getClientProgress] Erreur globale:', error);
    return null;
  }
};
