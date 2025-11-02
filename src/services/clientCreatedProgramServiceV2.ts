import { supabase } from './supabase';
import { WorkoutProgram, WorkoutExercise } from '../types';

/**
 * Sauvegarde un programme ou une séance créé(e) par un client.
 * Utilise les tables client_created_* pour éviter les conflits avec les politiques RLS.
 * @param program - L'objet WorkoutProgram complet.
 * @param clientId - L'ID du client.
 * @param coachId - L'ID du coach affilié (optionnel).
 * @returns boolean - Succès ou échec.
 */
export const saveClientCreatedWorkout = async (
  program: WorkoutProgram,
  clientId: string,
  coachId?: string
): Promise<boolean> => {
  try {
    // Étape 1: Créer le programme dans client_created_programs
    const { data: programData, error: programError } = await supabase
      .from('client_created_programs')
      .insert({
        client_id: clientId,
        coach_id: coachId,
        name: program.name,
        objective: program.objective || null,
        week_count: program.weekCount || 1,
      })
      .select('id')
      .single();

    if (programError) {
      console.error('Erreur lors de la création du programme:', programError);
      throw programError;
    }

    const programId = programData.id;

    // Étape 2: Créer les séances et exercices
    for (const week in program.sessionsByWeek) {
      const weekNumber = parseInt(week, 10);
      const sessions = program.sessionsByWeek[weekNumber];

      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];

        // Créer la séance
        const { data: sessionData, error: sessionError } = await supabase
          .from('client_created_sessions')
          .insert({
            program_id: programId,
            client_id: clientId,
            coach_id: coachId,
            name: session.name,
            week_number: weekNumber,
            session_order: i + 1,
          })
          .select('id')
          .single();

        if (sessionError) {
          console.error('Erreur lors de la création de la séance:', sessionError);
          throw sessionError;
        }

        const sessionId = sessionData.id;

        // Créer les exercices de la séance
        for (let j = 0; j < session.exercises.length; j++) {
          const exercise = session.exercises[j];

          // Gestion des séries simples vs. détaillées
          if (exercise.isDetailed && exercise.details) {
            // Mode détaillé : une entrée par série
            for (let k = 0; k < exercise.details.length; k++) {
              const detail = exercise.details[k];
              await insertSessionExercise(
                sessionId,
                clientId,
                coachId,
                exercise,
                j + 1,
                k + 1,
                detail
              );
            }
          } else {
            // Mode simple : une seule entrée avec le nombre de séries
            await insertSessionExercise(
              sessionId,
              clientId,
              coachId,
              exercise,
              j + 1
            );
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Erreur globale lors de la sauvegarde du programme client:', error);
    return false;
  }
};

/**
 * Insère un exercice de séance dans la base de données.
 * Gère la complexité des champs `load` et `intensification`.
 */
const insertSessionExercise = async (
  sessionId: string,
  clientId: string,
  coachId: string | undefined,
  exercise: WorkoutExercise,
  order: number,
  setNumber: number | null = null, // Null pour le mode simple
  detail: any = null // `any` pour correspondre à la structure de `details`
): Promise<void> => {
  // Récupérer les valeurs depuis detail ou exercise.details[0]
  const loadValue = detail 
    ? detail.load.value 
    : (exercise.details?.[0]?.load.value || '');
  const loadUnit = detail 
    ? detail.load.unit 
    : (exercise.details?.[0]?.load.unit || 'kg');
  
  // Formater la charge (vide si pas de valeur)
  const load = loadValue ? `${loadValue} ${loadUnit}`.trim() : null;

  // Récupérer le temps de repos et retirer le "s" par défaut s'il est seul
  let restTime = detail 
    ? detail.rest 
    : (exercise.details?.[0]?.rest || '');
  
  // Si le temps de repos est juste "s", on le met à null
  if (restTime === 's' || restTime === '') {
    restTime = null;
  }

  const dataToInsert = {
    session_id: sessionId,
    exercise_id: exercise.exerciseId,
    client_id: clientId,
    coach_id: coachId || null,
    exercise_order: order,
    sets: setNumber ? 1 : (parseInt(exercise.sets, 10) || 1),
    reps: detail ? detail.reps : (exercise.details?.[0]?.reps || exercise.sets),
    load: load,
    tempo: detail ? detail.tempo : (exercise.details?.[0]?.tempo || null),
    rest_time: restTime,
    intensification: exercise.intensification ? JSON.stringify(exercise.intensification) : null,
    notes: exercise.notes || null,
    // Si en mode détaillé, on peut ajouter le numéro de la série dans les notes
    ...(setNumber && { 
      notes: `Série ${setNumber}${exercise.notes ? ` - ${exercise.notes}` : ''}` 
    }),
  };

  const { error } = await supabase
    .from('client_created_session_exercises')
    .insert(dataToInsert);

  if (error) {
    console.error("Erreur lors de l'insertion de l'exercice:", error);
    throw error;
  }
};
