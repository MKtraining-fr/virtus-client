/**
 * Service de gestion des rendez-vous
 * 
 * Gère la création, modification, annulation et récupération des rendez-vous
 * entre coaches et clients, avec intégration Daily.co pour la visioconférence.
 */

import { supabase } from './supabase';
import { dailyService } from './dailyService';

// Types
export interface Appointment {
  id: string;
  coach_id: string;
  client_id: string | null;
  prospect_email: string | null;
  prospect_name: string | null;
  appointment_type_id: string;
  appointment_reason_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  meeting_type: 'video' | 'phone' | 'in_person';
  meeting_url: string | null;
  daily_room_name: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithDetails extends Appointment {
  appointment_type?: {
    name: string;
    color: string;
    default_duration: number;
  };
  appointment_reason?: {
    label: string;
  };
  client?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  coach?: {
    id: string;
  };
}

export interface CreateAppointmentParams {
  coach_id: string;
  client_id?: string;
  prospect_email?: string;
  prospect_name?: string;
  appointment_type_id: string;
  appointment_reason_id?: string;
  title: string;
  description?: string;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  meeting_type: 'video' | 'phone' | 'in_person';
}

export interface UpdateAppointmentParams {
  appointment_type_id?: string;
  appointment_reason_id?: string;
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  meeting_type?: 'video' | 'phone' | 'in_person';
  notes?: string;
}

/**
 * Crée un nouveau rendez-vous
 * Si le type est 'video', crée automatiquement une room Daily.co
 */
export async function createAppointment(
  params: CreateAppointmentParams
): Promise<AppointmentWithDetails> {
  try {
    // Validation
    if (!params.client_id && (!params.prospect_email || !params.prospect_name)) {
      throw new Error('Un client_id OU (prospect_email ET prospect_name) est requis');
    }

    if (params.client_id && (params.prospect_email || params.prospect_name)) {
      throw new Error('Impossible d\'avoir à la fois un client_id et des infos prospect');
    }

    // Vérifier que start_time < end_time
    if (new Date(params.start_time) >= new Date(params.end_time)) {
      throw new Error('La date de fin doit être après la date de début');
    }

    // Créer la room Daily.co si type video
    let meetingUrl: string | null = null;
    let dailyRoomName: string | null = null;

    if (params.meeting_type === 'video') {
      try {
        // Générer un ID temporaire pour la room
        const tempId = crypto.randomUUID();
        const duration = Math.ceil(
          (new Date(params.end_time).getTime() - new Date(params.start_time).getTime()) / 60000
        );

        const room = await dailyService.createRoom(tempId, duration);
        meetingUrl = room.url;
        dailyRoomName = room.name;
      } catch (error) {
        console.error('Erreur création room Daily.co:', error);
        // On continue sans room si erreur (mode dégradé)
      }
    }

    // Créer le rendez-vous dans Supabase
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        coach_id: params.coach_id,
        client_id: params.client_id || null,
        prospect_email: params.prospect_email || null,
        prospect_name: params.prospect_name || null,
        appointment_type_id: params.appointment_type_id,
        appointment_reason_id: params.appointment_reason_id || null,
        title: params.title,
        description: params.description || null,
        start_time: params.start_time,
        end_time: params.end_time,
        meeting_type: params.meeting_type,
        meeting_url: meetingUrl,
        daily_room_name: dailyRoomName,
        status: 'scheduled',
      })
      .select(`
        *,
        appointment_type:appointment_types(name, color, default_duration),
        appointment_reason:appointment_reasons(label),
        client:clients(first_name, last_name, email)
      `)
      .single();

    if (error) {
      // Si erreur, supprimer la room Daily.co créée
      if (dailyRoomName) {
        try {
          await dailyService.deleteRoom(dailyRoomName);
        } catch (cleanupError) {
          console.error('Erreur nettoyage room:', cleanupError);
        }
      }
      throw error;
    }

    console.log('✅ Rendez-vous créé:', data.id);
    return data as AppointmentWithDetails;
  } catch (error) {
    console.error('❌ Erreur création rendez-vous:', error);
    throw error;
  }
}

/**
 * Récupère tous les rendez-vous d'un coach
 */
