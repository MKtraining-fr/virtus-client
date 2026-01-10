/**
 * Service d'initialisation du planning
 * 
 * Crée automatiquement les données par défaut pour un coach :
 * - Types de rendez-vous (Suivi 15min, Bilan 30min)
 * - Motifs de rendez-vous
 * - Disponibilités (Lun-Ven 9h-12h, 14h-18h)
 */

import { supabase } from './supabase';

/**
 * Vérifie si le coach a déjà des données de planning configurées
 */
export async function hasPlanningConfiguration(coachId: string): Promise<boolean> {
  try {
    // Vérifier s'il existe des types de RDV
    const { data: types } = await supabase
      .from('appointment_types')
      .select('id')
      .eq('coach_id', coachId)
      .limit(1);

    return (types && types.length > 0) || false;
  } catch (error) {
    console.error('Erreur vérification configuration:', error);
    return false;
  }
}

/**
 * Initialise les données par défaut pour un nouveau coach
 */
export async function initializeDefaultPlanningData(coachId: string): Promise<void> {
  try {
    // Vérifier si déjà configuré
    const hasConfig = await hasPlanningConfiguration(coachId);
    if (hasConfig) {
      console.log('Configuration déjà existante pour ce coach');
      return;
    }

    console.log('Initialisation des données par défaut pour le coach', coachId);

    // 1. Créer les types de rendez-vous par défaut
    const { data: types, error: typesError } = await supabase
      .from('appointment_types')
      .insert([
        {
          coach_id: coachId,
          name: 'Suivi',
          default_duration: 15,
          color: '#3B82F6', // Bleu
          is_active: true,
        },
        {
          coach_id: coachId,
          name: 'Bilan',
          default_duration: 30,
          color: '#10B981', // Vert
          is_active: true,
        },
      ])
      .select();

    if (typesError) {
      console.error('Erreur création types:', typesError);
      throw typesError;
    }

    console.log('Types de RDV créés:', types);

    // 2. Créer les motifs par défaut
    const { data: reasons, error: reasonsError } = await supabase
      .from('appointment_reasons')
      .insert([
        {
          coach_id: coachId,
          label: 'Première séance',
          display_order: 1,
          is_active: true,
        },
        {
          coach_id: coachId,
          label: 'Suivi mensuel',
          display_order: 2,
          is_active: true,
        },
        {
          coach_id: coachId,
          label: 'Bilan de progression',
          display_order: 3,
          is_active: true,
        },
        {
          coach_id: coachId,
          label: 'Autre',
          display_order: 4,
          is_active: true,
        },
      ])
      .select();

    if (reasonsError) {
      console.error('Erreur création motifs:', reasonsError);
      throw reasonsError;
    }

    console.log('Motifs créés:', reasons);

    // 3. Créer les disponibilités par défaut (Lun-Ven 9h-12h, 14h-18h)
    const availabilities = [];
    
    // Pour chaque jour de la semaine (1=Lundi, 5=Vendredi)
    for (let day = 1; day <= 5; day++) {
      // Matin : 9h-12h
      availabilities.push({
        coach_id: coachId,
        day_of_week: day,
        start_time: '09:00',
        end_time: '12:00',
        is_active: true,
      });
      
      // Après-midi : 14h-18h
      availabilities.push({
        coach_id: coachId,
        day_of_week: day,
        start_time: '14:00',
        end_time: '18:00',
        is_active: true,
      });
    }

    const { data: dispos, error: disposError } = await supabase
      .from('coach_availability')
      .insert(availabilities)
      .select();

    if (disposError) {
      console.error('Erreur création disponibilités:', disposError);
      throw disposError;
    }

    console.log('Disponibilités créées:', dispos);
    console.log('✅ Initialisation terminée avec succès');

  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

/**
 * Hook pour initialiser automatiquement au chargement de la page Planning
 */
export async function ensurePlanningInitialized(coachId: string): Promise<void> {
  const hasConfig = await hasPlanningConfiguration(coachId);
  
  if (!hasConfig) {
    console.log('Aucune configuration trouvée, initialisation automatique...');
    await initializeDefaultPlanningData(coachId);
  }
}
