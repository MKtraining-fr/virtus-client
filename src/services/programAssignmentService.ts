import { supabase } from './supabase';

/**
 * Service pour l'attribution de programmes par les coachs aux clients
 * Implémente le système hybride : duplication du template dans client_created_*
 */

export interface ProgramAssignment {
  id: string;
  program_id: string; // Template original
  client_program_id: string; // Copie dans client_created_programs
  client_id: string;
  coach_id: string;
  start_date: string;
  end_date?: string;
  current_week: number;
  current_session: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

/**
 * Attribue un programme template à un client
 * Duplique le template dans client_created_* et crée un program_assignment
 * 
 * @param templateId - ID du template (table programs)
 * @param clientId - ID du client
 * @param coachId - ID du coach
 * @param startDate - Date de début (format ISO)
 * @returns ID du programme créé ou null en cas d'erreur
 */
export const assignProgramToClient = async (
  templateId: string,
  clientId: string,
  coachId: string,
  startDate: string
): Promise<string | null> => {
  try {
    // Étape 1 : Récupérer le template
    const { data: template, error: templateError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.error('Erreur lors de la récupération du template:', templateError);
      return null;
    }

    // Étape 2 : Dupliquer le programme dans client_created_programs
    const { data: clientProgram, error: programError } = await supabase
      .from('client_created_programs')
      .insert({
        client_id: clientId,
        coach_id: coachId,
        name: template.name,
        objective: template.objective,
        week_count: template.week_count,
        source_type: 'coach_assigned',
        program_template_id: templateId,
      })
      .select('id')
      .single();

    if (programError || !clientProgram) {
      console.error('Erreur lors de la création du programme client:', programError);
      return null;
    }

    const clientProgramId = clientProgram.id;

    // Étape 3 : Récupérer les séances du template
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('program_id', templateId)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });

    if (sessionsError) {
      console.error('Erreur lors de la récupération des séances:', sessionsError);
      return null;
    }

    // Étape 4 : Dupliquer les séances
    for (const session of sessions || []) {
      const { data: clientSession, error: sessionError } = await supabase
        .from('client_created_sessions')
        .insert({
          program_id: clientProgramId,
          client_id: clientId,
          coach_id: coachId,
          name: session.name,
          week_number: session.week_number,
          session_order: session.session_order,
        })
        .select('id')
        .single();

      if (sessionError || !clientSession) {
        console.error('Erreur lors de la création de la séance client:', sessionError);
        continue;
      }

      // Étape 5 : Récupérer les exercices de la séance
      const { data: exercises, error: exercisesError } = await supabase
        .from('session_exercises')
        .select('*')
        .eq('session_id', session.id)
        .order('exercise_order', { ascending: true });

      if (exercisesError) {
        console.error('Erreur lors de la récupération des exercices:', exercisesError);
        continue;
      }

      // Étape 6 : Dupliquer les exercices
      for (const exercise of exercises || []) {
        const { error: exerciseError } = await supabase
          .from('client_created_session_exercises')
          .insert({
            session_id: clientSession.id,
            exercise_id: exercise.exercise_id,
            client_id: clientId,
            coach_id: coachId,
            exercise_order: exercise.exercise_order,
            sets: exercise.sets,
            reps: exercise.reps,
            load: exercise.load,
            tempo: exercise.tempo,
            rest_time: exercise.rest_time,
            intensification: exercise.intensification,
            notes: exercise.notes,
          });

        if (exerciseError) {
          console.error("Erreur lors de la création de l'exercice client:", exerciseError);
        }
      }
    }

    // Étape 7 : Créer le program_assignment pour la traçabilité
    const { error: assignmentError } = await supabase
      .from('program_assignments')
      .insert({
        program_id: templateId,
        client_program_id: clientProgramId,
        client_id: clientId,
        coach_id: coachId,
        start_date: startDate,
        current_week: 1,
        current_session: 1,
        status: 'active',
      });

    if (assignmentError) {
      console.error("Erreur lors de la création de l'assignment:", assignmentError);
      // On continue quand même car le programme a été créé
    }

    return clientProgramId;
  } catch (error) {
    console.error("Erreur globale lors de l'attribution du programme:", error);
    return null;
  }
};

/**
 * Récupère tous les assignments d'un coach
 * @param coachId - ID du coach
 * @returns Liste des assignments
 */
export const getCoachAssignments = async (
  coachId: string
): Promise<ProgramAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des assignments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};

/**
 * Récupère tous les assignments d'un client
 * @param clientId - ID du client
 * @returns Liste des assignments
 */
export const getClientAssignments = async (
  clientId: string
): Promise<ProgramAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des assignments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};

/**
 * Met à jour le statut d'un assignment
 * @param assignmentId - ID de l'assignment
 * @param status - Nouveau statut
 * @returns Succès ou échec
 */
export const updateAssignmentStatus = async (
  assignmentId: string,
  status: 'active' | 'paused' | 'completed' | 'cancelled'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', assignmentId);

    if (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale:', error);
    return false;
  }
};

/**
 * Met à jour la progression d'un assignment
 * @param assignmentId - ID de l'assignment
 * @param currentWeek - Semaine actuelle
 * @param currentSession - Séance actuelle
 * @returns Succès ou échec
 */
export const updateAssignmentProgress = async (
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
        updated_at: new Date().toISOString() 
      })
      .eq('id', assignmentId);

    if (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale:', error);
    return false;
  }
};
