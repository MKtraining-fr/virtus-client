/**
 * Service pour la gestion des assignations de programmes
 * Utilise le nouveau modèle de données avec program_templates et program_assignments
 * 
 * Version refactorisée - 2025-11-19
 */

import { supabase } from './supabase';

export interface ProgramAssignment {
  id: string;
  program_template_id: string;
  client_id: string;
  coach_id: string;
  start_date: string;
  end_date?: string;
  status: 'upcoming' | 'active' | 'completed' | 'paused' | 'archived';
  current_week: number;
  current_session_order: number;
  created_at: string;
  updated_at: string;
}

export interface AssignProgramResult {
  success: boolean;
  assignment_id?: string;
  client_program_id?: string;
  message?: string;
  error?: string;
}

/**
 * Assigne un programme template à un client
 * Utilise la fonction RPC assign_program_atomic pour garantir l'atomicité
 * 
 * @param templateId - ID du programme template à assigner
 * @param clientId - ID du client
 * @param coachId - ID du coach (doit être l'utilisateur connecté)
 * @param startDate - Date de début de l'assignation (format YYYY-MM-DD)
 * @returns Résultat de l'assignation avec les IDs créés
 */
export const assignProgramToClient = async (
  templateId: string,
  clientId: string,
  coachId: string,
  startDate: string
): Promise<AssignProgramResult> => {
  try {
    const { data, error } = await supabase.rpc('assign_program_atomic', {
      p_template_id: templateId,
      p_client_id: clientId,
      p_coach_id: coachId,
      p_start_date: startDate,
    });

    if (error) {
      console.error('Erreur lors de l\'assignation du programme:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erreur lors de l\'assignation du programme',
      };
    }

    // La fonction RPC retourne un JSON avec success, assignment_id, etc.
    return data as AssignProgramResult;
  } catch (error) {
    console.error('Erreur globale lors de l\'assignation:', error);
    return {
      success: false,
      error: String(error),
      message: 'Une erreur inattendue s\'est produite',
    };
  }
};

/**
 * Récupère toutes les assignations d'un client
 * 
 * @param clientId - ID du client
 * @returns Liste des assignations du client
 */
export const getAssignmentsForClient = async (
  clientId: string
): Promise<ProgramAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('client_id', clientId)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des assignations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};

/**
 * Récupère toutes les assignations créées par un coach
 * 
 * @param coachId - ID du coach
 * @returns Liste des assignations du coach
 */
export const getAssignmentsForCoach = async (
  coachId: string
): Promise<ProgramAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des assignations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};

/**
 * Récupère les assignations actives d'un client
 * 
 * @param clientId - ID du client
 * @returns Liste des assignations actives
 */
export const getActiveAssignmentsForClient = async (
  clientId: string
): Promise<ProgramAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .order('start_date', { ascending: false});

    if (error) {
      console.error('Erreur lors de la récupération des assignations actives:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};

/**
 * Met à jour la progression d'une assignation
 * 
 * @param assignmentId - ID de l'assignation
 * @param currentWeek - Semaine actuelle
 * @param currentSessionOrder - Ordre de la séance actuelle
 * @returns true si succès, false sinon
 */
export const updateAssignmentProgress = async (
  assignmentId: string,
  currentWeek: number,
  currentSessionOrder: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .update({
        current_week: currentWeek,
        current_session_order: currentSessionOrder,
        updated_at: new Date().toISOString(),
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

/**
 * Met à jour le statut d'une assignation
 * 
 * @param assignmentId - ID de l'assignation
 * @param status - Nouveau statut
 * @returns true si succès, false sinon
 */
export const updateAssignmentStatus = async (
  assignmentId: string,
  status: ProgramAssignment['status']
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
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
 * Supprime une assignation (et toutes les données associées via CASCADE)
 * 
 * @param assignmentId - ID de l'assignation
 * @returns true si succès, false sinon
 */
export const deleteAssignment = async (assignmentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Erreur lors de la suppression de l\'assignation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale:', error);
    return false;
  }
};

/**
 * Récupère le résumé complet d'une assignation via la fonction RPC
 * 
 * @param assignmentId - ID de l'assignation
 * @returns Résumé de l'assignation avec statistiques
 */
export const getAssignmentSummary = async (assignmentId: string): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('get_assignment_summary', {
      p_assignment_id: assignmentId,
    });

    if (error) {
      console.error('Erreur lors de la récupération du résumé:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur globale:', error);
    return null;
  }
};

/**
 * Récupère le nombre d'assignations par programme template pour un coach
 * 
 * @param coachId - ID du coach
 * @returns Objet avec templateId comme clé et count comme valeur
 */
export const getAssignmentCountByTemplate = async (
  coachId: string
): Promise<Record<string, number>> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('program_template_id')
      .eq('coach_id', coachId)
      .in('status', ['active', 'upcoming']);

    if (error) {
      console.error('Erreur lors de la récupération des comptes:', error);
      return {};
    }

    // Compter les occurrences de chaque template
    const counts: Record<string, number> = {};
    data?.forEach((assignment) => {
      const templateId = assignment.program_template_id;
      counts[templateId] = (counts[templateId] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('Erreur globale:', error);
    return {};
  }
};

// Alias pour compatibilité avec l'ancien code
export const getCoachAssignments = getAssignmentsForCoach;
export const getClientAssignments = getAssignmentsForClient;
