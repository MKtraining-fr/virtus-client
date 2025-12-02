
import { supabase } from './supabase';
import { WorkoutProgram, WorkoutSession, WorkoutExercise } from '../types';

/**
 * Crée un template de programme complet (programme, séances, exercices) dans les tables templates.
 * @param program - L'objet WorkoutProgram contenant la structure complète.
 * @param coachId - L'ID du coach (ou du client agissant comme créateur).
 * @returns L'ID du template de programme créé.
 */
export const createProgramTemplate = async (
  program: WorkoutProgram,
  creatorId: string
): Promise<string> => {
  try {
    // Étape 1: Créer le template de programme dans la table `programs`
    const { data: programTemplateData, error: programTemplateError } = await supabase
      .from('program_templates')
      .insert({
        coach_id: creatorId,
        name: program.name,
        objective: program.objective,
        week_count: program.weekCount,
        // Template créé par le client
      })
      .select('id')
      .single();

    if (programTemplateError) {
      console.error('Erreur lors de la création du template de programme:', programTemplateError);
      throw programTemplateError;
    }
    const programTemplateId = programTemplateData.id;

    // Étape 2: Créer les templates de séances et d'exercices
    for (const week in program.sessionsByWeek) {
      const weekNumber = parseInt(week, 10);
      const sessions = program.sessionsByWeek[weekNumber];

      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];

        const { data: sessionTemplateData, error: sessionTemplateError } = await supabase
          .from('session_templates')
          .insert({
            program_template_id: programTemplateId,
            coach_id: creatorId,
            name: session.name,
            week_number: weekNumber,
            session_order: i + 1,
          })
          .select('id')
          .single();

        if (sessionTemplateError) {
          console.error('Erreur lors de la création du template de séance:', sessionTemplateError);
          throw sessionTemplateError;
        }
        const sessionTemplateId = sessionTemplateData.id;

        for (let j = 0; j < session.exercises.length; j++) {
          const exercise = session.exercises[j];

          // Gestion des séries simples vs. détaillées
          if (exercise.isDetailed && exercise.details) {
            // Mode détaillé : une entrée par série
            for (let k = 0; k < exercise.details.length; k++) {
              const detail = exercise.details[k];
              await insertSessionExercise(sessionTemplateId, creatorId, exercise, j + 1, k + 1, detail);
            }
          } else {
            // Mode simple : une seule entrée avec le nombre de séries
            await insertSessionExercise(sessionTemplateId, creatorId, exercise, j + 1);
          }
        }
      }
    }

    return programTemplateId;

  } catch (error) {
    console.error('Erreur globale lors de la création du template de programme:', error);
    // Implémenter une logique de rollback ici si nécessaire
    throw error;
  }
};

/**
 * Insère un exercice de séance (template) dans la base de données.
 * Gère la complexité des champs `load` et `intensification`.
 */
const insertSessionExercise = async (
  sessionTemplateId: string,
  creatorId: string,
  exercise: WorkoutExercise,
  order: number,
  setNumber: number | null = null, // Null pour le mode simple
  detail: any = null // `any` pour correspondre à la structure de `details`
) => {
  const loadValue = detail ? detail.load.value : (exercise.details?.[0]?.load.value || '');
  const loadUnit = detail ? detail.load.unit : (exercise.details?.[0]?.load.unit || 'kg');

  const dataToInsert = {
    session_template_id: sessionTemplateId,
    exercise_id: exercise.exerciseId,
    coach_id: creatorId,
    exercise_order: order,
    sets: setNumber ? 1 : (parseInt(exercise.sets, 10) || 1),
    reps: detail ? detail.reps : (exercise.details?.[0]?.reps || exercise.sets),
    load: `${loadValue} ${loadUnit}`.trim(),
    tempo: detail ? detail.tempo : (exercise.details?.[0]?.tempo || ''),
    rest_time: detail ? detail.rest : (exercise.details?.[0]?.rest || ''),
    intensification: JSON.stringify(exercise.intensification),
    notes: exercise.notes,
    // Si en mode détaillé, on peut ajouter le numéro de la série dans les notes
    ...(setNumber && { notes: `Série ${setNumber}${exercise.notes ? ` - ${exercise.notes}` : ''}` }),
  };

  const { error } = await supabase.from('session_exercise_templates').insert(dataToInsert);

  if (error) {
    console.error("Erreur lors de l'insertion de l'exercice de template:", error);
    throw error;
  }
};
