/**
 * Service pour la gestion des programmes clients (instances)
 * Utilise le modèle de données actuel basé sur programs et sessions.
 * 
 * Version refactorisée - 2025-11-19
 */

import { supabase } from './supabase';
import { WorkoutExercise, WorkoutProgram, WorkoutSession } from '../types';

const mapClientSessionToWorkoutSession = (
  session: any,
  indexOffset = 0
): WorkoutSession => {
  const exercises = Array.isArray(session.client_session_exercises)
    ? (session.client_session_exercises as any[])
    : [];

  const mappedExercises: WorkoutExercise[] = exercises.map((exercise, idx) => ({
    id: idx + 1 + indexOffset,
    dbId: exercise.id,
    exerciseId: exercise.exercise_id,
    name: exercise.exercises?.name || 'Exercice',
    illustrationUrl: exercise.exercises?.image_url || undefined,
    sets: exercise.sets ?? '',
    reps: exercise.reps ?? '',
    load: exercise.load ?? '',
    tempo: exercise.tempo ?? '',
    restTime: exercise.rest_time ?? '',
    intensification: Array.isArray(exercise.intensification)
      ? exercise.intensification.map((value: any, i: number) => ({
          id: i + 1,
          value: String(value),
        }))
      : [],
    notes: exercise.notes ?? undefined,
  }));

  return {
    id: session.id,
    name: session.name,
    exercises: mappedExercises,
    weekNumber: session.week_number ?? 1,
    sessionOrder: session.session_order ?? 1,
  } as WorkoutSession;
};

/**
 * Récupère tous les programmes assignés à un client avec leurs détails complets
 * 
 * @param clientId - ID du client
 * @returns Liste des programmes assignés sous forme de WorkoutProgram
 */
