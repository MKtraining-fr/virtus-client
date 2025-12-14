/**
 * Hook React pour la gestion des templates de bilans
 * Fournit les fonctions CRUD et le state local des templates
 * 
 * Version: 1.0
 * Date: 2025-12-14
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getBilanTemplatesForCoach,
  createBilanTemplate,
  updateBilanTemplate,
  deleteBilanTemplate,
  duplicateBilanTemplate,
  checkTemplateHasAssignments,
  CreateBilanTemplateParams,
  UpdateBilanTemplateParams,
} from '../services/bilanTemplateService';
import { BilanTemplate } from '../types';

export const useBilanTemplates = (coachId: string | undefined) => {
  const [templates, setTemplates] = useState<BilanTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge les templates depuis Supabase
   */
  const loadTemplates = useCallback(async () => {
    if (!coachId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getBilanTemplatesForCoach(coachId);
      setTemplates(data);
    } catch (err) {
      console.error('Erreur lors du chargement des templates:', err);
      setError('Impossible de charger les templates');
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  /**
   * Charge les templates au montage du composant
   */
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  /**
   * Crée un nouveau template
   */
  const create = useCallback(
    async (params: CreateBilanTemplateParams): Promise<boolean> => {
      if (!coachId) return false;

      const result = await createBilanTemplate(params);

      if (result.success && result.template) {
        setTemplates((prev) => [result.template!, ...prev]);
        return true;
      } else {
        setError(result.error || 'Erreur lors de la création du template');
        return false;
      }
    },
    [coachId]
  );

  /**
   * Met à jour un template existant
   */
  const update = useCallback(
    async (params: UpdateBilanTemplateParams): Promise<boolean> => {
      const result = await updateBilanTemplate(params);

      if (result.success && result.template) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === params.id ? result.template! : t))
        );
        return true;
      } else {
        setError(result.error || 'Erreur lors de la mise à jour du template');
        return false;
      }
    },
    []
  );

  /**
   * Supprime un template
   * Note: La suppression est permise même si le template a des assignations actives
   * Les assignations existantes conservent un snapshot du template
   */
  const remove = useCallback(async (templateId: string): Promise<boolean> => {
    const result = await deleteBilanTemplate(templateId);

    if (result.success) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      return true;
    } else {
      setError(result.error || 'Erreur lors de la suppression du template');
      return false;
    }
  }, []);

  /**
   * Duplique un template existant
   */
  const duplicate = useCallback(
    async (templateId: string, newName: string): Promise<boolean> => {
      if (!coachId) return false;

      const result = await duplicateBilanTemplate(templateId, newName, coachId);

      if (result.success && result.template) {
        setTemplates((prev) => [result.template!, ...prev]);
        return true;
      } else {
        setError(result.error || 'Erreur lors de la duplication du template');
        return false;
      }
    },
    [coachId]
  );

  /**
   * Réinitialise l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    templates,
    loading,
    error,
    create,
    update,
    remove,
    duplicate,
    reload: loadTemplates,
    clearError,
  };
};
