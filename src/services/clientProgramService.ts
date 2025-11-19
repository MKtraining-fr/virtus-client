/**
 * Service pour la gestion des programmes clients (instances)
 * Utilise le nouveau modèle de données avec client_programs, client_sessions, etc.
 * 
 * Version refactorisée - 2025-11-19
 */

import { supabase } from './supabase';
import { WorkoutProgram } from '../types';

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
    // Récupérer les assignations actives du client
    const { data: assignments, error: assignmentsError } = await supabase
      .from('program_assignments')
      .select(`
        id,
        start_date,
        current_week,
        current_session_order,
        status,
        client_programs (
          id,
          name,
          objective,
          week_count
        )
      `)
      .eq('client_id', clientId)
      .in('status', ['active', 'upcoming'])
      .order('start_date', { ascending: false });

    if (assignmentsError) {
      console.error('Erreur lors de la récupération des assignations:', assignmentsError);
      return [];
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    // Pour chaque assignation, récupérer les séances et exercices
    const programs: WorkoutProgram[] = [];

    for (const assignment of assignments) {
      const clientProgramData = assignment.client_programs;

      if (!clientProgramData) continue;

      const clientProgramId = clientProgramData.id;

      // Récupérer les séances du programme
      const { data: sessions, error: sessionsError } = await supabase
        .from('client_sessions')
        .select('*')
        .eq('client_program_id', clientProgramId)
        .order('week_number', { ascending: true })
        .order('session_order', { ascending: true });

      if (sessionsError) {
        console.error('Erreur lors de la récupération des séances:', sessionsError);
        continue;
      }

      // Récupérer tous les exercices de toutes les séances
      const sessionIds = sessions?.map((s) => s.id) || [];
      
      const { data: exercises, error: exercisesError } = await supabase
        .from('client_session_exercises')
        .select('*')
        .in('client_session_id', sessionIds)
        .order('exercise_order', { ascending: true });

      if (exercisesError) {
        console.error('Erreur lors de la récupération des exercices:', exercisesError);
        continue;
      }

      // Construire la structure WorkoutProgram
      const sessionsByWeek: { [week: number]: any[] } = {};

      for (const session of sessions || []) {
        const weekNumber = session.week_number || 1;
        
        if (!sessionsByWeek[weekNumber]) {
          sessionsByWeek[weekNumber] = [];
        }

        // Récupérer les exercices de cette séance
        const sessionExercises = exercises?.filter((ex) => ex.client_session_id === session.id) || [];

        const workoutExercises = sessionExercises.map((ex) => ({
          id: ex.id,
          exerciseId: ex.exercise_id,
          name: '', // À récupérer depuis la table exercises si nécessaire
          sets: ex.sets?.toString() || '3',
          details: [{
            reps: ex.reps || '10',
            load: { value: ex.load || '0', unit: 'kg' },
            tempo: ex.tempo || '2-0-2-0',
            rest: ex.rest_time || '60s',
          }],
          intensification: ex.intensification || '',
          notes: ex.notes || '',
          illustrationUrl: '',
        }));

        sessionsByWeek[weekNumber].push({
          id: session.id,
          name: session.name,
          exercises: workoutExercises,
        });
      }

      const workoutProgram: WorkoutProgram = {
        id: clientProgramId,
        name: clientProgramData.name,
        objective: clientProgramData.objective || '',
        weekCount: clientProgramData.week_count,
        sessionsByWeek,
        // Ajouter des métadonnées d'assignation
        assignmentId: assignment.id,
        currentWeek: assignment.current_week,
        currentSession: assignment.current_session_order,
      };

      programs.push(workoutProgram);
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
      .select(`
        id,
        start_date,
        current_week,
        current_session_order,
        status,
        client_programs (
          id,
          name,
          objective,
          week_count
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      console.error('Erreur lors de la récupération de l\'assignation:', assignmentError);
      return null;
    }

    const clientProgramData = assignment.client_programs;

    if (!clientProgramData) return null;

    const clientProgramId = clientProgramData.id;

    // Récupérer les séances
    const { data: sessions, error: sessionsError } = await supabase
      .from('client_sessions')
      .select('*')
      .eq('client_program_id', clientProgramId)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });

    if (sessionsError) {
      console.error('Erreur lors de la récupération des séances:', sessionsError);
      return null;
    }

    // Récupérer les exercices
    const sessionIds = sessions?.map((s) => s.id) || [];
    
    const { data: exercises, error: exercisesError } = await supabase
      .from('client_session_exercises')
      .select('*')
      .in('client_session_id', sessionIds)
      .order('exercise_order', { ascending: true });

    if (exercisesError) {
      console.error('Erreur lors de la récupération des exercices:', exercisesError);
      return null;
    }

    // Construire la structure
    const sessionsByWeek: { [week: number]: any[] } = {};

    for (const session of sessions || []) {
      const weekNumber = session.week_number || 1;
      
      if (!sessionsByWeek[weekNumber]) {
        sessionsByWeek[weekNumber] = [];
      }

      const sessionExercises = exercises?.filter((ex) => ex.client_session_id === session.id) || [];

      const workoutExercises = sessionExercises.map((ex) => ({
        id: ex.id,
        exerciseId: ex.exercise_id,
        name: '',
        sets: ex.sets?.toString() || '3',
        details: [{
          reps: ex.reps || '10',
          load: { value: ex.load || '0', unit: 'kg' },
          tempo: ex.tempo || '2-0-2-0',
          rest: ex.rest_time || '60s',
        }],
        intensification: ex.intensification || '',
        notes: ex.notes || '',
        illustrationUrl: '',
      }));

      sessionsByWeek[weekNumber].push({
        id: session.id,
        name: session.name,
        exercises: workoutExercises,
      });
    }

    return {
      id: clientProgramId,
      name: clientProgramData.name,
      objective: clientProgramData.objective || '',
      weekCount: clientProgramData.week_count,
      sessionsByWeek,
      assignmentId: assignment.id,
      currentWeek: assignment.current_week,
      currentSession: assignment.current_session_order,
    };
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
        current_session_order: currentSessionOrder,
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
      .from('client_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
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
