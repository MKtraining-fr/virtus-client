/**
 * Service de gestion des disponibilités
 * 
 * Gère les disponibilités hebdomadaires des coaches et calcule
 * les créneaux disponibles pour la prise de rendez-vous
 */

import { supabase } from './supabase';

// Types
export interface CoachAvailability {
  id: string;
  coach_id: string;
  day_of_week: number; // 0=Dimanche, 1=Lundi, ..., 6=Samedi
  start_time: string; // Format: HH:MM:SS
  end_time: string; // Format: HH:MM:SS
  is_active: boolean;
  created_at: string;
}

export interface CreateAvailabilityParams {
  coach_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface UpdateAvailabilityParams {
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

// =====================================================
// GESTION DES DISPONIBILITÉS
// =====================================================

/**
 * Récupère toutes les disponibilités d'un coach
 */
export async function getCoachAvailability(
  coachId: string,
  activeOnly: boolean = true
): Promise<CoachAvailability[]> {
  try {
    let query = supabase
      .from('coach_availability')
      .select('*')
      .eq('coach_id', coachId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data as CoachAvailability[]) || [];
  } catch (error) {
    console.error('❌ Erreur récupération disponibilités:', error);
    throw error;
  }
}

/**
 * Récupère les disponibilités d'un coach pour un jour spécifique
 */
export async function getCoachAvailabilityForDay(
  coachId: string,
  dayOfWeek: number
): Promise<CoachAvailability[]> {
  try {
    const { data, error } = await supabase
      .from('coach_availability')
      .select('*')
      .eq('coach_id', coachId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    if (error) throw error;

    return (data as CoachAvailability[]) || [];
  } catch (error) {
    console.error('❌ Erreur récupération disponibilités du jour:', error);
    throw error;
  }
}

/**
 * Crée une nouvelle plage de disponibilité
 */
export async function createAvailability(
  params: CreateAvailabilityParams
): Promise<CoachAvailability> {
  try {
    // Validation
    if (params.day_of_week < 0 || params.day_of_week > 6) {
      throw new Error('Le jour de la semaine doit être entre 0 (dimanche) et 6 (samedi)');
    }

    if (params.start_time >= params.end_time) {
      throw new Error('L\'heure de fin doit être après l\'heure de début');
    }

    const { data, error } = await supabase
      .from('coach_availability')
      .insert({
        coach_id: params.coach_id,
        day_of_week: params.day_of_week,
        start_time: params.start_time,
        end_time: params.end_time,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Disponibilité créée:', data.id);
    return data as CoachAvailability;
  } catch (error) {
    console.error('❌ Erreur création disponibilité:', error);
    throw error;
  }
}

/**
 * Met à jour une disponibilité
 */
export async function updateAvailability(
  availabilityId: string,
  updates: UpdateAvailabilityParams
): Promise<CoachAvailability> {
  try {
    // Validation
    if (updates.day_of_week !== undefined && (updates.day_of_week < 0 || updates.day_of_week > 6)) {
      throw new Error('Le jour de la semaine doit être entre 0 et 6');
    }

    const { data, error } = await supabase
      .from('coach_availability')
      .update(updates)
      .eq('id', availabilityId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Disponibilité mise à jour:', availabilityId);
    return data as CoachAvailability;
  } catch (error) {
    console.error('❌ Erreur mise à jour disponibilité:', error);
    throw error;
  }
}

/**
 * Supprime une disponibilité
 */
export async function deleteAvailability(availabilityId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('coach_availability')
      .delete()
      .eq('id', availabilityId);

    if (error) throw error;

    console.log('✅ Disponibilité supprimée:', availabilityId);
  } catch (error) {
    console.error('❌ Erreur suppression disponibilité:', error);
    throw error;
  }
}

/**
 * Définit les disponibilités complètes d'un coach
 * Remplace toutes les disponibilités existantes
 */
export async function setCoachAvailability(
  coachId: string,
  availabilities: Omit<CreateAvailabilityParams, 'coach_id'>[]
): Promise<CoachAvailability[]> {
  try {
    // Supprimer toutes les disponibilités existantes
    await supabase
      .from('coach_availability')
      .delete()
      .eq('coach_id', coachId);

    // Créer les nouvelles disponibilités
    if (availabilities.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('coach_availability')
      .insert(
        availabilities.map(av => ({
          coach_id: coachId,
          day_of_week: av.day_of_week,
          start_time: av.start_time,
          end_time: av.end_time,
          is_active: true,
        }))
      )
      .select();

    if (error) throw error;

    console.log('✅ Disponibilités définies pour le coach:', coachId);
    return (data as CoachAvailability[]) || [];
  } catch (error) {
    console.error('❌ Erreur définition disponibilités:', error);
    throw error;
  }
}

// =====================================================
// CALCUL DES CRÉNEAUX DISPONIBLES
// =====================================================

/**
 * Calcule les créneaux disponibles pour une date donnée
 * 
 * @param coachId - ID du coach
 * @param date - Date pour laquelle calculer les créneaux (format: YYYY-MM-DD)
 * @param duration - Durée du rendez-vous en minutes
 * @param slotInterval - Intervalle entre les créneaux en minutes (par défaut: 15)
 * @returns Liste des créneaux disponibles
 */
export async function getAvailableSlots(
  coachId: string,
  date: string,
  duration: number,
  slotInterval: number = 15
): Promise<TimeSlot[]> {
  try {
    // Récupérer le jour de la semaine (0=Dimanche, 1=Lundi, etc.)
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Récupérer les disponibilités du coach pour ce jour
    const availabilities = await getCoachAvailabilityForDay(coachId, dayOfWeek);

    if (availabilities.length === 0) {
      return [];
    }

    // Récupérer les rendez-vous existants pour cette date
    const startOfDay = `${date}T00:00:00Z`;
    const endOfDay = `${date}T23:59:59Z`;

    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('coach_id', coachId)
      .eq('status', 'scheduled')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay);

    if (error) throw error;

    // Générer tous les créneaux possibles
    const allSlots: TimeSlot[] = [];

    for (const availability of availabilities) {
      const [startHour, startMinute] = availability.start_time.split(':').map(Number);
      const [endHour, endMinute] = availability.end_time.split(':').map(Number);

      // Créer les dates de début et fin pour cette disponibilité
      const availStart = new Date(date);
      availStart.setHours(startHour, startMinute, 0, 0);

      const availEnd = new Date(date);
      availEnd.setHours(endHour, endMinute, 0, 0);

      // Générer les créneaux par intervalle
      let currentSlotStart = new Date(availStart);

      while (currentSlotStart < availEnd) {
        const slotEnd = new Date(currentSlotStart.getTime() + duration * 60000);

        // Vérifier que le créneau ne dépasse pas la fin de disponibilité
        if (slotEnd <= availEnd) {
          // Vérifier si le créneau est dans le futur
          const now = new Date();
          const isInFuture = currentSlotStart > now;

          // Vérifier si le créneau chevauche un rendez-vous existant
          const isOverlapping = existingAppointments?.some(apt => {
            const aptStart = new Date(apt.start_time);
            const aptEnd = new Date(apt.end_time);
            return (
              (currentSlotStart >= aptStart && currentSlotStart < aptEnd) ||
              (slotEnd > aptStart && slotEnd <= aptEnd) ||
              (currentSlotStart <= aptStart && slotEnd >= aptEnd)
            );
          });

          allSlots.push({
            start: new Date(currentSlotStart),
            end: new Date(slotEnd),
            available: isInFuture && !isOverlapping,
          });
        }

        // Passer au créneau suivant
        currentSlotStart = new Date(currentSlotStart.getTime() + slotInterval * 60000);
      }
    }

    return allSlots;
  } catch (error) {
    console.error('❌ Erreur calcul créneaux disponibles:', error);
    throw error;
  }
}

/**
 * Calcule les créneaux disponibles pour une période
 * 
 * @param coachId - ID du coach
 * @param startDate - Date de début (format: YYYY-MM-DD)
 * @param endDate - Date de fin (format: YYYY-MM-DD)
 * @param duration - Durée du rendez-vous en minutes
 * @returns Map des créneaux disponibles par date
 */
export async function getAvailableSlotsForPeriod(
  coachId: string,
  startDate: string,
  endDate: string,
  duration: number
): Promise<Map<string, TimeSlot[]>> {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const slotsMap = new Map<string, TimeSlot[]>();

    // Parcourir chaque jour de la période
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const slots = await getAvailableSlots(coachId, dateStr, duration);
      
      // Ne garder que les créneaux disponibles
      const availableSlots = slots.filter(slot => slot.available);
      
      if (availableSlots.length > 0) {
        slotsMap.set(dateStr, availableSlots);
      }

      // Passer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slotsMap;
  } catch (error) {
    console.error('❌ Erreur calcul créneaux pour période:', error);
    throw error;
  }
}

/**
 * Vérifie si un créneau spécifique est disponible
 */
export async function isSlotAvailable(
  coachId: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const date = start.toISOString().split('T')[0];
    const duration = Math.ceil((end.getTime() - start.getTime()) / 60000);

    const slots = await getAvailableSlots(coachId, date, duration);

    // Chercher un créneau qui correspond exactement
    return slots.some(slot => 
      slot.available &&
      slot.start.getTime() === start.getTime() &&
      slot.end.getTime() === end.getTime()
    );
  } catch (error) {
    console.error('❌ Erreur vérification disponibilité créneau:', error);
    return false;
  }
}

// =====================================================
// UTILITAIRES
// =====================================================

/**
 * Convertit un numéro de jour en nom de jour
 */
export function getDayName(dayOfWeek: number, locale: string = 'fr-FR'): string {
  const date = new Date(2024, 0, dayOfWeek); // 2024-01-01 est un lundi
  return date.toLocaleDateString(locale, { weekday: 'long' });
}

/**
 * Formate une heure pour l'affichage
 */
export function formatTime(time: string): string {
  const [hour, minute] = time.split(':');
  return `${hour}:${minute}`;
}

/**
 * Vérifie si un coach a des disponibilités configurées
 */
export async function hasAvailabilityConfigured(coachId: string): Promise<boolean> {
  try {
    const availabilities = await getCoachAvailability(coachId, true);
    return availabilities.length > 0;
  } catch (error) {
    console.error('❌ Erreur vérification disponibilités:', error);
    return false;
  }
}
