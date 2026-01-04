/**
 * Service pour la gestion des blessures, douleurs chroniques, opérations et limitations
 * 
 * Ce service permet aux coachs et aux clients de :
 * - Créer, lire, modifier et supprimer des blessures
 * - Récupérer l'historique des blessures d'un client
 * - Filtrer par type, statut ou zone corporelle
 */

import { supabase } from './supabase';

// Types pour les blessures
export type InjuryType = 'injury' | 'chronic_pain' | 'surgery' | 'limitation';
export type InjurySeverity = 'mild' | 'moderate' | 'severe';
export type InjuryStatus = 'active' | 'recovering' | 'healed' | 'chronic';

export interface ClientInjury {
  id: string;
  client_id: string;
  body_part: string;
  body_part_name_fr?: string;
  muscle_group?: string;
  type: InjuryType;
  description: string;
  notes?: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  since?: string;
  healed_at?: string;
  created_by?: string;
  created_by_role?: 'coach' | 'client';
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface CreateInjuryData {
  client_id: string;
  body_part: string;
  body_part_name_fr?: string;
  muscle_group?: string;
  type: InjuryType;
  description: string;
  notes?: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  since?: string;
  created_by: string;
  created_by_role: 'coach' | 'client';
}

export interface UpdateInjuryData {
  body_part?: string;
  body_part_name_fr?: string;
  muscle_group?: string;
  type?: InjuryType;
  description?: string;
  notes?: string;
  severity?: InjurySeverity;
  status?: InjuryStatus;
  since?: string;
  healed_at?: string;
  updated_by: string;
}

/**
 * Récupère toutes les blessures d'un client
 */
export async function getClientInjuries(clientId: string): Promise<ClientInjury[]> {
  const { data, error } = await supabase
    .from('client_injuries')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des blessures:', error);
    throw error;
  }

  return data || [];
}

/**
 * Récupère les blessures actives d'un client (non guéries)
 */
export async function getActiveInjuries(clientId: string): Promise<ClientInjury[]> {
  const { data, error } = await supabase
    .from('client_injuries')
    .select('*')
    .eq('client_id', clientId)
    .in('status', ['active', 'recovering', 'chronic'])
    .order('severity', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des blessures actives:', error);
    throw error;
  }

  return data || [];
}

/**
 * Récupère une blessure par son ID
 */
export async function getInjuryById(injuryId: string): Promise<ClientInjury | null> {
  const { data, error } = await supabase
    .from('client_injuries')
    .select('*')
    .eq('id', injuryId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Pas trouvé
    }
    console.error('Erreur lors de la récupération de la blessure:', error);
    throw error;
  }

  return data;
}

/**
 * Crée une nouvelle blessure
 */
export async function createInjury(injuryData: CreateInjuryData): Promise<ClientInjury> {
  const { data, error } = await supabase
    .from('client_injuries')
    .insert([injuryData])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création de la blessure:', error);
    throw error;
  }

  return data;
}

/**
 * Crée plusieurs blessures en une seule opération
 */
export async function createMultipleInjuries(injuries: CreateInjuryData[]): Promise<ClientInjury[]> {
  if (injuries.length === 0) return [];

  const { data, error } = await supabase
    .from('client_injuries')
    .insert(injuries)
    .select();

  if (error) {
    console.error('Erreur lors de la création des blessures:', error);
    throw error;
  }

  return data || [];
}

/**
 * Met à jour une blessure existante
 */
export async function updateInjury(injuryId: string, updateData: UpdateInjuryData): Promise<ClientInjury> {
  const { data, error } = await supabase
    .from('client_injuries')
    .update(updateData)
    .eq('id', injuryId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour de la blessure:', error);
    throw error;
  }

  return data;
}

/**
 * Supprime une blessure
 */
export async function deleteInjury(injuryId: string): Promise<void> {
  const { error } = await supabase
    .from('client_injuries')
    .delete()
    .eq('id', injuryId);

  if (error) {
    console.error('Erreur lors de la suppression de la blessure:', error);
    throw error;
  }
}

/**
 * Supprime toutes les blessures d'un client (utilisé lors de la réinitialisation)
 */