export async function getCoachAppointments(
  coachId: string,
  filters?: {
    status?: Appointment['status'];
    startDate?: string;
    endDate?: string;
  }
): Promise<AppointmentWithDetails[]> {
  try {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        appointment_type:appointment_types(name, color, default_duration),
        appointment_reason:appointment_reasons(label),
        client:clients(first_name, last_name, email)
      `)
      .eq('coach_id', coachId)
      .order('start_time', { ascending: true });

    // Appliquer les filtres
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('start_time', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data as AppointmentWithDetails[]) || [];
  } catch (error) {
    console.error('❌ Erreur récupération rendez-vous coach:', error);
    throw error;
  }
}

/**
 * Récupère tous les rendez-vous d'un client
 */
export async function getClientAppointments(
  clientId: string,
  filters?: {
    status?: Appointment['status'];
    startDate?: string;
    endDate?: string;
  }
): Promise<AppointmentWithDetails[]> {
  try {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        appointment_type:appointment_types(name, color, default_duration),
        appointment_reason:appointment_reasons(label),
        coach:coach_profiles(id)
      `)
      .eq('client_id', clientId)
      .order('start_time', { ascending: true });

    // Appliquer les filtres
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('start_time', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data as AppointmentWithDetails[]) || [];
  } catch (error) {
    console.error('❌ Erreur récupération rendez-vous client:', error);
    throw error;
  }
}

/**
 * Récupère un rendez-vous par son ID
 */
export async function getAppointmentById(
  appointmentId: string
): Promise<AppointmentWithDetails> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_type:appointment_types(name, color, default_duration),
        appointment_reason:appointment_reasons(label),
        client:clients(first_name, last_name, email),
        coach:coach_profiles(id)
      `)
      .eq('id', appointmentId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Rendez-vous non trouvé');

    return data as AppointmentWithDetails;
  } catch (error) {
    console.error('❌ Erreur récupération rendez-vous:', error);
    throw error;
  }
}

/**
 * Récupère les rendez-vous d'une date spécifique
 */
export async function getAppointmentsForDate(
  userId: string,
  userType: 'coach' | 'client',
  date: string // Format: YYYY-MM-DD
): Promise<AppointmentWithDetails[]> {
  try {
    const startOfDay = `${date}T00:00:00Z`;
    const endOfDay = `${date}T23:59:59Z`;

    const filterField = userType === 'coach' ? 'coach_id' : 'client_id';

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_type:appointment_types(name, color, default_duration),
        appointment_reason:appointment_reasons(label),
        client:clients(first_name, last_name, email)
      `)
      .eq(filterField, userId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .order('start_time', { ascending: true });

    if (error) throw error;

    return (data as AppointmentWithDetails[]) || [];
  } catch (error) {
    console.error('❌ Erreur récupération rendez-vous du jour:', error);
    throw error;
  }
}

/**
 * Récupère les rendez-vous à venir
 */
