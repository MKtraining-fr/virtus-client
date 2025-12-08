-- ============================================================================
-- CORRECTION DES POLITIQUES RLS POUR CLIENT_SESSIONS ET CLIENT_SESSION_EXERCISES
-- ============================================================================
-- Problème : Les politiques RLS utilisent profiles.coach_id qui n'existe pas
-- Solution : Utiliser client_coach_relationships pour trouver la relation coach-client

-- Supprimer les anciennes politiques incorrectes
DROP POLICY IF EXISTS "Coaches can view their clients' sessions" ON client_sessions;
DROP POLICY IF EXISTS "Coaches can update their clients' sessions" ON client_sessions;
DROP POLICY IF EXISTS "Coaches can view their clients' session exercises" ON client_session_exercises;
DROP POLICY IF EXISTS "Coaches can update their clients' session exercises" ON client_session_exercises;

-- Recréer les politiques avec la bonne table
CREATE POLICY "Coaches can view their clients' sessions"
    ON client_sessions FOR SELECT
    USING (
        client_id IN (
            SELECT client_id FROM client_coach_relationships 
            WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can update their clients' sessions"
    ON client_sessions FOR UPDATE
    USING (
        client_id IN (
            SELECT client_id FROM client_coach_relationships 
            WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can view their clients' session exercises"
    ON client_session_exercises FOR SELECT
    USING (
        client_id IN (
            SELECT client_id FROM client_coach_relationships 
            WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can update their clients' session exercises"
    ON client_session_exercises FOR UPDATE
    USING (
        client_id IN (
            SELECT client_id FROM client_coach_relationships 
            WHERE coach_id = auth.uid()
        )
    );
