/**
 * Service pour la gestion des templates de bilans
 * Gère la création, modification, suppression et duplication des templates
 * 
 * Version: 1.0
 * Date: 2025-12-14
 */

import { supabase } from './supabase';
import { BilanTemplate, BilanSection } from '../types';

export interface CreateBilanTemplateParams {
  name: string;
  sections: BilanSection[];
  coachId: string;
}

export interface UpdateBilanTemplateParams {
  id: string;
  name: string;
  sections: BilanSection[];
}

export interface BilanTemplateResult {
  success: boolean;
  template?: BilanTemplate;
  error?: string;
}

/**
 * Crée un nouveau template de bilan
 * @param params - Paramètres du template (nom, sections, coachId)
 * @returns Résultat avec le template créé
 */
export const createBilanTemplate = async (
  params: CreateBilanTemplateParams
): Promise<BilanTemplateResult> => {
  try {
    const { data, error } = await supabase
      .from('bilan_templates')
      .insert({
        name: params.name,
        coach_id: params.coachId,
        sections: params.sections,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du template:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      template: {
        id: data.id,
        name: data.name,
        coachId: data.coach_id,
        sections: data.sections,
      },
    };
  } catch (error) {
    console.error('Erreur globale lors de la création du template:', error);
    return {
      success: false,
      error: String(error),
    };
  }
};

/**
 * Met à jour un template de bilan existant
 * @param params - Paramètres de mise à jour (id, nom, sections)
 * @returns Résultat avec le template mis à jour
 */
export const updateBilanTemplate = async (
  params: UpdateBilanTemplateParams
): Promise<BilanTemplateResult> => {
  try {
    const { data, error } = await supabase
      .from('bilan_templates')
      .update({
        name: params.name,
        sections: params.sections,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du template:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      template: {
        id: data.id,
        name: data.name,
        coachId: data.coach_id,
        sections: data.sections,
      },
    };
  } catch (error) {
    console.error('Erreur globale lors de la mise à jour du template:', error);
    return {
      success: false,
      error: String(error),
    };
  }
};

/**
 * Supprime un template de bilan
 * Note: La suppression échouera si le template a des assignations actives (contrainte FK)
 * @param templateId - ID du template à supprimer
 * @returns Résultat de la suppression
 */
export const deleteBilanTemplate = async (
  templateId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('bilan_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Erreur lors de la suppression du template:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Erreur globale lors de la suppression du template:', error);
    return {
      success: false,
      error: String(error),
    };
  }
};

/**
 * Duplique un template de bilan existant
 * @param templateId - ID du template à dupliquer
 * @param newName - Nom du nouveau template
 * @param coachId - ID du coach créateur
 * @returns Résultat avec le template dupliqué
 */
export const duplicateBilanTemplate = async (
  templateId: string,
  newName: string,
  coachId: string
): Promise<BilanTemplateResult> => {
  try {
    // Récupérer le template source
    const { data: sourceTemplate, error: fetchError } = await supabase
      .from('bilan_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !sourceTemplate) {
      console.error('Erreur lors de la récupération du template source:', fetchError);
      return {
        success: false,
        error: fetchError?.message || 'Template not found',
      };
    }

    // Créer le nouveau template avec les sections du template source
    const { data, error } = await supabase
      .from('bilan_templates')
      .insert({
        name: newName,
        coach_id: coachId,
        sections: sourceTemplate.sections,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la duplication du template:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      template: {
        id: data.id,
        name: data.name,
        coachId: data.coach_id,
        sections: data.sections,
      },
    };
  } catch (error) {
    console.error('Erreur globale lors de la duplication du template:', error);
    return {
      success: false,
      error: String(error),
    };
  }
};

/**
 * Récupère tous les templates de bilans pour un coach
 * Inclut les templates système (coach_id = null) et les templates du coach
 * @param coachId - ID du coach
 * @returns Liste des templates
 */
export const getBilanTemplatesForCoach = async (
  coachId: string
): Promise<BilanTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('bilan_templates')
      .select('*')
      .or(`coach_id.is.null,coach_id.eq.${coachId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des templates:', error);
      return [];
    }

    return data.map((template) => ({
      id: template.id,
      name: template.name,
      coachId: template.coach_id || 'system',
      sections: template.sections,
    }));
  } catch (error) {
    console.error('Erreur globale lors de la récupération des templates:', error);
    return [];
  }
};

/**
 * Vérifie si un template a des assignations actives
 * Utilisé pour empêcher la suppression d'un template en cours d'utilisation
 * @param templateId - ID du template
 * @returns true si le template a des assignations actives
 */
export const checkTemplateHasAssignments = async (
  templateId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_template_has_assignments', {
      p_template_id: templateId,
    });

    if (error) {
      console.error('Erreur lors de la vérification des assignations:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Erreur globale lors de la vérification des assignations:', error);
    return false;
  }
};
