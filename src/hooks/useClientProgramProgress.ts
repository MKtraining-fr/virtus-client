/**
 * Hook React pour utiliser la vue client_program_progress
 * 
 * Ce hook fournit la SOURCE DE VÉRITÉ UNIQUE pour la progression des clients.
 */

import { useState, useEffect } from 'react';
import {
  ClientProgramProgress,
  getClientProgramProgress,
  getAllClientsProgress,
  getClientProgress,
} from '../services/clientProgramProgressService';

/**
 * Hook pour récupérer la progression d'un assignment spécifique
 */
export const useAssignmentProgress = (assignmentId: string | null) => {
  const [progress, setProgress] = useState<ClientProgramProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!assignmentId) {
      setProgress(null);
      return;
    }

    const loadProgress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getClientProgramProgress(assignmentId);
        setProgress(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [assignmentId]);

  return { progress, isLoading, error };
};

/**
 * Hook pour récupérer la progression de tous les clients d'un coach
 */
export const useAllClientsProgress = (coachId: string | null) => {
  const [progressList, setProgressList] = useState<ClientProgramProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!coachId) {
      setProgressList([]);
      return;
    }

    const loadProgress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAllClientsProgress(coachId);
        setProgressList(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [coachId]);

  return { progressList, isLoading, error };
};

/**
 * Hook pour récupérer la progression d'un client spécifique
 */
export const useClientProgress = (clientId: string | null) => {
  const [progress, setProgress] = useState<ClientProgramProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clientId) {
      setProgress(null);
      return;
    }

    const loadProgress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getClientProgress(clientId);
        setProgress(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [clientId]);

  return { progress, isLoading, error, reload: () => loadProgress() };
};