export async function getUpcomingAppointments(
  userId: string,
  userType: 'coach' | 'client',
  limit: number = 10
): Promise<AppointmentWithDetails[]> {
  try {
    const now = new Date().toISOString();
    const filterField = userType === 'coach' ? 'coach_id' : 'client_id';

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_type:appointment_types(name, color, default_duration),
        appointment_reason:appointment_reasons(label),
        client:clients(first_name, last_name, email)
      `)
      .eq(filterField, userId)
      .eq('status', 'scheduled')
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data as AppointmentWithDetails[]) || [];
  } catch (error) {
    console.error('❌ Erreur récupération rendez-vous à venir:', error);
    throw error;
  }
}

/**
 * Met à jour un rendez-vous
 */
export async function updateAppointment(
  appointmentId: string,
  updates: UpdateAppointmentParams
): Promise<AppointmentWithDetails> {
  try {
    // Si changement de type vers video, créer une room
    let meetingUrl: string | undefined;
    let dailyRoomName: string | undefined;

    if (updates.meeting_type === 'video') {
      // Récupérer le rendez-vous actuel
      const current = await getAppointmentById(appointmentId);
      
      // Si pas de room existante, en créer une
      if (!current.daily_room_name) {
        const duration = Math.ceil(
          (new Date(updates.end_time || current.end_time).getTime() - 
           new Date(updates.start_time || current.start_time).getTime()) / 60000
        );

        try {
          const room = await dailyService.createRoom(appointmentId, duration);
          meetingUrl = room.url;
          dailyRoomName = room.name;
        } catch (error) {
          console.error('Erreur création room Daily.co:', error);
        }
      }
    }

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (meetingUrl) updateData.meeting_url = meetingUrl;
    if (dailyRoomName) updateData.daily_room_name = dailyRoomName;

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select(`
        *,
        appointment_type:appointment_types(name, color, default_duration),
        appointment_reason:appointment_reasons(label),
        client:clients(first_name, last_name, email)
      `)
      .single();

    if (error) throw error;

    console.log('✅ Rendez-vous mis à jour:', appointmentId);
    return data as AppointmentWithDetails;
  } catch (error) {
    console.error('❌ Erreur mise à jour rendez-vous:', error);
    throw error;
  }
}

/**
 * Annule un rendez-vous
 */
export async function cancelAppointment(
  appointmentId: string,
  cancelledBy: string,
  reason?: string
): Promise<AppointmentWithDetails> {
  try {
    // Récupérer le rendez-vous pour supprimer la room Daily.co
    const appointment = await getAppointmentById(appointmentId);

    // Supprimer la room Daily.co si elle existe
    if (appointment.daily_room_name) {
      try {
        await dailyService.deleteRoom(appointment.daily_room_name);
      } catch (error) {
        console.error('Erreur suppression room Daily.co:', error);
        // On continue même si erreur
      }
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || null,
        cancelled_by: cancelledBy,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .select(`
        *,
        appointment_type:appointment_types(name, color, default_duration),
        appointment_reason:appointment_reasons(label),
        client:clients(first_name, last_name, email)
      `)
      .single();

    if (error) throw error;

    console.log('✅ Rendez-vous annulé:', appointmentId);
    return data as AppointmentWithDetails;
  } catch (error) {
    console.error('❌ Erreur annulation rendez-vous:', error);
    throw error;
  }
}

/**
 * Marque un rendez-vous comme terminé
 */
export async function completeAppointment(
  appointmentId: string,
  notes?: string
): Promise<AppointmentWithDetails> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .select(`
        *,
        appointment_type:appointment_types(name, color, default_duration),
        appointment_reason:appointment_reasons(label),
        client:clients(first_name, last_name, email)
      `)
      .single();

    if (error) throw error;

    console.log('✅ Rendez-vous terminé:', appointmentId);
    return data as AppointmentWithDetails;
  } catch (error) {
    console.error('❌ Erreur complétion rendez-vous:', error);
    throw error;
  }
}

/**
 * Supprime un rendez-vous (hard delete)
 * À utiliser avec précaution
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  try {
    // Récupérer le rendez-vous pour supprimer la room Daily.co
    const appointment = await getAppointmentById(appointmentId);

    // Supprimer la room Daily.co si elle existe
    if (appointment.daily_room_name) {
      try {
        await dailyService.deleteRoom(appointment.daily_room_name);
      } catch (error) {
        console.error('Erreur suppression room Daily.co:', error);
      }
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) throw error;

    console.log('✅ Rendez-vous supprimé:', appointmentId);
  } catch (error) {
    console.error('❌ Erreur suppression rendez-vous:', error);
    throw error;
  }
}

/**
 * Génère un token Daily.co pour rejoindre une visio
 */
export async function getMeetingToken(
  appointmentId: string,
  userId: string,
  userName: string
): Promise<string> {
  try {
    const appointment = await getAppointmentById(appointmentId);

    if (!appointment.daily_room_name) {
      throw new Error('Pas de room de visio pour ce rendez-vous');
    }

    // Vérifier si l'utilisateur est le coach (owner)
    const isOwner = appointment.coach_id === userId;

    const tokenData = await dailyService.createMeetingToken(
      appointment.daily_room_name,
      userName,
      isOwner
    );

    return dailyService.getRoomUrlWithToken(
      appointment.meeting_url!,
      tokenData.token
    );
  } catch (error) {
    console.error('❌ Erreur génération token meeting:', error);
    throw error;
  }
}
