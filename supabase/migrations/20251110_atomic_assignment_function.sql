-- Migration: Fonction atomique pour l'assignement de programmes
-- Date: 2025-11-10
-- Description: Crée une fonction PostgreSQL pour garantir l'atomicité des assignements

-- ============================================================================
-- 1. Fonction pour assigner un programme à un client (atomique)
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_program_to_client_atomic(
  p_template_id UUID,
  p_client_id UUID,
  p_coach_id UUID,
  p_start_date DATE
)
RETURNS JSON AS $$
DECLARE
  v_client_program_id UUID;
  v_assignment_id UUID;
  v_session_record RECORD;
  v_new_session_id UUID;
  v_exercise_record RECORD;
  v_template_program RECORD;
  v_coach_client_relation BOOLEAN;
BEGIN
  -- Vérifier que le coach et le client sont bien liés
  SELECT EXISTS (
    SELECT 1 FROM clients 
    WHERE id = p_client_id 
    AND coach_id = p_coach_id
  ) INTO v_coach_client_relation;

  IF NOT v_coach_client_relation THEN
    RAISE EXCEPTION 'Le client % n''est pas rattaché au coach %', p_client_id, p_coach_id;
  END IF;

  -- Vérifier que le template existe
  SELECT * INTO v_template_program
  FROM programs
  WHERE id = p_template_id AND coach_id = p_coach_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Le template de programme % n''existe pas ou n''appartient pas au coach %', p_template_id, p_coach_id;
  END IF;

  -- 1. Dupliquer le programme template dans client_created_programs
  INSERT INTO client_created_programs (
    client_id,
    coach_id,
    name,
    objective,
    week_count,
    source_type,
    program_template_id,
    created_at,
    updated_at
  )
  VALUES (
    p_client_id,
    p_coach_id,
    v_template_program.name,
    v_template_program.objective,
    v_template_program.week_count,
    'coach_assigned',
    p_template_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_client_program_id;

  -- 2. Créer l'assignement dans program_assignments
  INSERT INTO program_assignments (
    program_id,
    client_program_id,
    client_id,
    coach_id,
    start_date,
    current_week,
    current_session,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_template_id,
    v_client_program_id,
    p_client_id,
    p_coach_id,
    p_start_date,
    1,
    1,
    'active',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_assignment_id;

  -- 3. Dupliquer toutes les séances du template
  FOR v_session_record IN 
    SELECT * FROM sessions 
    WHERE program_id = p_template_id
    ORDER BY week_number, session_order
  LOOP
    INSERT INTO client_created_sessions (
      program_id,
      client_id,
      coach_id,
      name,
      week_number,
      session_order,
      created_at,
      updated_at
    )
    VALUES (
      v_client_program_id,
      p_client_id,
      p_coach_id,
      v_session_record.name,
      v_session_record.week_number,
      v_session_record.session_order,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_new_session_id;

    -- 4. Dupliquer tous les exercices de la séance
    FOR v_exercise_record IN
      SELECT * FROM session_exercises
      WHERE session_id = v_session_record.id
      ORDER BY exercise_order
    LOOP
      INSERT INTO client_created_session_exercises (
        session_id,
        client_id,
        coach_id,
        exercise_id,
        exercise_order,
        sets,
        reps,
        load,
        tempo,
        rest_time,
        intensification,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        v_new_session_id,
        p_client_id,
        p_coach_id,
        v_exercise_record.exercise_id,
        v_exercise_record.exercise_order,
        v_exercise_record.sets,
        v_exercise_record.reps,
        v_exercise_record.load,
        v_exercise_record.tempo,
        v_exercise_record.rest_time,
        v_exercise_record.intensification,
        v_exercise_record.notes,
        NOW(),
        NOW()
      );
    END LOOP;
  END LOOP;

  -- Retourner les IDs créés
  RETURN json_build_object(
    'success', TRUE,
    'assignment_id', v_assignment_id,
    'client_program_id', v_client_program_id,
    'message', 'Programme assigné avec succès'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, PostgreSQL fait automatiquement un ROLLBACK
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'message', 'Échec de l''assignement du programme'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Commentaires sur la fonction
-- ============================================================================

COMMENT ON FUNCTION assign_program_to_client_atomic IS 
'Assigne un programme template à un client de manière atomique.
Cette fonction garantit que soit toutes les opérations réussissent, soit aucune.
Elle vérifie également que le coach et le client sont bien liés.

Paramètres:
  - p_template_id: ID du programme template (table programs)
  - p_client_id: ID du client
  - p_coach_id: ID du coach
  - p_start_date: Date de début du programme

Retourne un JSON avec:
  - success: true/false
  - assignment_id: ID de l''assignement créé (si succès)
  - client_program_id: ID du programme dupliqué (si succès)
  - error: Message d''erreur (si échec)
  - message: Message descriptif';

-- ============================================================================
-- 3. Fonction pour marquer un programme comme terminé
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_program_assignment(
  p_assignment_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE program_assignments
  SET status = 'completed',
      updated_at = NOW()
  WHERE id = p_assignment_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_program_assignment IS
'Marque un assignement de programme comme terminé.
Retourne TRUE si l''assignement a été trouvé et mis à jour, FALSE sinon.';

-- ============================================================================
-- 4. Fonction pour mettre à jour la progression d'un client
-- ============================================================================

CREATE OR REPLACE FUNCTION update_client_progression(
  p_assignment_id UUID,
  p_current_week INTEGER,
  p_current_session INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE program_assignments
  SET current_week = p_current_week,
      current_session = p_current_session,
      updated_at = NOW()
  WHERE id = p_assignment_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_client_progression IS
'Met à jour la progression d''un client dans son programme assigné.
Retourne TRUE si la mise à jour a réussi, FALSE sinon.';

-- ============================================================================
-- 5. Tests de la fonction
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Migration des fonctions atomiques terminée ===';
  RAISE NOTICE 'Fonction créée: assign_program_to_client_atomic';
  RAISE NOTICE 'Fonction créée: complete_program_assignment';
  RAISE NOTICE 'Fonction créée: update_client_progression';
  RAISE NOTICE 'Ces fonctions garantissent l''atomicité des opérations';
END $$;
