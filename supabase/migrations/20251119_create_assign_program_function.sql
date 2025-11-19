-- Migration : Fonction RPC pour l'assignation atomique de programmes
-- Date : 2025-11-19
-- Description : Crée la fonction PostgreSQL qui gère la duplication transactionnelle des programmes

-- ============================================================================
-- FONCTION PRINCIPALE : assign_program_atomic
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_program_atomic(
    p_template_id UUID,
    p_client_id UUID,
    p_coach_id UUID,
    p_start_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Exécute avec les privilèges du propriétaire de la fonction
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
    -- ========================================================================
    -- ÉTAPE 1 : VALIDATIONS
    -- ========================================================================
    
    -- Vérifier que le client est bien rattaché au coach
    SELECT EXISTS (
        SELECT 1 FROM profiles 
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

    -- Récupérer le template de programme et vérifier qu'il appartient au coach
    SELECT * INTO v_template_program
    FROM program_templates
    WHERE id = p_template_id AND coach_id = p_coach_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'TEMPLATE_NOT_FOUND',
            'message', format('Le template de programme %s n''existe pas ou n''appartient pas au coach %s', p_template_id, p_coach_id)
        );
    END IF;

    -- Vérifier qu'il n'existe pas déjà une assignation active pour ce template et ce client à cette date
    IF EXISTS (
        SELECT 1 FROM program_assignments
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

    -- ========================================================================
    -- ÉTAPE 2 : CRÉATION DE L'ASSIGNATION
    -- ========================================================================
    
    -- Calculer la date de fin (start_date + week_count semaines)
    v_end_date := p_start_date + (v_template_program.week_count * 7);

    -- Créer l'entrée dans program_assignments
    INSERT INTO program_assignments (
        program_template_id,
        client_id,
        coach_id,
        start_date,
        end_date,
        status,
        current_week,
        current_session_order,
        created_at,
        updated_at
    )
    VALUES (
        p_template_id,
        p_client_id,
        p_coach_id,
        p_start_date,
        v_end_date,
        CASE 
            WHEN p_start_date <= CURRENT_DATE THEN 'active'
            ELSE 'upcoming'
        END,
        1,
        1,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_assignment_id;

    -- ========================================================================
    -- ÉTAPE 3 : DUPLICATION DU PROGRAMME (Template → Instance Client)
    -- ========================================================================
    
    -- Créer le programme client (copie du template)
    INSERT INTO client_programs (
        assignment_id,
        client_id,
        coach_id,
        name,
        objective,
        week_count,
        created_at,
        updated_at
    )
    VALUES (
        v_assignment_id,
        p_client_id,
        p_coach_id,
        v_template_program.name,
        v_template_program.objective,
        v_template_program.week_count,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_client_program_id;

    -- ========================================================================
    -- ÉTAPE 4 : DUPLICATION DES SÉANCES
    -- ========================================================================
    
    -- Pour chaque séance du template, créer une séance client
    FOR v_session_template IN 
        SELECT * FROM session_templates 
        WHERE program_template_id = p_template_id
        ORDER BY week_number, session_order
    LOOP
        -- Créer la séance client
        INSERT INTO client_sessions (
            client_program_id,
            client_id,
            name,
            week_number,
            session_order,
            status,
            created_at,
            updated_at
        )
        VALUES (
            v_client_program_id,
            p_client_id,
            v_session_template.name,
            v_session_template.week_number,
            v_session_template.session_order,
            'pending',
            NOW(),
            NOW()
        )
        RETURNING id INTO v_client_session_id;

        -- ====================================================================
        -- ÉTAPE 5 : DUPLICATION DES EXERCICES DE LA SÉANCE
        -- ====================================================================
        
        -- Pour chaque exercice du template de séance, créer un exercice client
        FOR v_exercise_template IN
            SELECT * FROM session_exercise_templates
            WHERE session_template_id = v_session_template.id
            ORDER BY exercise_order
        LOOP
            INSERT INTO client_session_exercises (
                client_session_id,
                exercise_id,
                client_id,
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
                v_client_session_id,
                v_exercise_template.exercise_id,
                p_client_id,
                v_exercise_template.exercise_order,
                v_exercise_template.sets,
                v_exercise_template.reps,
                v_exercise_template.load,
                v_exercise_template.tempo,
                v_exercise_template.rest_time,
                v_exercise_template.intensification,
                v_exercise_template.notes,
                NOW(),
                NOW()
            );
        END LOOP;
    END LOOP;

    -- ========================================================================
    -- ÉTAPE 6 : RETOUR DU RÉSULTAT
    -- ========================================================================
    
    RETURN json_build_object(
        'success', TRUE,
        'assignment_id', v_assignment_id,
        'client_program_id', v_client_program_id,
        'message', format('Programme "%s" assigné avec succès au client', v_template_program.name)
    );

EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, PostgreSQL fait automatiquement un ROLLBACK
        RETURN json_build_object(
            'success', FALSE,
            'error', SQLSTATE,
            'message', format('Erreur lors de l''assignation : %s', SQLERRM)
        );
END;
$$;

-- ============================================================================
-- FONCTION UTILITAIRE : Mettre à jour le statut des assignations
-- ============================================================================

CREATE OR REPLACE FUNCTION update_assignment_statuses()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Mettre à jour les assignations "upcoming" qui doivent passer à "active"
    UPDATE program_assignments
    SET status = 'active', updated_at = NOW()
    WHERE status = 'upcoming' 
    AND start_date <= CURRENT_DATE;

    -- Mettre à jour les assignations "active" qui doivent passer à "completed"
    UPDATE program_assignments
    SET status = 'completed', updated_at = NOW()
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE;
END;
$$;

-- ============================================================================
-- FONCTION UTILITAIRE : Obtenir le résumé d'une assignation
-- ============================================================================

CREATE OR REPLACE FUNCTION get_assignment_summary(p_assignment_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'assignment_id', pa.id,
        'client_id', pa.client_id,
        'coach_id', pa.coach_id,
        'program_name', cp.name,
        'start_date', pa.start_date,
        'end_date', pa.end_date,
        'status', pa.status,
        'current_week', pa.current_week,
        'current_session_order', pa.current_session_order,
        'total_weeks', cp.week_count,
        'total_sessions', (
            SELECT COUNT(*) FROM client_sessions 
            WHERE client_program_id = cp.id
        ),
        'completed_sessions', (
            SELECT COUNT(*) FROM client_sessions 
            WHERE client_program_id = cp.id AND status = 'completed'
        )
    ) INTO v_result
    FROM program_assignments pa
    JOIN client_programs cp ON cp.assignment_id = pa.id
    WHERE pa.id = p_assignment_id;

    RETURN v_result;
END;
$$;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION assign_program_atomic IS 
    'Assigne un programme template à un client de manière atomique (transaction). 
    Duplique le template et toutes ses séances/exercices dans les tables client_*.
    Retourne un JSON avec success=true/false et les IDs créés.';

COMMENT ON FUNCTION update_assignment_statuses IS 
    'Fonction utilitaire pour mettre à jour automatiquement les statuts des assignations 
    en fonction des dates. À appeler via un cron job quotidien.';

COMMENT ON FUNCTION get_assignment_summary IS 
    'Retourne un résumé JSON complet d''une assignation avec progression et statistiques.';
