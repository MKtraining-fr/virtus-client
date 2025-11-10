import { supabase } from './supabase';
import { WorkoutProgram } from '../types';

/**
 * Récupère tous les programmes assignés à un client
 * 
 * @param clientId - ID du client
 * @returns Liste des programmes assignés sous forme de WorkoutProgram
 */
export const getClientAssignedPrograms = async (
  clientId: string
): Promise<WorkoutProgram[]> => {
  try {
    // Récupérer les assignements actifs du client
    const { data: assignments, error: assignmentsError } = await supabase
      .from('program_assignments')
      .select(`
        id,
        start_date,
        current_week,
        current_session,
        status,
        client_program_id,
        client_created_programs (
          id,
          name,
          objective,
          week_count
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .order('start_date', { ascending: false });

    if (assignmentsError) {
      console.error('Erreur lors de la récupération des assignements:', assignmentsError);
      return [];
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    // Pour chaque assignement, récupérer les séances et exercices
    const programs: WorkoutProgram[] = [];

    for (const assignment of assignments) {
      const clientProgramId = assignment.client_program_id;
      const programData = assignment.client_created_programs;

      if (!programData) continue;

      // Récupérer les séances du programme
      const { data: sessions, error: sessionsError } = await supabase
        .from('client_created_sessions')
        .select('*')
        .eq('program_id', clientProgramId)
        .order('week_number', { ascending: true })
        .order('session_order', { ascending: true });

      if (sessionsError) {
        console.error('Erreur lors de la récupération des séances:', sessionsError);
        continue;
      }

      // Récupérer tous les exercices de toutes les séances
      const sessionIds = sessions?.map((s) => s.id) || [];
      
      const { data: exercises, error: exercisesError } = await supabase
        .from('client_created_session_exercises')
        .select('*')
        .in('session_id', sessionIds)
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
        const sessionExercises = exercises?.filter((ex) => ex.session_id === session.id) || [];

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
        name: programData.name,
        objective: programData.objective || '',
        weekCount: programData.week_count,
        sessionsByWeek,
        // Ajouter des métadonnées d'assignement
        assignmentId: assignment.id,
        currentWeek: assignment.current_week,
        currentSession: assignment.current_session,
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
 * @param assignmentId - ID de l'assignement
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
        current_session,
        status,
        client_program_id,
        client_created_programs (
          id,
          name,
          objective,
          week_count
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      console.error('Erreur lors de la récupération de l\'assignement:', assignmentError);
      return null;
    }

    const clientProgramId = assignment.client_program_id;
    const programData = assignment.client_created_programs;

    if (!programData) return null;

    // Récupérer les séances
    const { data: sessions, error: sessionsError } = await supabase
      .from('client_created_sessions')
      .select('*')
      .eq('program_id', clientProgramId)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });

    if (sessionsError) {
      console.error('Erreur lors de la récupération des séances:', sessionsError);
      return null;
    }

    // Récupérer les exercices
    const sessionIds = sessions?.map((s) => s.id) || [];
    
    const { data: exercises, error: exercisesError } = await supabase
      .from('client_created_session_exercises')
      .select('*')
      .in('session_id', sessionIds)
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

      const sessionExercises = exercises?.filter((ex) => ex.session_id === session.id) || [];

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
      name: programData.name,
      objective: programData.objective || '',
      weekCount: programData.week_count,
      sessionsByWeek,
      assignmentId: assignment.id,
      currentWeek: assignment.current_week,
      currentSession: assignment.current_session,
    };
  } catch (error) {
    console.error('Erreur globale lors de la récupération des détails:', error);
    return null;
  }
};

/**
 * Met à jour la progression du client dans un programme assigné
 * 
 * @param assignmentId - ID de l'assignement
 * @param currentWeek - Semaine actuelle
 * @param currentSession - Séance actuelle
 * @returns true si succès, false sinon
 */
export const updateClientProgress = async (
  assignmentId: string,
  currentWeek: number,
  currentSession: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .update({
        current_week: currentWeek,
        current_session: currentSession,
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
