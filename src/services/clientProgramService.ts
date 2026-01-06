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

  // Trier les exercices par exercise_order
  const sortedExercises = [...exercises].sort((a, b) => 
    (a.exercise_order || 0) - (b.exercise_order || 0)
  );

  const mappedExercises: WorkoutExercise[] = sortedExercises.map((exercise, idx) => {
    // Utiliser la colonne details si disponible (nouveau format)
    let details: WorkoutExercise['details'];
    
    if (exercise.details) {
      // Nouveau format: utiliser directement la colonne details
      try {
        const parsedDetails = typeof exercise.details === 'string' 
          ? JSON.parse(exercise.details) 
          : exercise.details;
        details = Array.isArray(parsedDetails) ? parsedDetails : [];
      } catch (e) {
        console.error('Erreur lors du parsing de details:', e);
        details = [];
      }
    } else {
      // Ancien format: créer details à partir des colonnes individuelles
      const loadString = exercise.load ?? '';
      const loadMatch = loadString.match(/^([\d.]+)\s*([a-zA-Z%]+)?$/);
      const loadValue = loadMatch?.[1] ?? '';
      const loadUnit = (loadMatch?.[2]?.toLowerCase() ?? 'kg') as 'kg' | 'lbs' | '%';

      const setsCount = typeof exercise.sets === 'number' ? exercise.sets : parseInt(String(exercise.sets), 10) || 1;
      details = Array.from({ length: setsCount }, () => ({
        reps: exercise.reps ?? '',
        load: { value: loadValue, unit: loadUnit },
        tempo: exercise.tempo ?? '',
        rest: exercise.rest_time ?? '',
      }));
    }

    // Mapper les données de performance si disponibles
    const performanceData = Array.isArray(exercise.client_exercise_performance)
      ? exercise.client_exercise_performance.map((perf: any) => ({
          setNumber: perf.set_number,
          repsAchieved: perf.reps_achieved,
          loadAchieved: perf.load_achieved,
          rpe: perf.rpe,
          notes: perf.notes,
          performedAt: perf.performed_at,
        }))
      : [];

    return {
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
      isDetailed: true,
      details,
      performanceData, // Ajouter les données de performance
    };
  });

  return {
    id: session.id,
    name: session.name,
    exercises: mappedExercises,
    weekNumber: session.week_number ?? 1,
    sessionOrder: session.session_order ?? 1,
    status: session.status ?? 'pending',
    completedAt: session.completed_at ?? null,
    viewedByCoach: session.viewed_by_coach ?? false,
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
        status,
        completed_at,
        viewed_by_coach,
        client_session_exercises (
          id,
          exercise_id,
          exercise_order,
          sets,
          reps,
          load,
          tempo,
          rest_time,
          intensification,
          notes,
          details,
          exercises (
            id,
            name,
            image_url
          ),
          client_exercise_performance (
            id,
            set_number,
            reps_achieved,
            load_achieved,
            rpe,
            notes,
            performed_at
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
        status,
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
          details,
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

/**
 * Compte le nombre de séances complétées pour une semaine spécifique d'un programme
 * 
 * @param clientProgramId - ID du programme client
 * @param weekNumber - Numéro de la semaine
 * @returns Le nombre de séances complétées cette semaine
 */
export const getCompletedSessionsCountForWeek = async (
  clientProgramId: string,
  weekNumber: number
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('client_sessions')
      .select('id, status')
      .eq('client_program_id', clientProgramId)
      .eq('week_number', weekNumber)
      .eq('status', 'completed');

    if (error) {
      console.error('Erreur lors du comptage des séances complétées:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Erreur globale lors du comptage:', error);
    return 0;
  }
};

/**
 * Récupère les exercices d'une séance client spécifique
 * 
 * @param sessionId - ID de la séance client
 * @returns Liste des exercices de la séance
 */
export const getClientSessionExercises = async (sessionId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('client_session_exercises')
      .select('*')
      .eq('client_session_id', sessionId)
      .order('exercise_order', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des exercices de séance client:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur globale lors de la récupération des exercices:', error);
    return [];
  }
};

/**
 * Récupère un programme client par son ID avec tous ses détails
 * 
 * @param clientProgramId - ID du programme client
 * @returns Le programme complet ou null
 */
export const getClientProgramById = async (
  clientProgramId: string
): Promise<WorkoutProgram | null> => {
  try {
    console.time('[Performance] getClientProgramById - Total');
    console.time('[Performance] Fetch program + assignment');
    
    const { data: clientProgram, error: programError } = await supabase
      .from('client_programs')
      .select('id, name, objective, week_count, assignment_id')
      .eq('id', clientProgramId)
      .single();

    if (programError || !clientProgram) {
      console.error('Erreur lors de la récupération du programme client:', programError);
      return null;
    }

    // Récupérer l'assignation pour avoir le statut et la progression
    const { data: assignment } = await supabase
      .from('program_assignments')
      .select('id, current_week, current_session_order, status')
      .eq('id', clientProgram.assignment_id)
      .single();
    
    console.timeEnd('[Performance] Fetch program + assignment');
    console.time('[Performance] Fetch sessions with exercises');

    // Récupérer les séances
    const { data: sessions, error: sessionsError } = await supabase
      .from('client_sessions')
      .select(`
        id,
        client_program_id,
        name,
        week_number,
        session_order,
        status,
        client_session_exercises (
          id,
          exercise_id,
          sets,
          reps,
          load,
          tempo,
          rest_time,
          intensification,
          notes,
          details,
          exercise_order,
          exercises (
            id,
            name,
            image_url
          )
        )
      `)
      .eq('client_program_id', clientProgram.id)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });
    
    console.timeEnd('[Performance] Fetch sessions with exercises');

    if (sessionsError) {
      console.error('Erreur lors de la récupération des séances:', sessionsError);
      return null;
    }

    console.time('[Performance] Map sessions to WorkoutProgram');
    const sessionsByWeek: Record<number, WorkoutSession[]> = {};

    for (const session of sessions || []) {
      const weekNumber = session.week_number ?? 1;
      if (!sessionsByWeek[weekNumber]) {
        sessionsByWeek[weekNumber] = [];
      }

      sessionsByWeek[weekNumber].push(mapClientSessionToWorkoutSession(session));
    }
    console.timeEnd('[Performance] Map sessions to WorkoutProgram');
    console.timeEnd('[Performance] getClientProgramById - Total');

    return {
      id: clientProgram.id,
      name: clientProgram.name || 'Programme',
      objective: clientProgram.objective || '',
      weekCount: clientProgram.week_count || 0,
      sessionsByWeek,
      assignmentId: assignment?.id,
      currentWeek: assignment?.current_week ?? 1,
      currentSession: assignment?.current_session_order ?? 1,
      status: assignment?.status,
    } as WorkoutProgram;
  } catch (error) {
    console.error('Erreur globale lors de la récupération du programme client:', error);
    return null;
  }
};

/**
 * Met à jour un programme client existant
 * 
 * @param clientProgramId - ID du programme client
 * @param updates - Données à mettre à jour
 * @returns Le programme mis à jour ou null
 */
export const updateClientProgram = async (
  clientProgramId: string,
  updates: {
    name?: string;
    objective?: string;
    week_count?: number;
  }
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('client_programs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientProgramId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du programme client:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur globale lors de la mise à jour du programme client:', error);
    return null;
  }
};

