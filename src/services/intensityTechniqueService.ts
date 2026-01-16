import { supabase } from '../lib/supabase';
import type {
  IntensityTechnique,
  CreateIntensityTechniqueInput,
  UpdateIntensityTechniqueInput,
} from '../types/intensityTechnique';

/**
 * Récupérer toutes les techniques d'intensification accessibles par un coach
 * (techniques système publiques + techniques créées par le coach)
 */
export async function getAllTechniques(coachId: string): Promise<IntensityTechnique[]> {
  const { data, error } = await supabase
    .from('intensification_techniques')
    .select('*')
    .or(`is_public.eq.true,created_by.eq.${coachId}`)
    .eq('is_archived', false)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des techniques:', error);
    throw error;
  }

  return data || [];
}

/**
 * Récupérer toutes les techniques système (publiques)
 */
export async function getSystemTechniques(): Promise<IntensityTechnique[]> {
  const { data, error } = await supabase
    .from('intensification_techniques')
    .select('*')
    .eq('is_public', true)
    .eq('is_archived', false)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des techniques système:', error);
    throw error;
  }

  return data || [];
}

/**
 * Récupérer les techniques personnalisées d'un coach
 */
export async function getCoachTechniques(coachId: string): Promise<IntensityTechnique[]> {
  const { data, error } = await supabase
    .from('intensification_techniques')
    .select('*')
    .eq('created_by', coachId)
    .eq('is_archived', false)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des techniques du coach:', error);
    throw error;
  }

  return data || [];
}

/**
 * Récupérer une technique par son ID
 */
export async function getTechniqueById(id: string): Promise<IntensityTechnique | null> {
  const { data, error } = await supabase
    .from('intensification_techniques')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération de la technique:', error);
    throw error;
  }

  return data;
}

/**
 * Créer une nouvelle technique personnalisée
 */
export async function createTechnique(
  input: CreateIntensityTechniqueInput,
  coachId: string
): Promise<IntensityTechnique> {
  const { data, error } = await supabase
    .from('intensification_techniques')
    .insert({
      ...input,
      created_by: coachId,
      is_public: false,
      is_archived: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création de la technique:', error);
    throw error;
  }

  return data;
}

/**
 * Mettre à jour une technique personnalisée
 * (Seules les techniques créées par le coach peuvent être modifiées)
 */
export async function updateTechnique(
  id: string,
  input: UpdateIntensityTechniqueInput,
  coachId: string
): Promise<IntensityTechnique> {
  // Vérifier que la technique appartient au coach
  const technique = await getTechniqueById(id);
  if (!technique || technique.created_by !== coachId) {
    throw new Error('Vous ne pouvez modifier que vos propres techniques');
  }

  const { data, error } = await supabase
    .from('intensification_techniques')
    .update(input)
    .eq('id', id)
    .eq('created_by', coachId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour de la technique:', error);
    throw error;
  }

  return data;
}

/**
 * Archiver une technique personnalisée
 * (Soft delete - la technique reste en base mais n'est plus visible)
 */
export async function archiveTechnique(id: string, coachId: string): Promise<void> {
  // Vérifier que la technique appartient au coach
  const technique = await getTechniqueById(id);
  if (!technique || technique.created_by !== coachId) {
    throw new Error('Vous ne pouvez archiver que vos propres techniques');
  }

  const { error } = await supabase
    .from('intensification_techniques')
    .update({ is_archived: true })
    .eq('id', id)
    .eq('created_by', coachId);

  if (error) {
    console.error('Erreur lors de l\'archivage de la technique:', error);
    throw error;
  }
}

/**
 * Supprimer définitivement une technique personnalisée
 * (Hard delete - à utiliser avec précaution)
 */
export async function deleteTechnique(id: string, coachId: string): Promise<void> {
  // Vérifier que la technique appartient au coach
  const technique = await getTechniqueById(id);
  if (!technique || technique.created_by !== coachId) {
    throw new Error('Vous ne pouvez supprimer que vos propres techniques');
  }

  const { error } = await supabase
    .from('intensification_techniques')
    .delete()
    .eq('id', id)
    .eq('created_by', coachId);

  if (error) {
    console.error('Erreur lors de la suppression de la technique:', error);
    throw error;
  }
}

/**
 * Rechercher des techniques par nom ou description
 */
export async function searchTechniques(
  query: string,
  coachId: string
): Promise<IntensityTechnique[]> {
  const { data, error } = await supabase
    .from('intensification_techniques')
    .select('*')
    .or(`is_public.eq.true,created_by.eq.${coachId}`)
    .eq('is_archived', false)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erreur lors de la recherche de techniques:', error);
    throw error;
  }

  return data || [];
}
