import { supabase } from './supabase';
import { calculateOneRM } from '../utils/loadCalculations';

/**
 * Interface pour un enregistrement de performance
 */
export interface ExerciseRecord {
  id: string;
  client_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  sets: number;
  rir: number | null;
  one_rm_calculated: number;
  source: string;
  session_id: string | null;
  notes: string | null;
  recorded_at: string;
  created_at: string;
}

/**
 * Récupère le 1RM le plus récent d'un client pour un exercice spécifique
 * @param clientId - ID du client
 * @param exerciseId - ID de l'exercice
 * @returns Le 1RM calculé ou null si aucune donnée
 */
export const getLatestOneRM = async (
  clientId: string,
  exerciseId: string
): Promise<number | null> => {
  try {
    // Récupérer le dernier enregistrement pour cet exercice
    const { data, error } = await supabase
      .from('client_exercise_records')
      .select('*')
      .eq('client_id', clientId)
      .eq('exercise_id', exerciseId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log(`[PerformanceService] No record found for client ${clientId}, exercise ${exerciseId}`);
      return null;
    }

    // Si le 1RM est déjà calculé, l'utiliser
    if (data.one_rm_calculated) {
      return data.one_rm_calculated;
    }

    // Sinon, le calculer à partir du poids et des reps
    if (data.weight && data.reps) {
      return calculateOneRM(data.weight, data.reps);
    }

    return null;
  } catch (error) {
    console.error('[PerformanceService] Error fetching latest 1RM:', error);
    return null;
  }
};

/**
 * Récupère les 1RM pour plusieurs exercices d'un client
 * @param clientId - ID du client
 * @param exerciseIds - Liste des IDs d'exercices
 * @returns Map exerciseId → 1RM
 */
export const getMultipleOneRMs = async (
  clientId: string,
  exerciseIds: string[]
): Promise<Map<string, number>> => {
  const oneRMMap = new Map<string, number>();

  try {
    // Récupérer tous les enregistrements pour ces exercices
    const { data, error } = await supabase
      .from('client_exercise_records')
      .select('*')
      .eq('client_id', clientId)
      .in('exercise_id', exerciseIds)
      .order('recorded_at', { ascending: false });

    if (error || !data) {
      console.log(`[PerformanceService] No records found for client ${clientId}`);
      return oneRMMap;
    }

    // Pour chaque exercice, garder le plus récent
    const latestRecords = new Map<string, ExerciseRecord>();
    
    for (const record of data) {
      const exerciseId = record.exercise_id;
      const existing = latestRecords.get(exerciseId);
      
      if (!existing || new Date(record.recorded_at) > new Date(existing.recorded_at)) {
        latestRecords.set(exerciseId, record as ExerciseRecord);
      }
    }

    // Calculer le 1RM pour chaque exercice
    for (const [exerciseId, record] of latestRecords.entries()) {
      let oneRM: number | null = null;

      if (record.one_rm_calculated) {
        oneRM = record.one_rm_calculated;
      } else if (record.weight && record.reps) {
        oneRM = calculateOneRM(record.weight, record.reps);
      }

      if (oneRM) {
        oneRMMap.set(exerciseId, oneRM);
      }
    }

    return oneRMMap;
  } catch (error) {
    console.error('[PerformanceService] Error fetching multiple 1RMs:', error);
    return oneRMMap;
  }
};
