-- Migration: Modifier assign_program_atomic pour copier la colonne details
-- Date: 2025-11-25
-- Description: Permet de copier les détails par série lors de l'assignation d'un programme

CREATE OR REPLACE FUNCTION assign_program_atomic(
  p_template_id UUID,
  p_client_id UUID,
  p_coach_id UUID,
  p_start_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_assignment_id UUID;
  v_client_program_id UUID;
  v_session_template RECORD;
  v_client_session_id UUID;
  v_exercise_template RECORD;
  v_template_program RECORD;
  v_coach_client_relation BOOLEAN;
  v_end_date DATE;
BEGIN
  -- Vérification de la relation coach-client
  SELECT EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = p_client_id 
      AND coach_id = p_coach_id 
      AND role = 'client'
  ) INTO v_coach_client_relation;
  
  IF NOT v_coach_client_relation THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'INVALID_CLIENT_COACH_RELATION',
      'message', format('Le client %s n''est pas rattaché au coach %s', p_client_id, p_coach_id)
    );
  END IF;

  -- Récupération du template
  SELECT * INTO v_template_program
  FROM public.program_templates
  WHERE id = p_template_id AND coach_id = p_coach_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'TEMPLATE_NOT_FOUND',
      'message', format('Le template de programme %s n''existe pas ou n''appartient pas au coach %s', p_template_id, p_coach_id)
    );
  END IF;

  -- Vérification des doublons
  IF EXISTS (
    SELECT 1 FROM public.program_assignments
    WHERE program_template_id = p_template_id
      AND client_id = p_client_id
      AND start_date = p_start_date
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'DUPLICATE_ASSIGNMENT',
      'message', 'Ce programme est déjà assigné à ce client à cette date'
    );
  END IF;

  -- Calcul de la date de fin
  v_end_date := p_start_date + (v_template_program.week_count * 7);

  -- Création de l'assignation
  INSERT INTO public.program_assignments (
    program_template_id, client_id, coach_id, start_date, end_date,
    status, current_week, current_session_order, created_at, updated_at
  ) VALUES (
    p_template_id, p_client_id, p_coach_id, p_start_date, v_end_date,
    CASE WHEN p_start_date <= CURRENT_DATE THEN 'active' ELSE 'upcoming' END,
    1, 1, NOW(), NOW()
  ) RETURNING id INTO v_assignment_id;

  -- Création du programme client
  INSERT INTO public.client_programs (
    assignment_id, client_id, coach_id, name, objective, week_count,
    created_at, updated_at
  ) VALUES (
    v_assignment_id, p_client_id, p_coach_id,
    v_template_program.name, v_template_program.objective, v_template_program.week_count,
    NOW(), NOW()
  ) RETURNING id INTO v_client_program_id;

  -- Copie des séances
  FOR v_session_template IN
    SELECT * FROM public.session_templates
    WHERE program_template_id = p_template_id
    ORDER BY week_number, session_order
  LOOP
    INSERT INTO public.client_sessions (
      client_program_id, client_id, name, week_number, session_order,
      status, created_at, updated_at
    ) VALUES (
      v_client_program_id, p_client_id, v_session_template.name,
      v_session_template.week_number, v_session_template.session_order,
      'pending', NOW(), NOW()
    ) RETURNING id INTO v_client_session_id;

    -- Copie des exercices avec la colonne details
    FOR v_exercise_template IN
      SELECT * FROM public.session_exercise_templates
      WHERE session_template_id = v_session_template.id
      ORDER BY exercise_order
    LOOP
      -- ✅ CORRECTION: Ajout de la colonne details
      INSERT INTO public.client_session_exercises (
        client_session_id, exercise_id, client_id, exercise_order,
        sets, reps, load, tempo, rest_time, intensification, notes, details,
        created_at, updated_at
      ) VALUES (
        v_client_session_id, v_exercise_template.exercise_id, p_client_id,
        v_exercise_template.exercise_order, v_exercise_template.sets,
        v_exercise_template.reps, v_exercise_template.load,
        v_exercise_template.tempo, v_exercise_template.rest_time,
        v_exercise_template.intensification, v_exercise_template.notes,
        v_exercise_template.details, -- ✅ Copier la colonne details
        NOW(), NOW()
      );
    END LOOP;
  END LOOP;

  RETURN json_build_object(
    'success', TRUE,
    'assignment_id', v_assignment_id,
    'client_program_id', v_client_program_id,
    'message', format('Programme "%s" assigné avec succès au client', v_template_program.name)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLSTATE,
      'message', format('Erreur lors de l''assignation : %s', SQLERRM)
    );
END;
$$;
