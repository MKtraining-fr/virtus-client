
import { supabase } from './supabase';
import { WorkoutProgram } from '../types';
import { createProgramTemplate } from './programTemplateService';

/**
 * Sauvegarde un programme créé par un client.
 * Crée d'abord un template, puis une instance assignée au client.
 * @param program - L'objet WorkoutProgram complet.
 * @param clientId - L'ID du client.
 * @param coachId - L'ID du coach (optionnel).
 * @returns boolean - Succès ou échec.
 */
export const saveClientWorkout = async (
  program: WorkoutProgram,
  clientId: string,
  coachId?: string
): Promise<boolean> => {
  try {
    // Le créateur est le client lui-même
    const creatorId = clientId;

    // Étape 1: Créer le template de programme complet.
    // Le template est marqué comme non public (is_public: false).
    const programTemplateId = await createProgramTemplate(program, creatorId);

    // Étape 2: Créer l'instance du programme pour le client dans `client_programs`.
    const { error: clientProgramError } = await supabase
      .from('client_programs')
      .insert({
        program_template_id: programTemplateId,
        client_id: clientId,
        coach_id: coachId, // Le coach affilié peut voir ce programme
        name: program.name,
        objective: program.objective,
        week_count: program.weekCount,
        status: 'active',
        assigned_at: new Date().toISOString(),
      })
      .single();

    if (clientProgramError) {
      console.error("Erreur lors de l'assignation du programme au client:", clientProgramError);
      throw clientProgramError;
    }

    // Note: La création des `client_sessions` et `client_session_exercises`
    // pourrait être gérée par des triggers SQL ou des fonctions Edge dans Supabase
    // lors de l'insertion dans `client_programs` pour automatiser la copie depuis les templates.
    // Pour l'instant, on suppose que l'interface lira les templates via l'instance.

    return true;

  } catch (error) {
    console.error('Erreur globale lors de la sauvegarde du programme client:', error);
    return false;
  }
};
