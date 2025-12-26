import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useDataStore } from '../stores/useDataStore';
import { PerformanceSet } from '../types';

interface WorkoutSession {
  id: string;
  name: string;
  exercises: Array<{
    id: number;
    exerciseId: number;
    name: string;
    sets: string;
    details?: Array<{
      load: { value: string; unit: string };
      reps: string;
      rest: string;
      tempo: string;
    }>;
  }>;
}

interface SessionCompletionResult {
  success: boolean;
  clientSessionId?: string;
  error?: string;
  message?: string;
}

/**
 * Hook custom pour gérer la complétion d'une séance de manière atomique
 * 
 * Utilise la fonction RPC `complete_client_session_atomic` qui garantit
 * que toutes les opérations (marquer séance complétée, sauvegarder performances)
 * sont exécutées dans une seule transaction atomique.
 * 
 * @param clientProgramId - ID du programme client
 */
export const useSessionCompletion = (
  clientProgramId: string | null
) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Prépare les données de performance au format attendu par la fonction RPC
   */
  const preparePerformanceData = (
    session: WorkoutSession,
    logData: Record<string, PerformanceSet[]>
  ) => {
    const exercises = session.exercises
      .map((exercise) => {
        const loggedSets = logData[exercise.id.toString()] || [];
        
        // Filtrer les séries vides
        const nonEmptySets = loggedSets.filter(
          (set) => set.reps.trim() || set.load.trim() || set.comment?.trim()
        );

        // Si aucune série n'est renseignée, ne pas inclure l'exercice
        if (nonEmptySets.length === 0) {
          return null;
        }

        return {
          exercise_id: exercise.exerciseId.toString(),
          sets: nonEmptySets.map((set) => ({
            reps: set.reps.trim() || null,
            load: set.load.trim() || null,
            comment: set.comment?.trim() || null,
          })),
        };
      })
      .filter((ex) => ex !== null);

    return {
      exercises,
    };
  };

  /**
   * Termine la séance de manière atomique
   * 
   * @param activeSession - Séance active à compléter
   * @param clientSessionId - ID de la client_session à terminer
   * @param logData - Données de performance saisies par le client
   * @returns Résultat de la complétion (succès + ID du log ou erreur)
   */
  const completeSession = async (
    activeSession: WorkoutSession,
    clientSessionId: string,
    logData: Record<string, PerformanceSet[]>
  ): Promise<SessionCompletionResult> => {
    if (!activeSession) {
      const errorMsg = 'Aucune séance active';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!clientSessionId) {
      const errorMsg = 'ID de séance manquant';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsCompleting(true);
    setError(null);

    try {
      // Préparer les données de performance
      const performanceData = preparePerformanceData(activeSession, logData);

      console.log('[useSessionCompletion] Appel de complete_client_session_atomic', {
        clientSessionId,
        exerciseCount: performanceData.exercises.length,
      });

      // Appeler la fonction RPC atomique
      const { data, error: rpcError } = await supabase.rpc(
        'complete_client_session_atomic',
        {
          p_client_session_id: clientSessionId,
          p_performance_data: performanceData,
        }
      );

      if (rpcError) {
        console.error('[useSessionCompletion] Erreur RPC:', rpcError);
        throw new Error(rpcError.message || 'Erreur lors de la complétion de la séance');
      }

      if (!data || !data.success) {
        console.error('[useSessionCompletion] Échec de la complétion:', data);
        throw new Error(data?.message || 'Erreur lors de la complétion de la séance');
      }

      console.log('[useSessionCompletion] Séance complétée avec succès:', data);

      // Invalider le cache et recharger les données
      if (clientProgramId) {
        console.log('[useSessionCompletion] Rechargement des données...');
        
        // Recharger les données du store
        const client = useDataStore.getState().clients.find(
          (c) => c.assignedProgram?.id === clientProgramId
        );
        
        if (client?.id) {
          await useDataStore.getState().loadData(client.id);
          
          // Envoyer une notification au coach
          if (client.coachId) {
            const { addNotification } = useDataStore.getState();
            await addNotification({
              userId: client.coachId,
              title: 'Séance complétée',
              message: `${client.firstName} ${client.lastName} a terminé sa séance : ${activeSession.name}`,
              type: 'workout',
              fromName: `${client.firstName} ${client.lastName}`,
              link: `/app/client/${client.id}`,
            });
          }
        }
      }

      return {
        success: true,
        clientSessionId: data.client_session_id,
        message: data.message,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('[useSessionCompletion] Erreur:', errorMessage);
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsCompleting(false);
    }
  };

  return {
    completeSession,
    isCompleting,
    error,
  };
};
