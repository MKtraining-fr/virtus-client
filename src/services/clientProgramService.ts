/**
 * Service pour la gestion des programmes clients (instances)
 * Utilise le modèle de données actuel basé sur programs et sessions.
 * 
 * Version refactorisée - 2025-11-19
 */

import { supabase } from './supabase';
import { WorkoutExercise, WorkoutProgram, WorkoutSession } from '../types';

const mapSessionToWorkoutSession = (session: any): WorkoutSession => {
  const exercises = Array.isArray(session.exercises)
    ? (session.exercises as WorkoutExercise[])
    : [];

  return {
    id: session.id,
    name: session.name,
    exercises,
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
      .select(`
        id,
        start_date,
        end_date,
        current_week,
        current_session,
        status,
        program_id,
        programs (
          id,
          name,
          objective,
          week_count
        )
      `)
      .eq('client_id', clientId)
      .order('start_date', { ascending: false });

    if (assignmentsError) {
      console.error('Erreur lors de la récupération des assignations:', assignmentsError);
      return [];
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    const programs: WorkoutProgram[] = [];

    for (const assignment of assignments) {
      const programData = assignment.programs;
      const programId = programData?.id || assignment.program_id;

      if (!programId) {
        continue;
      }

      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('program_id', programId)
        .order('week_number', { ascending: true })
        .order('session_order', { ascending: true });

      if (sessionsError) {
        console.error('Erreur lors de la récupération des séances:', sessionsError);
        continue;
      }

      const sessionsByWeek: Record<number, WorkoutSession[]> = {};

      for (const session of sessions || []) {
        const weekNumber = session.week_number ?? 1;
        if (!sessionsByWeek[weekNumber]) {
          sessionsByWeek[weekNumber] = [];
        }

        sessionsByWeek[weekNumber].push(mapSessionToWorkoutSession(session));
      }

      programs.push({
        id: programId,
        name: programData?.name || 'Programme',
        objective: programData?.objective || '',
        weekCount: programData?.week_count || 0,
        sessionsByWeek,
        assignmentId: assignment.id,
        currentWeek: assignment.current_week ?? 1,
        currentSession: assignment.current_session ?? 1,
      } as WorkoutProgram);
    }

    return programs;
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
      .select(
        `id, program_id, current_week, current_session, programs ( id, name, objective, week_count )`
      )
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      console.error("Erreur lors de la récupération de l'assignation:", assignmentError);
      return null;
    }

    const programData = assignment.programs;
    const programId = programData?.id || assignment.program_id;

    if (!programId) return null;

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('program_id', programId)
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

      sessionsByWeek[weekNumber].push(mapSessionToWorkoutSession(session));
    }

    return {
      id: programId,
      name: programData?.name || 'Programme',
      objective: programData?.objective || '',
      weekCount: programData?.week_count || 0,
      sessionsByWeek,
      assignmentId: assignment.id,
      currentWeek: assignment.current_week ?? 1,
      currentSession: assignment.current_session ?? 1,
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