export const getClientAssignedPrograms = async (
  clientId: string
): Promise<WorkoutProgram[]> => {
  try {
    const { data: assignments, error: assignmentsError } = await supabase
      .from('program_assignments')
      .select(
        'id, start_date, end_date, current_week, current_session_order, status'
      )
      .eq('client_id', clientId)
      .order('start_date', { ascending: false });

    // ÉTAPE 1.5 : Vérifier et mettre à jour les programmes 'upcoming' qui devraient être 'active'
    const assignmentsToActivate = (assignments ?? []).filter(
      (a) => a.status === 'upcoming' && new Date(a.start_date) <= new Date()
    );

    if (assignmentsToActivate.length > 0) {
      const idsToActivate = assignmentsToActivate.map((a) => a.id);
      console.log(`Activation de ${idsToActivate.length} programmes: ${idsToActivate.join(', ')}`);

      const { error: updateError } = await supabase
        .from('program_assignments')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .in('id', idsToActivate);

      if (updateError) {
        console.error('Erreur lors de l\'activation des programmes:', updateError);
      } else {
        // Mettre à jour le statut dans l'objet local pour la suite du traitement
        assignmentsToActivate.forEach((a) => (a.status = 'active'));
      }
    }

    if (assignmentsError) {
      console.error('Erreur lors de la récupération des assignations:', assignmentsError);
      return [];
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    const assignmentIds = assignments.map((a) => a.id);
    if (assignmentIds.length === 0) {
      return [];
    }

    const { data: clientPrograms, error: clientProgramsError } = await supabase
      .from('client_programs')
      .select('id, assignment_id, name, objective, week_count')
      .in('assignment_id', assignmentIds);

    if (clientProgramsError) {
      console.error(
        'Erreur lors de la récupération des programmes clients:',
        clientProgramsError
      );
      return [];
    }

    if (!clientPrograms || clientPrograms.length === 0) {
      return [];
    }

    const programIds = clientPrograms.map((p) => p.id).filter(Boolean);
    if (programIds.length === 0) {
      return [];
    }

    let sessionsQuery = supabase
      .from("client_sessions")
      .select(`
        id,
        client_program_id,
        name,
        week_number,
        session_order,
        client_session_exercises!inner (
          id,
          exercise_id,
          sets,
          reps,
          load,
          tempo,
          rest_time,
          intensification,
          notes,
          exercises!inner (
            id,
            name,
            image_url
          )
        )
      `);

    if (programIds.length === 1) {
      sessionsQuery = sessionsQuery.eq("client_program_id", programIds[0]);
    } else {
      sessionsQuery = sessionsQuery.in("client_program_id", programIds);
    }

    const { data: clientSessions, error: clientSessionsError } = await sessionsQuery
      .order("week_number", { ascending: true })
      .order("session_order", { ascending: true });

    if (clientSessionsError) {
      console.error(
        'Erreur lors de la récupération des séances client:',
        clientSessionsError
      );
      return [];
    }

    const sessionsByProgram: Record<string, WorkoutSession[]> = {};
    (clientSessions || []).forEach((session) => {
      const mapped = mapClientSessionToWorkoutSession(session);
      if (!sessionsByProgram[session.client_program_id]) {
        sessionsByProgram[session.client_program_id] = [];
      }
      sessionsByProgram[session.client_program_id].push(mapped);
    });

    return (clientPrograms || []).map((program) => {
      const assignment = assignments.find((a) => a.id === program.assignment_id);
      const sessions = sessionsByProgram[program.id] || [];
      const sessionsByWeek: Record<number, WorkoutSession[]> = {};

      sessions.forEach((session) => {
        const weekNumber = session.weekNumber ?? 1;
        if (!sessionsByWeek[weekNumber]) {
          sessionsByWeek[weekNumber] = [];
        }
        sessionsByWeek[weekNumber].push(session);
      });

      return {
        id: program.id,
        name: program.name,
        objective: program.objective || '',
        weekCount: program.week_count || 0,
        sessionsByWeek,
        assignmentId: assignment?.id,
        status: assignment?.status,
        currentWeek: assignment?.current_week ?? 1,
        currentSession: assignment?.current_session_order ?? 1,
      } as WorkoutProgram;
    });
  } catch (error) {
    console.error('Erreur globale lors de la récupération des programmes assignés:', error);
    return [];
  }
};

/**
 * Récupère un programme assigné spécifique avec tous ses détails
 * 
 * @param assignmentId - ID de l'assignation
 * @returns Le programme complet ou null
 */
export const getAssignedProgramDetails = async (
  assignmentId: string
): Promise<WorkoutProgram | null> => {
  try {
    const { data: assignment, error: assignmentError } = await supabase
      .from('program_assignments')
      .select('id, current_week, current_session_order, status, client_programs ( id, name, objective, week_count )')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      console.error("Erreur lors de la récupération de l'assignation:", assignmentError);
      return null;
    }

    const clientProgram = assignment.client_programs?.[0];
    if (!clientProgram?.id) return null;

    const { data: sessions, error: sessionsError } = await supabase
      .from('client_sessions')
      .select(`
        id,
        client_program_id,
        name,
        week_number,
        session_order,
        client_session_exercises!inner (
          id,
          exercise_id,
          sets,
          reps,
          load,
          tempo,
          rest_time,
          intensification,
          notes,
          exercises!inner (
            id,
            name,
            image_url
          )
        )
      `)
      .eq('client_program_id', clientProgram.id)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });

    if (sessionsError) {
      console.error('Erreur lors de la récupération des séances:', sessionsError);
      return null;
    }

    const sessionsByWeek: Record<number, WorkoutSession[]> = {};

    for (const session of sessions || []) {
      const weekNumber = session.week_number ?? 1;
      if (!sessionsByWeek[weekNumber]) {
        sessionsByWeek[weekNumber] = [];
      }

      sessionsByWeek[weekNumber].push(mapClientSessionToWorkoutSession(session));
    }

    return {
      id: clientProgram.id,
      name: clientProgram.name || 'Programme',
      objective: clientProgram.objective || '',
      weekCount: clientProgram.week_count || 0,
      sessionsByWeek,
      assignmentId: assignment.id,
      currentWeek: assignment.current_week ?? 1,
      currentSession: assignment.current_session_order ?? 1,
    } as WorkoutProgram;
  } catch (error) {
    console.error('Erreur globale lors de la récupération des détails:', error);
    return null;
  }
};

/**
 * Met à jour la progression du client dans un programme assigné
 * 
 * @param assignmentId - ID de l'assignation
 * @param currentWeek - Semaine actuelle
 * @param currentSessionOrder - Ordre de la séance actuelle
 * @returns true si succès, false sinon
 */
export const updateClientProgress = async (
  assignmentId: string,
  currentWeek: number,
  currentSessionOrder: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .update({
        current_week: currentWeek,
        current_session: currentSessionOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    if (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la mise à jour de la progression:', error);
    return false;
  }
};

/**
 * Marque une séance comme complétée
 * 
 * @param sessionId - ID de la séance client
 * @returns true si succès, false sinon
 */
export const markSessionAsCompleted = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Erreur lors du marquage de la séance:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale:', error);
    return false;
  }
};
