import { supabase } from './supabase';

export interface ClientMeasurement {
  id: string;
  client_id: string;
  recorded_at: string;
  weight?: number | null;
  neck?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  glutes?: number | null;
  thigh?: number | null;
  calf?: number | null;
  arm?: number | null;
  forearm?: number | null;
  shoulder?: number | null;
  body_fat?: number | null;
  muscle_mass?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeasurementInput {
  weight?: number | null;
  neck?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  glutes?: number | null;
  thigh?: number | null;
  calf?: number | null;
  arm?: number | null;
  forearm?: number | null;
  shoulder?: number | null;
  body_fat?: number | null;
  muscle_mass?: number | null;
  notes?: string | null;
}

export interface MeasurementSettings {
  id: string;
  client_id: string;
  coach_id: string;
  weight_visible: boolean;
  neck_visible: boolean;
  chest_visible: boolean;
  waist_visible: boolean;
  hips_visible: boolean;
  glutes_visible: boolean;
  thigh_visible: boolean;
  calf_visible: boolean;
  arm_visible: boolean;
  forearm_visible: boolean;
  shoulder_visible: boolean;
  body_fat_visible: boolean;
  muscle_mass_visible: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Récupère l'historique des mensurations d'un client
 */
export async function getClientMeasurements(clientId: string): Promise<ClientMeasurement[]> {
  const { data, error } = await supabase
    .from('client_measurements')
    .select('*')
    .eq('client_id', clientId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des mensurations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Crée une nouvelle entrée de mensuration pour un client
 */
export async function createClientMeasurement(
  clientId: string,
  measurement: MeasurementInput
): Promise<ClientMeasurement> {
  const { data, error } = await supabase
    .from('client_measurements')
    .insert({
      client_id: clientId,
      recorded_at: new Date().toISOString(),
      ...measurement,
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création de la mensuration:', error);
    throw error;
  }

  return data;
}

/**
 * Met à jour une entrée de mensuration existante
 */
export async function updateClientMeasurement(
  measurementId: string,
  measurement: Partial<MeasurementInput>
): Promise<ClientMeasurement> {
  const { data, error } = await supabase
    .from('client_measurements')
    .update({
      ...measurement,
      updated_at: new Date().toISOString(),
    })
    .eq('id', measurementId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour de la mensuration:', error);
    throw error;
  }

  return data;
}

/**
 * Supprime une entrée de mensuration
 */
export async function deleteClientMeasurement(measurementId: string): Promise<void> {
  const { error } = await supabase
    .from('client_measurements')
    .delete()
    .eq('id', measurementId);

  if (error) {
    console.error('Erreur lors de la suppression de la mensuration:', error);
    throw error;
  }
}

/**
 * Récupère les paramètres de visibilité des mensurations pour un client
 */
export async function getMeasurementSettings(clientId: string): Promise<MeasurementSettings | null> {
  const { data, error } = await supabase
    .from('client_measurement_settings')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Aucun paramètre trouvé, retourner null
      return null;
    }
    console.error('Erreur lors de la récupération des paramètres:', error);
    throw error;
  }

  return data;
}

/**
 * Crée ou met à jour les paramètres de visibilité des mensurations pour un client
 */
export async function upsertMeasurementSettings(
  clientId: string,
  coachId: string,
  settings: Partial<Omit<MeasurementSettings, 'id' | 'client_id' | 'coach_id' | 'created_at' | 'updated_at'>>
): Promise<MeasurementSettings> {
  const { data, error } = await supabase
    .from('client_measurement_settings')
    .upsert(
      {
        client_id: clientId,
        coach_id: coachId,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'client_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    throw error;
  }

  return data;
}

/**
 * Labels des mensurations en français
 */
export const measurementLabels: Record<keyof MeasurementInput, string> = {
  weight: 'Poids (kg)',
  neck: 'Tour de cou (cm)',
  chest: 'Tour de poitrine (cm)',
  waist: 'Tour de taille (cm)',
  hips: 'Tour de hanches (cm)',
  glutes: 'Tour de fessiers (cm)',
  thigh: 'Tour de cuisses (cm)',
  calf: 'Tour de mollets (cm)',
  arm: 'Tour de bras (cm)',
  forearm: 'Tour d\'avant-bras (cm)',
  shoulder: 'Tour d\'épaules (cm)',
  body_fat: 'Masse grasse (%)',
  muscle_mass: 'Masse musculaire (kg)',
  notes: 'Notes',
};

/**
 * Retourne les paramètres par défaut (tous les champs visibles)
 */
export function getDefaultMeasurementSettings(): Omit<MeasurementSettings, 'id' | 'client_id' | 'coach_id' | 'created_at' | 'updated_at'> {
  return {
    weight_visible: true,
    neck_visible: true,
    chest_visible: true,
    waist_visible: true,
    hips_visible: true,
    glutes_visible: true,
    thigh_visible: true,
    calf_visible: true,
    arm_visible: true,
    forearm_visible: true,
    shoulder_visible: true,
    body_fat_visible: true,
    muscle_mass_visible: true,
  };
}
