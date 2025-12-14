-- Migration: Fonction RPC atomique pour terminer une séance (VERSION 3 - FIX CAST UUID)
-- Date: 2025-12-13
-- Description: Correction du cast UUID pour exercise_id

-- ============================================================================
-- SUPPRIMER L'ANCIENNE VERSION
-- ============================================================================

DROP FUNCTION IF EXISTS complete_client_session_atomic(UUID, JSONB);

-- ============================================================================
-- FONCTION: complete_client_session_atomic (VERSION 3)
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
  v_session_status TEXT;
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
    cp.coach_id
  INTO 
    v_client_program_id,
    v_client_id,
    v_session_status,
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
  -- ÉTAPE 3 : SAUVEGARDER LES PERFORMANCES DE CHAQUE EXERCICE
  -- ========================================================================
  
  -- Parcourir chaque exercice dans les données de performance
  FOR v_exercise IN 
    SELECT * FROM jsonb_array_elements(p_performance_data->'exercises')
  LOOP
    -- Trouver le client_session_exercise correspondant
    -- ✅ FIX: Caster exercise_id en UUID pour la comparaison
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
        INSERT INTO client_exercise_performance (
          client_session_exercise_id,
          client_id,
          coach_id,
          set_number,
          reps_achieved,
          load_achieved,
          notes,
          performed_at
        )
        VALUES (
          v_client_session_exercise_id,
          v_client_id,
          v_coach_id,
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
  -- ÉTAPE 4 : RETOURNER LE RÉSULTAT
  -- ========================================================================
  
  RETURN json_build_object(
    'success', TRUE,
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

VERSION 3 - Fix cast UUID pour exercise_id.

Paramètres:
  - p_client_session_id: UUID de la séance à terminer
  - p_performance_data: JSONB contenant les données de performance
    Format attendu:
    {
      "exercises": [
        {
          "exercise_id": "uuid-as-string",
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
  - client_session_id: UUID de la séance (si succès)
  - error: Code d''erreur (si échec)
  - message: Message descriptif
  - detail: Détails de l''erreur (si échec)

Opérations effectuées (atomiques):
  1. Validation de la séance (existe, pas déjà complétée)
  2. Mise à jour du statut de la séance (completed)
  3. Sauvegarde des performances dans client_exercise_performance

Différences avec V2:
  - Cast explicite de exercise_id en UUID lors de la comparaison

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
  RAISE NOTICE '=== Migration complete_client_session_atomic V3 terminée ===';
  RAISE NOTICE 'Fonction mise à jour: complete_client_session_atomic';
  RAISE NOTICE 'Fix: Cast UUID pour exercise_id';
  RAISE NOTICE 'Utilisation depuis le frontend: supabase.rpc(''complete_client_session_atomic'', { ... })';
END $$;
