/**
 * Hook React pour la gestion des assignations de bilans
 * Fournit les fonctions d'assignation, complétion, validation et le state local
 * 
 * Version: 1.0
 * Date: 2025-12-14
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getBilanAssignmentsForClient,
  getBilanAssignmentsForCoach,
  getActiveBilanAssignmentsForClient,
  getCompletedBilanAssignmentsForClient,
  assignBilanToClient,
  completeBilan,
  validateInitialBilan,
  archiveBilanAssignment,
  BilanAssignment,
  AssignBilanParams,
  CompleteBilanParams,
  ValidateInitialBilanParams,
} from '../services/bilanAssignmentService';

export const useBilanAssignments = (
  userId: string | undefined,
  userRole: 'coach' | 'client' | undefined
) => {
  const [assignments, setAssignments] = useState<BilanAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge les assignations depuis Supabase
   */
  const loadAssignments = useCallback(async () => {
    if (!userId || !userRole) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let data: BilanAssignment[] = [];

      if (userRole === 'coach') {
        data = await getBilanAssignmentsForCoach(userId);
      } else if (userRole === 'client') {
        data = await getBilanAssignmentsForClient(userId);
      }

      setAssignments(data);
    } catch (err) {
      console.error('Erreur lors du chargement des assignations:', err);
      setError('Impossible de charger les assignations');
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  /**
   * Charge les assignations au montage du composant
   */
  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  /**
   * Assigne un bilan à un client
   */
  const assign = useCallback(
    async (params: AssignBilanParams): Promise<boolean> => {
      const result = await assignBilanToClient(params);

      if (result.success) {
        // Recharger les assignations après l'assignation
        await loadAssignments();
        return true;
      } else {
        setError(result.error || 'Erreur lors de l\'assignation du bilan');
        return false;
      }
    },
    [loadAssignments]
  );

  /**
   * Marque un bilan comme complété
   */
  const complete = useCallback(
    async (params: CompleteBilanParams): Promise<boolean> => {
      const result = await completeBilan(params);

      if (result.success) {
        // Recharger les assignations après la complétion
        await loadAssignments();
        return true;
      } else {
        setError(result.error || 'Erreur lors de la complétion du bilan');
        return false;
      }
    },
    [loadAssignments]
  );

  /**
   * Valide un bilan initial et convertit le prospect en client
   */
  const validate = useCallback(
    async (params: ValidateInitialBilanParams): Promise<boolean> => {
      const result = await validateInitialBilan(params);

      if (result.success) {
        // Recharger les assignations après la validation
        await loadAssignments();
        return true;
      } else {
        setError(result.error || 'Erreur lors de la validation du bilan');
        return false;
      }
    },
    [loadAssignments]
  );

  /**
   * Archive une assignation
   */
  const archive = useCallback(
    async (assignmentId: string): Promise<boolean> => {
      const result = await archiveBilanAssignment(assignmentId);

      if (result.success) {
        // Recharger les assignations après l'archivage
        await loadAssignments();
        return true;
      } else {
        setError(result.error || 'Erreur lors de l\'archivage du bilan');
        return false;
      }
    },
    [loadAssignments]
  );

  /**
   * Récupère les assignations actives d'un client
   */
  const getActiveAssignments = useCallback(async (clientId: string) => {
    return await getActiveBilanAssignmentsForClient(clientId);
  }, []);

  /**
   * Récupère les assignations complétées d'un client
   */
  const getCompletedAssignments = useCallback(async (clientId: string) => {
    return await getCompletedBilanAssignmentsForClient(clientId);
  }, []);

  /**
   * Réinitialise l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    assignments,
    loading,
    error,
    assign,
    complete,
    validate,
    archive,
    getActiveAssignments,
    getCompletedAssignments,
    reload: loadAssignments,
    clearError,
  };
};
