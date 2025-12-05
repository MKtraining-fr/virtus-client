import { supabase } from './supabase';

/**
 * Interface pour le feedback de séance
 */
export interface SessionFeedback {
  id?: string;
  clientId: string;
  sessionId: string;
  performanceLogId?: string;
  
  // Réponses aux questions (0-10)
  preFatigue: number;
  sleepQuality: number;
  perceivedDifficulty: number;
  enjoyment: number;
  
  // Commentaire optionnel
  comment?: string;
  
  // Métadonnées
  submittedAt?: string;
  createdAt?: string;
}

/**
 * Sauvegarde le feedback d'une séance dans Supabase
 * 
 * @param feedback - Données du feedback à sauvegarder
 * @returns ID du feedback créé ou null en cas d'erreur
 */
export async function saveSessionFeedback(
  feedback: SessionFeedback
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('session_feedback')
      .insert({
        client_id: feedback.clientId,
        session_id: feedback.sessionId,
        performance_log_id: feedback.performanceLogId || null,
        pre_fatigue: feedback.preFatigue,
        sleep_quality: feedback.sleepQuality,
        perceived_difficulty: feedback.perceivedDifficulty,
        enjoyment: feedback.enjoyment,
        comment: feedback.comment || null,
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erreur lors de la sauvegarde du feedback:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Erreur globale lors de la sauvegarde du feedback:', error);
    return null;
  }
}

/**
 * Récupère les feedbacks d'un client pour une séance donnée
 * 
 * @param clientId - ID du client
 * @param sessionId - ID de la séance
 * @returns Liste des feedbacks ou tableau vide
 */
export async function getSessionFeedbacks(
  clientId: string,
  sessionId: string
): Promise<SessionFeedback[]> {
  try {
    const { data, error } = await supabase
      .from('session_feedback')
      .select('*')
      .eq('client_id', clientId)
      .eq('session_id', sessionId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des feedbacks:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      clientId: row.client_id,
      sessionId: row.session_id,
      performanceLogId: row.performance_log_id,
      preFatigue: row.pre_fatigue,
      sleepQuality: row.sleep_quality,
      perceivedDifficulty: row.perceived_difficulty,
      enjoyment: row.enjoyment,
      comment: row.comment,
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Erreur globale lors de la récupération des feedbacks:', error);
    return [];
  }
}

/**
 * Récupère tous les feedbacks d'un client
 * 
 * @param clientId - ID du client
 * @param limit - Nombre maximum de feedbacks à récupérer (optionnel)
 * @returns Liste des feedbacks ou tableau vide
 */
export async function getClientFeedbacks(
  clientId: string,
  limit?: number
): Promise<SessionFeedback[]> {
  try {
    let query = supabase
      .from('session_feedback')
      .select('*')
      .eq('client_id', clientId)
      .order('submitted_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des feedbacks du client:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      clientId: row.client_id,
      sessionId: row.session_id,
      performanceLogId: row.performance_log_id,
      preFatigue: row.pre_fatigue,
      sleepQuality: row.sleep_quality,
      perceivedDifficulty: row.perceived_difficulty,
      enjoyment: row.enjoyment,
      comment: row.comment,
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Erreur globale lors de la récupération des feedbacks du client:', error);
    return [];
  }
}

/**
 * Calcule les moyennes des feedbacks pour un client
 * 
 * @param clientId - ID du client
 * @param limit - Nombre de feedbacks à considérer (optionnel, par défaut tous)
 * @returns Objet avec les moyennes calculées
 */
export async function calculateFeedbackAverages(
  clientId: string,
  limit?: number
): Promise<{
  averagePreFatigue: number;
  averageSleepQuality: number;
  averagePerceivedDifficulty: number;
  averageEnjoyment: number;
  totalFeedbacks: number;
} | null> {
  try {
    const feedbacks = await getClientFeedbacks(clientId, limit);
    
    if (feedbacks.length === 0) {
      return null;
    }
    
    const totals = feedbacks.reduce(
      (acc, feedback) => ({
        preFatigue: acc.preFatigue + feedback.preFatigue,
        sleepQuality: acc.sleepQuality + feedback.sleepQuality,
        perceivedDifficulty: acc.perceivedDifficulty + feedback.perceivedDifficulty,
        enjoyment: acc.enjoyment + feedback.enjoyment,
      }),
      { preFatigue: 0, sleepQuality: 0, perceivedDifficulty: 0, enjoyment: 0 }
    );
    
    const count = feedbacks.length;
    
    return {
      averagePreFatigue: Math.round((totals.preFatigue / count) * 10) / 10,
      averageSleepQuality: Math.round((totals.sleepQuality / count) * 10) / 10,
      averagePerceivedDifficulty: Math.round((totals.perceivedDifficulty / count) * 10) / 10,
      averageEnjoyment: Math.round((totals.enjoyment / count) * 10) / 10,
      totalFeedbacks: count,
    };
  } catch (error) {
    console.error('Erreur lors du calcul des moyennes de feedback:', error);
    return null;
  }
}