export async function deleteAllClientInjuries(clientId: string): Promise<void> {
  const { error } = await supabase
    .from('client_injuries')
    .delete()
    .eq('client_id', clientId);

  if (error) {
    console.error('Erreur lors de la suppression des blessures du client:', error);
    throw error;
  }
}

/**
 * Marque une blessure comme guérie
 */
export async function markInjuryAsHealed(injuryId: string, updatedBy: string): Promise<ClientInjury> {
  return updateInjury(injuryId, {
    status: 'healed',
    healed_at: new Date().toISOString().split('T')[0],
    updated_by: updatedBy,
  });
}

/**
 * Récupère les blessures par zone corporelle
 */
export async function getInjuriesByBodyPart(clientId: string, bodyPart: string): Promise<ClientInjury[]> {
  const { data, error } = await supabase
    .from('client_injuries')
    .select('*')
    .eq('client_id', clientId)
    .eq('body_part', bodyPart)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des blessures par zone:', error);
    throw error;
  }

  return data || [];
}

/**
 * Récupère les blessures par type
 */
export async function getInjuriesByType(clientId: string, type: InjuryType): Promise<ClientInjury[]> {
  const { data, error } = await supabase
    .from('client_injuries')
    .select('*')
    .eq('client_id', clientId)
    .eq('type', type)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des blessures par type:', error);
    throw error;
  }

  return data || [];
}

/**
 * Synchronise les blessures locales avec la base de données
 * Utilisé lors de la sauvegarde du bilan initial
 */
export async function syncInjuries(
  clientId: string,
  localInjuries: Array<{
    id?: string;
    bodyPart: string;
    bodyPartNameFr?: string;
    muscleGroup?: string;
    type: InjuryType;
    description: string;
    notes?: string;
    severity: InjurySeverity;
    status: InjuryStatus;
    since?: string;
  }>,
  createdBy: string,
  createdByRole: 'coach' | 'client'
): Promise<ClientInjury[]> {
  // Récupérer les blessures existantes
  const existingInjuries = await getClientInjuries(clientId);
  const existingIds = new Set(existingInjuries.map(i => i.id));
  const localIds = new Set(localInjuries.filter(i => i.id).map(i => i.id));

  // Blessures à supprimer (présentes en BDD mais pas en local)
  const toDelete = existingInjuries.filter(i => !localIds.has(i.id));
  
  // Blessures à créer (pas d'ID ou ID non existant en BDD)
  const toCreate = localInjuries.filter(i => !i.id || !existingIds.has(i.id));

  // Supprimer les blessures retirées
  for (const injury of toDelete) {
    await deleteInjury(injury.id);
  }

  // Créer les nouvelles blessures
  const createData: CreateInjuryData[] = toCreate.map(injury => ({
    client_id: clientId,
    body_part: injury.bodyPart,
    body_part_name_fr: injury.bodyPartNameFr,
    muscle_group: injury.muscleGroup,
    type: injury.type,
    description: injury.description,
    notes: injury.notes,
    severity: injury.severity,
    status: injury.status,
    since: injury.since,
    created_by: createdBy,
    created_by_role: createdByRole,
  }));

  const createdInjuries = await createMultipleInjuries(createData);

  // Retourner toutes les blessures actuelles
  return getClientInjuries(clientId);
}

// Labels français pour l'affichage
export const INJURY_TYPE_LABELS: Record<InjuryType, string> = {
  injury: 'Blessure',
  chronic_pain: 'Douleur chronique',
  surgery: 'Chirurgie/Opération',
  limitation: 'Limitation fonctionnelle',
};

export const INJURY_SEVERITY_LABELS: Record<InjurySeverity, string> = {
  mild: 'Légère',
  moderate: 'Modérée',
  severe: 'Sévère',
};

export const INJURY_STATUS_LABELS: Record<InjuryStatus, string> = {
  active: 'Active',
  recovering: 'En récupération',
  healed: 'Guérie',
  chronic: 'Chronique',
};

export const INJURY_SEVERITY_COLORS: Record<InjurySeverity, string> = {
  mild: '#FCD34D', // Jaune
  moderate: '#FB923C', // Orange
  severe: '#EF4444', // Rouge
};
