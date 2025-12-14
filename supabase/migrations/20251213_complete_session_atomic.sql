-- Migration: Fonction RPC atomique pour terminer une séance
-- Date: 2025-12-13
-- Description: Crée une fonction PostgreSQL pour terminer une séance de manière atomique
--              Toutes les opérations (marquer séance complétée, sauvegarder performances) 
--              sont exécutées dans une seule transaction.

-- ============================================================================
-- FONCTION: complete_client_session_atomic
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_client_session_atomic(
  p_client_session_id UUID,
  p_performance_data JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_program_id UUID;
  v_client_id UUID;
  v_coach_id UUID;
  v_assignment_id UUID;
  v_week_number INT;
  v_session_name TEXT;
  v_session_status TEXT;
  v_performance_log_id UUID;
  v_exercise JSONB;
  v_client_session_exercise_id UUID;
  v_set JSONB;
  v_set_index INT;
BEGIN
  -- ========================================================================
  -- ÉTAPE 1 : VALIDATIONS
  -- ========================================================================
  
  -- Vérifier que la séance existe et récupérer ses informations
  SELECT 
    cs.client_program_id,
    cs.client_id,
    cs.status,
    cs.week_number,
    cs.name,
    cp.assignment_id,
    cp.coach_id
  INTO 
    v_client_program_id,
    v_client_id,
    v_session_status,
    v_week_number,
    v_session_name,
    v_assignment_id,
    v_coach_id
  FROM client_sessions cs
  JOIN client_programs cp ON cp.id = cs.client_program_id
  WHERE cs.id = p_client_session_id;
  
  -- Si la séance n'existe pas
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'SESSION_NOT_FOUND',
      'message', 'La séance n''existe pas'
    );
  END IF;
  
  -- Si la séance est déjà complétée
  IF v_session_status = 'completed' THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'SESSION_ALREADY_COMPLETED',
      'message', 'La séance est déjà complétée'
    );
  END IF;
  
  -- ========================================================================
  -- ÉTAPE 2 : MARQUER LA SÉANCE COMME COMPLÉTÉE
  -- ========================================================================
  
  UPDATE client_sessions
  SET 
    status = 'completed',
    completed_at = NOW(),
    viewed_by_coach = FALSE,
    updated_at = NOW()
  WHERE id = p_client_session_id;
  
  -- ========================================================================
  -- ÉTAPE 3 : CRÉER LE LOG DE PERFORMANCE PRINCIPAL
  -- ========================================================================
  
  INSERT INTO client_exercise_performance (
    client_id,
    coach_id,
    client_session_id,
    program_assignment_id,
    week_number,
    session_name,
    performed_at,
    created_at,
    updated_at
  )
  VALUES (
    v_client_id,
    v_coach_id,
    p_client_session_id,
    v_assignment_id,
    v_week_number,
    v_session_name,
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_performance_log_id;
  
  -- ========================================================================
  -- ÉTAPE 4 : SAUVEGARDER LES PERFORMANCES DE CHAQUE EXERCICE
  -- ========================================================================
  
  -- Parcourir chaque exercice dans les données de performance
  FOR v_exercise IN 
    SELECT * FROM jsonb_array_elements(p_performance_data->'exercises')
  LOOP
    -- Trouver le client_session_exercise correspondant
    SELECT id INTO v_client_session_exercise_id
    FROM client_session_exercises
    WHERE client_session_id = p_client_session_id
      AND exercise_id = (v_exercise->>'exercise_id')::UUID
    LIMIT 1;
    
    -- Si l'exercice existe dans la séance
    IF FOUND THEN
      -- Parcourir chaque série de l'exercice
      v_set_index := 0;
      FOR v_set IN 
        SELECT * FROM jsonb_array_elements(v_exercise->'sets')
      LOOP
        v_set_index := v_set_index + 1;
        
        -- Insérer la performance de la série
        -- Note: La table performance_logs doit exister avec ces colonnes
        -- Si elle n'existe pas, cette partie peut être adaptée selon votre schéma
        INSERT INTO performance_logs (
          client_session_exercise_id,
          client_id,
          set_number,
          reps_achieved,
          load_achieved,
          notes,
          performed_at
        )
        VALUES (
          v_client_session_exercise_id,
          v_client_id,
          v_set_index,
          NULLIF(v_set->>'reps', '')::INT,
          NULLIF(v_set->>'load', ''),
          NULLIF(v_set->>'comment', ''),
          NOW()
        )
        ON CONFLICT (client_session_exercise_id, set_number) 
        DO UPDATE SET
          reps_achieved = EXCLUDED.reps_achieved,
          load_achieved = EXCLUDED.load_achieved,
          notes = EXCLUDED.notes,
          performed_at = EXCLUDED.performed_at;
      END LOOP;
    END IF;
  END LOOP;
  
  -- ========================================================================
  -- ÉTAPE 5 : RETOURNER LE RÉSULTAT
  -- ========================================================================
  
  RETURN json_build_object(
    'success', TRUE,
    'performance_log_id', v_performance_log_id,
    'client_session_id', p_client_session_id,
    'message', 'Séance complétée avec succès'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, PostgreSQL fait automatiquement un ROLLBACK
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLSTATE,
      'message', format('Erreur lors de la complétion de la séance : %s', SQLERRM),
      'detail', SQLERRM
    );
END;
$$;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION complete_client_session_atomic IS 
'Termine une séance client de manière atomique (transaction unique).
Cette fonction garantit que soit toutes les opérations réussissent, soit aucune.

Paramètres:
  - p_client_session_id: UUID de la séance à terminer
  - p_performance_data: JSONB contenant les données de performance
    Format attendu:
    {
      "exercises": [
        {
          "exercise_id": "uuid",
          "sets": [
            {
              "reps": "10",
              "load": "50",
              "comment": "Facile"
            }
          ]
        }
      ]
    }

Retourne un JSON avec:
  - success: true/false
  - performance_log_id: UUID du log créé (si succès)
  - client_session_id: UUID de la séance (si succès)
  - error: Code d''erreur (si échec)
  - message: Message descriptif
  - detail: Détails de l''erreur (si échec)

Opérations effectuées (atomiques):
  1. Validation de la séance (existe, pas déjà complétée)
  2. Mise à jour du statut de la séance (completed)
  3. Création du log de performance principal
  4. Sauvegarde des performances de chaque exercice et série

Avantages:
  - Transaction atomique (tout ou rien)
  - Un seul appel réseau depuis le frontend
  - Pas de désynchronisation possible
  - Meilleure performance (moins de latence)';

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Autoriser les utilisateurs authentifiés à appeler cette fonction
GRANT EXECUTE ON FUNCTION complete_client_session_atomic TO authenticated;

-- ============================================================================
-- NOTIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Migration complete_client_session_atomic terminée ===';
  RAISE NOTICE 'Fonction créée: complete_client_session_atomic';
  RAISE NOTICE 'Cette fonction permet de terminer une séance de manière atomique';
  RAISE NOTICE 'Utilisation depuis le frontend: supabase.rpc(''complete_client_session_atomic'', { ... })';
END $$;
