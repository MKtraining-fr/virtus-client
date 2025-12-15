/**
 * Service pour la gestion des assignations de bilans
 * Gère l'assignation, la complétion, et la validation des bilans
 * 
 * Version: 1.0
 * Date: 2025-12-14
 */

import { supabase } from './supabase';

export interface BilanAssignment {
  id: string;
  coach_id: string;
  client_id: string;
  bilan_template_id: string;
  status: 'assigned' | 'completed' | 'archived';
  frequency: 'once' | 'weekly' | 'biweekly' | 'monthly';
  scheduled_date: string;
  assigned_at: string;
  completed_at?: string;
  parent_assignment_id?: string;
  data: {
    template_snapshot: any;
    template_name: string;
    answers: any;
  };
}

export interface AssignBilanParams {
  templateId: string;
  clientId: string;
  coachId: string;
  frequency?: 'once' | 'weekly' | 'biweekly' | 'monthly';
  scheduledDate?: string; // Format YYYY-MM-DD
}

export interface AssignBilanResult {
  success: boolean;
  assignment_id?: string;
  message?: string;
  error?: string;
}

export interface CompleteBilanParams {
  assignmentId: string;
  answers: any;
}

export interface CompleteBilanResult {
  success: boolean;
  message?: string;
  new_assignment_id?: string;
  new_scheduled_date?: string;
  error?: string;
}

export interface ValidateInitialBilanParams {
  assignmentId: string;
  coachId: string;
}

export interface ValidateInitialBilanResult {
  success: boolean;
  message?: string;
  client_id?: string;
  error?: string;
}

/**
 * Assigne un bilan à un client
 * Utilise la fonction RPC assign_bilan_atomic pour garantir l'atomicité
 * 
 * @param params - Paramètres d'assignation (templateId, clientId, coachId, frequency, scheduledDate)
 * @returns Résultat de l'assignation avec l'ID créé
 */
export const assignBilanToClient = async (
  params: AssignBilanParams
): Promise<AssignBilanResult> => {
  try {
    console.log('Appel RPC assign_bilan_atomic avec params:', {
      p_template_id: params.templateId,
      p_client_id: params.clientId,
      p_coach_id: params.coachId,
      p_frequency: params.frequency || 'once',
      p_scheduled_date: params.scheduledDate || new Date().toISOString().split('T')[0],
    });

    const { data, error } = await supabase.rpc('assign_bilan_atomic', {
      p_template_id: params.templateId,
      p_client_id: params.clientId,
      p_coach_id: params.coachId,
      p_frequency: params.frequency || 'once',
      p_scheduled_date: params.scheduledDate || new Date().toISOString().split('T')[0],
    });

    console.log('Résultat RPC assign_bilan_atomic:', { data, error });

    if (error) {
      console.error('Erreur lors de l\'assignation du bilan:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erreur lors de l\'assignation du bilan',
      };
    }

    if (!data || !data.success) {
      console.error('La fonction RPC a retourné success=false:', data);
      return {
        success: false,
        error: data?.error || data?.message || 'Erreur inconnue',
        message: data?.message || 'Erreur lors de l\'assignation du bilan',
      };
    }

    return data as AssignBilanResult;
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
 * Marque un bilan comme complété et enregistre les réponses
 * Si le bilan est récurrent, crée automatiquement la prochaine assignation
 * 
 * @param params - Paramètres de complétion (assignmentId, answers)
 * @returns Résultat de la complétion
 */
export const completeBilan = async (
  params: CompleteBilanParams
): Promise<CompleteBilanResult> => {
  try {
    console.log('[completeBilan] Appel RPC avec params:', {
      assignmentId: params.assignmentId,
      answersCount: Object.keys(params.answers).length,
      answers: params.answers,
    });

    const { data, error } = await supabase.rpc('complete_bilan_atomic', {
      p_assignment_id: params.assignmentId,
      p_answers: params.answers,
    });

    if (error) {
      console.error('[completeBilan] Erreur RPC:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return {
        success: false,
        error: error.message,
        message: 'Erreur lors de la complétion du bilan',
      };
    }

    console.log('[completeBilan] Succès RPC:', data);
    return data as CompleteBilanResult;
  } catch (error) {
    console.error('[completeBilan] Erreur globale:', error);
    return {
      success: false,
      error: String(error),
      message: 'Une erreur inattendue s\'est produite',
    };
  }
};

/**
 * Valide un bilan initial et convertit le prospect en client actif
 * Extrait les données du bilan et met à jour le profil client
 * 
 * @param params - Paramètres de validation (assignmentId, coachId)
 * @returns Résultat de la validation
 */
export const validateInitialBilan = async (
  params: ValidateInitialBilanParams
): Promise<ValidateInitialBilanResult> => {
  try {
    const { data, error } = await supabase.rpc('validate_initial_bilan', {
      p_assignment_id: params.assignmentId,
      p_coach_id: params.coachId,
    });

    if (error) {
      console.error('Erreur lors de la validation du bilan initial:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erreur lors de la validation du bilan initial',
      };
    }

    return data as ValidateInitialBilanResult;
  } catch (error) {
    console.error('Erreur globale lors de la validation:', error);
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
export const getBilanAssignmentsForClient = async (
  clientId: string
): Promise<BilanAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('bilan_assignments')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: false });

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
export const getBilanAssignmentsForCoach = async (
  coachId: string
): Promise<BilanAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('bilan_assignments')
      .select('*')
      .eq('coach_id', coachId)
      .order('assigned_at', { ascending: false });

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
 * @returns Liste des assignations actives (statut 'assigned')
 */
export const getActiveBilanAssignmentsForClient = async (
  clientId: string
): Promise<BilanAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('bilan_assignments')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'assigned')
      .order('scheduled_date', { ascending: true });

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
 * Récupère les assignations complétées d'un client
 * 
 * @param clientId - ID du client
 * @returns Liste des assignations complétées (statut 'completed')
 */
export const getCompletedBilanAssignmentsForClient = async (
  clientId: string
): Promise<BilanAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('bilan_assignments')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des assignations complétées:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};

/**
 * Archive une assignation de bilan
 * Utilisé pour arrêter la récurrence ou archiver un bilan initial non retenu
 * 
 * @param assignmentId - ID de l'assignation à archiver
 * @returns Résultat de l'archivage
 */
export const archiveBilanAssignment = async (
  assignmentId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('bilan_assignments')
      .update({ status: 'archived' })
      .eq('id', assignmentId);

    if (error) {
      console.error('Erreur lors de l\'archivage de l\'assignation:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Erreur globale lors de l\'archivage:', error);
    return {
      success: false,
      error: String(error),
    };
  }
};
