/**
 * Service de configuration des rendez-vous
 * 
 * Gère les types de rendez-vous et les motifs personnalisés par coach
 */

import { supabase } from './supabase';

// Types
export interface AppointmentType {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  default_duration: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentReason {
  id: string;
  coach_id: string;
  label: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface CreateAppointmentTypeParams {
  coach_id: string;
  name: string;
  description?: string;
  default_duration: number;
  color?: string;
}

export interface UpdateAppointmentTypeParams {
  name?: string;
  description?: string;
  default_duration?: number;
  color?: string;
  is_active?: boolean;
}

export interface CreateAppointmentReasonParams {
  coach_id: string;
  label: string;
  display_order?: number;
}

export interface UpdateAppointmentReasonParams {
  label?: string;
  display_order?: number;
  is_active?: boolean;
}

// =====================================================
// TYPES DE RENDEZ-VOUS
// =====================================================

/**
 * Récupère tous les types de rendez-vous d'un coach
 */
export async function getAppointmentTypes(
  coachId: string,
  activeOnly: boolean = true
): Promise<AppointmentType[]> {
  try {
    let query = supabase
      .from('appointment_types')
      .select('*')
      .eq('coach_id', coachId)
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data as AppointmentType[]) || [];
  } catch (error) {
    console.error('❌ Erreur récupération types de rendez-vous:', error);
    throw error;
  }
}

/**
 * Récupère un type de rendez-vous par son ID
 */
export async function getAppointmentTypeById(
  typeId: string
): Promise<AppointmentType> {
  try {
    const { data, error } = await supabase
      .from('appointment_types')
      .select('*')
      .eq('id', typeId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Type de rendez-vous non trouvé');

    return data as AppointmentType;
  } catch (error) {
    console.error('❌ Erreur récupération type de rendez-vous:', error);
    throw error;
  }
}

/**
 * Crée un nouveau type de rendez-vous
 */
export async function createAppointmentType(
  params: CreateAppointmentTypeParams
): Promise<AppointmentType> {
  try {
    // Validation
    if (params.default_duration <= 0) {
      throw new Error('La durée doit être positive');
    }

    const { data, error } = await supabase
      .from('appointment_types')
      .insert({
        coach_id: params.coach_id,
        name: params.name,
        description: params.description || null,
        default_duration: params.default_duration,
        color: params.color || '#3B82F6',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Type de rendez-vous créé:', data.id);
    return data as AppointmentType;
  } catch (error) {
    console.error('❌ Erreur création type de rendez-vous:', error);
    throw error;
  }
}

/**
 * Met à jour un type de rendez-vous
 */
export async function updateAppointmentType(
  typeId: string,
  updates: UpdateAppointmentTypeParams
): Promise<AppointmentType> {
  try {
    // Validation
    if (updates.default_duration !== undefined && updates.default_duration <= 0) {
      throw new Error('La durée doit être positive');
    }

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('appointment_types')
      .update(updateData)
      .eq('id', typeId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Type de rendez-vous mis à jour:', typeId);
    return data as AppointmentType;
  } catch (error) {
    console.error('❌ Erreur mise à jour type de rendez-vous:', error);
    throw error;
  }
}

/**
 * Désactive un type de rendez-vous (soft delete)
 */
export async function deactivateAppointmentType(typeId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('appointment_types')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', typeId);

    if (error) throw error;

    console.log('✅ Type de rendez-vous désactivé:', typeId);
  } catch (error) {
    console.error('❌ Erreur désactivation type de rendez-vous:', error);
    throw error;
  }
}

/**
 * Supprime définitivement un type de rendez-vous (hard delete)
 * Attention : échouera si des rendez-vous utilisent ce type
 */
export async function deleteAppointmentType(typeId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('appointment_types')
      .delete()
      .eq('id', typeId);

    if (error) {
      if (error.code === '23503') {
        throw new Error('Impossible de supprimer ce type car des rendez-vous l\'utilisent');
      }
      throw error;
    }

    console.log('✅ Type de rendez-vous supprimé:', typeId);
  } catch (error) {
    console.error('❌ Erreur suppression type de rendez-vous:', error);
    throw error;
  }
}

// =====================================================
// MOTIFS DE RENDEZ-VOUS
// =====================================================

/**
 * Récupère tous les motifs de rendez-vous d'un coach
 */
export async function getAppointmentReasons(
  coachId: string,
  activeOnly: boolean = true
): Promise<AppointmentReason[]> {
  try {
    let query = supabase
      .from('appointment_reasons')
      .select('*')
      .eq('coach_id', coachId)
      .order('display_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data as AppointmentReason[]) || [];
  } catch (error) {
    console.error('❌ Erreur récupération motifs de rendez-vous:', error);
    throw error;
  }
}

/**
 * Récupère un motif de rendez-vous par son ID
 */
export async function getAppointmentReasonById(
  reasonId: string
): Promise<AppointmentReason> {
  try {
    const { data, error } = await supabase
      .from('appointment_reasons')
      .select('*')
      .eq('id', reasonId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Motif de rendez-vous non trouvé');

    return data as AppointmentReason;
  } catch (error) {
    console.error('❌ Erreur récupération motif de rendez-vous:', error);
    throw error;
  }
}

/**
 * Crée un nouveau motif de rendez-vous
 */
export async function createAppointmentReason(
  params: CreateAppointmentReasonParams
): Promise<AppointmentReason> {
  try {
    // Si pas d'ordre spécifié, mettre à la fin
    let displayOrder = params.display_order;
    
    if (displayOrder === undefined) {
      // Récupérer le dernier ordre
      const { data: existingReasons } = await supabase
        .from('appointment_reasons')
        .select('display_order')
        .eq('coach_id', params.coach_id)
        .order('display_order', { ascending: false })
        .limit(1);

      displayOrder = existingReasons && existingReasons.length > 0
        ? existingReasons[0].display_order + 1
        : 0;
    }

    const { data, error } = await supabase
      .from('appointment_reasons')
      .insert({
        coach_id: params.coach_id,
        label: params.label,
        display_order: displayOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Motif de rendez-vous créé:', data.id);
    return data as AppointmentReason;
  } catch (error) {
    console.error('❌ Erreur création motif de rendez-vous:', error);
    throw error;
  }
}

/**
 * Met à jour un motif de rendez-vous
 */
export async function updateAppointmentReason(
  reasonId: string,
  updates: UpdateAppointmentReasonParams
): Promise<AppointmentReason> {
  try {
    const { data, error } = await supabase
      .from('appointment_reasons')
      .update(updates)
      .eq('id', reasonId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Motif de rendez-vous mis à jour:', reasonId);
    return data as AppointmentReason;
  } catch (error) {
    console.error('❌ Erreur mise à jour motif de rendez-vous:', error);
    throw error;
  }
}

/**
 * Réorganise l'ordre des motifs de rendez-vous
 */
export async function reorderAppointmentReasons(
  coachId: string,
  reasonIds: string[]
): Promise<void> {
  try {
    // Mettre à jour l'ordre de chaque motif
    const updates = reasonIds.map((reasonId, index) => 
      supabase
        .from('appointment_reasons')
        .update({ display_order: index })
        .eq('id', reasonId)
        .eq('coach_id', coachId)
    );

    await Promise.all(updates);

    console.log('✅ Motifs de rendez-vous réorganisés');
  } catch (error) {
    console.error('❌ Erreur réorganisation motifs:', error);
    throw error;
  }
}

/**
 * Désactive un motif de rendez-vous (soft delete)
 */
export async function deactivateAppointmentReason(reasonId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('appointment_reasons')
      .update({ is_active: false })
      .eq('id', reasonId);

    if (error) throw error;

    console.log('✅ Motif de rendez-vous désactivé:', reasonId);
  } catch (error) {
    console.error('❌ Erreur désactivation motif de rendez-vous:', error);
    throw error;
  }
}

/**
 * Supprime définitivement un motif de rendez-vous (hard delete)
 */
export async function deleteAppointmentReason(reasonId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('appointment_reasons')
      .delete()
      .eq('id', reasonId);

    if (error) throw error;

    console.log('✅ Motif de rendez-vous supprimé:', reasonId);
  } catch (error) {
    console.error('❌ Erreur suppression motif de rendez-vous:', error);
    throw error;
  }
}

// =====================================================
// UTILITAIRES
// =====================================================

/**
 * Récupère la configuration complète d'un coach
 * (types + motifs)
 */
export async function getCoachAppointmentConfig(coachId: string): Promise<{
  types: AppointmentType[];
  reasons: AppointmentReason[];
}> {
  try {
    const [types, reasons] = await Promise.all([
      getAppointmentTypes(coachId, true),
      getAppointmentReasons(coachId, true),
    ]);

    return { types, reasons };
  } catch (error) {
    console.error('❌ Erreur récupération configuration coach:', error);
    throw error;
  }
}

/**
 * Vérifie si un coach a des types de rendez-vous configurés
 */
export async function hasAppointmentTypesConfigured(coachId: string): Promise<boolean> {
  try {
    const types = await getAppointmentTypes(coachId, true);
    return types.length > 0;
  } catch (error) {
    console.error('❌ Erreur vérification configuration:', error);
    return false;
  }
}