/**
 * Met à jour une séance client existante
 * 
 * @param sessionId - ID de la séance client
 * @param updates - Données à mettre à jour
 * @returns La séance mise à jour ou null
 */
export const updateClientSession = async (
  sessionId: string,
  updates: {
    name?: string;
    week_number?: number;
    session_order?: number;
  }
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('client_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de la séance client:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur globale lors de la mise à jour de la séance client:', error);
    return null;
  }
};

/**
 * Crée une nouvelle séance client
 * 
 * @param sessionData - Données de la séance
 * @returns La séance créée ou null
 */
export const createClientSession = async (sessionData: {
  client_program_id: string;
  client_id: string;
  name: string;
  week_number: number;
  session_order: number;
}): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('client_sessions')
      .insert({
        ...sessionData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la séance client:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur globale lors de la création de la séance client:', error);
    return null;
  }
};

/**
 * Supprime une séance client
 * 
 * @param sessionId - ID de la séance client
 * @returns true si succès, false sinon
 */
export const deleteClientSession = async (sessionId: string): Promise<boolean> => {
  try {
    // Supprimer d'abord les exercices de la séance
    await supabase
      .from('client_session_exercises')
      .delete()
      .eq('client_session_id', sessionId);

    // Puis supprimer la séance
    const { error } = await supabase
      .from('client_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Erreur lors de la suppression de la séance client:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la suppression de la séance client:', error);
    return false;
  }
};

/**
 * Crée plusieurs exercices pour une séance client en batch
 * 
 * @param exercises - Liste des exercices à créer
 * @returns true si succès, false sinon
 */
export const createClientSessionExercisesBatch = async (
  exercises: Array<{
    client_session_id: string;
    client_id: string;
    exercise_id: string;
    sets?: string;
    reps?: string;
    load?: string;
    tempo?: string;
    rest_time?: string;
    intensification?: string;
    notes?: string;
    details?: any;
    exercise_order: number;
  }>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_session_exercises')
      .upsert(
        exercises.map((ex) => ({
          ...ex,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        {
          onConflict: 'client_session_id,exercise_order',
          ignoreDuplicates: false
        }
      );

    if (error) {
      console.error('Erreur lors de la création/mise à jour des exercices client en batch:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la création des exercices client:', error);
    return false;
  }
};

/**
 * Supprime tous les exercices d'une séance client
 * 
 * @param sessionId - ID de la séance client
 * @returns true si succès, false sinon
 */
export const deleteAllClientSessionExercises = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_session_exercises')
      .delete()
      .eq('client_session_id', sessionId);

    if (error) {
      console.error('Erreur lors de la suppression des exercices client:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la suppression des exercices client:', error);
    return false;
  }
};

/**
 * Marque toutes les séances complétées d'un programme comme vues par le coach
 * 
 * @param programId - ID du programme client
 * @returns true si succès, false sinon
 */
export const markCompletedSessionsAsViewed = async (programId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_sessions')
      .update({ viewed_by_coach: true })
      .eq('client_program_id', programId)
      .eq('status', 'completed');

    if (error) {
      console.error('Erreur lors de la mise à jour du statut viewed_by_coach:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la mise à jour du statut viewed_by_coach:', error);
    return false;
  }
};
