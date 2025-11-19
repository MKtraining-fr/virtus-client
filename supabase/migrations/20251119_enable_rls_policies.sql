-- Migration : Politiques de sécurité RLS pour le système d'assignation
-- Date : 2025-11-19
-- Description : Active et configure les politiques Row Level Security (RLS) sur toutes les tables

-- ============================================================================
-- ACTIVATION DU RLS SUR TOUTES LES TABLES
-- ============================================================================

ALTER TABLE program_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercise_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLITIQUES RLS POUR LES TEMPLATES (Bibliothèque du Coach)
-- ============================================================================

-- PROGRAM_TEMPLATES : Un coach ne voit et ne gère que ses propres templates
CREATE POLICY "Coaches can view their own program templates"
    ON program_templates FOR SELECT
    USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their own program templates"
    ON program_templates FOR INSERT
    WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own program templates"
    ON program_templates FOR UPDATE
    USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own program templates"
    ON program_templates FOR DELETE
    USING (coach_id = auth.uid());

-- SESSION_TEMPLATES : Un coach ne voit et ne gère que ses propres session templates
CREATE POLICY "Coaches can view their own session templates"
    ON session_templates FOR SELECT
    USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their own session templates"
    ON session_templates FOR INSERT
    WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own session templates"
    ON session_templates FOR UPDATE
    USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own session templates"
    ON session_templates FOR DELETE
    USING (coach_id = auth.uid());

-- SESSION_EXERCISE_TEMPLATES : Un coach ne voit et ne gère que ses propres exercise templates
CREATE POLICY "Coaches can view their own session exercise templates"
    ON session_exercise_templates FOR SELECT
    USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their own session exercise templates"
    ON session_exercise_templates FOR INSERT
    WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own session exercise templates"
    ON session_exercise_templates FOR UPDATE
    USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own session exercise templates"
    ON session_exercise_templates FOR DELETE
    USING (coach_id = auth.uid());

-- ============================================================================
-- POLITIQUES RLS POUR PROGRAM_ASSIGNMENTS (Le Registre Central)
-- ============================================================================

-- Les coachs peuvent voir les assignations qu'ils ont créées
CREATE POLICY "Coaches can view their own program assignments"
    ON program_assignments FOR SELECT
    USING (coach_id = auth.uid());

-- Les clients peuvent voir leurs propres assignations
CREATE POLICY "Clients can view their own program assignments"
    ON program_assignments FOR SELECT
    USING (client_id = auth.uid());

-- Seuls les coachs peuvent créer des assignations (via RPC)
CREATE POLICY "Coaches can insert program assignments"
    ON program_assignments FOR INSERT
    WITH CHECK (coach_id = auth.uid());

-- Les coachs peuvent mettre à jour les assignations qu'ils ont créées
CREATE POLICY "Coaches can update their own program assignments"
    ON program_assignments FOR UPDATE
    USING (coach_id = auth.uid());

-- Les clients peuvent mettre à jour leur progression (current_week, current_session_order)
CREATE POLICY "Clients can update their own assignment progress"
    ON program_assignments FOR UPDATE
    USING (client_id = auth.uid());

-- Seuls les coachs peuvent supprimer des assignations
CREATE POLICY "Coaches can delete their own program assignments"
    ON program_assignments FOR DELETE
    USING (coach_id = auth.uid());

-- ============================================================================
-- POLITIQUES RLS POUR CLIENT_PROGRAMS (Instances de Programmes)
-- ============================================================================

-- Les clients peuvent voir leurs propres programmes
CREATE POLICY "Clients can view their own programs"
    ON client_programs FOR SELECT
    USING (client_id = auth.uid());

-- Les coachs peuvent voir les programmes de leurs clients
CREATE POLICY "Coaches can view their clients' programs"
    ON client_programs FOR SELECT
    USING (coach_id = auth.uid());

-- Seule la fonction RPC peut insérer des programmes clients (pas d'insertion directe)
-- On autorise l'insertion si l'utilisateur est le coach
CREATE POLICY "Coaches can insert client programs via RPC"
    ON client_programs FOR INSERT
    WITH CHECK (coach_id = auth.uid());

-- Les coachs peuvent modifier les programmes de leurs clients
CREATE POLICY "Coaches can update their clients' programs"
    ON client_programs FOR UPDATE
    USING (coach_id = auth.uid());

-- Les clients peuvent modifier leurs propres programmes (personnalisation)
CREATE POLICY "Clients can update their own programs"
    ON client_programs FOR UPDATE
    USING (client_id = auth.uid());

-- Seuls les coachs peuvent supprimer des programmes clients
CREATE POLICY "Coaches can delete their clients' programs"
    ON client_programs FOR DELETE
    USING (coach_id = auth.uid());

-- ============================================================================
-- POLITIQUES RLS POUR CLIENT_SESSIONS (Instances de Séances)
-- ============================================================================

-- Les clients peuvent voir leurs propres séances
CREATE POLICY "Clients can view their own sessions"
    ON client_sessions FOR SELECT
    USING (client_id = auth.uid());

-- Les coachs peuvent voir les séances de leurs clients
CREATE POLICY "Coaches can view their clients' sessions"
    ON client_sessions FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM profiles 
            WHERE coach_id = auth.uid() AND role = 'client'
        )
    );

-- Insertion via RPC uniquement (coach)
CREATE POLICY "System can insert client sessions"
    ON client_sessions FOR INSERT
    WITH CHECK (true); -- Contrôlé par la fonction RPC

-- Les clients peuvent mettre à jour le statut de leurs séances
CREATE POLICY "Clients can update their own sessions"
    ON client_sessions FOR UPDATE
    USING (client_id = auth.uid());

-- Les coachs peuvent mettre à jour les séances de leurs clients
CREATE POLICY "Coaches can update their clients' sessions"
    ON client_sessions FOR UPDATE
    USING (
        client_id IN (
            SELECT id FROM profiles 
            WHERE coach_id = auth.uid() AND role = 'client'
        )
    );

-- ============================================================================
-- POLITIQUES RLS POUR CLIENT_SESSION_EXERCISES (Exercices des Séances)
-- ============================================================================

-- Les clients peuvent voir leurs propres exercices
CREATE POLICY "Clients can view their own session exercises"
    ON client_session_exercises FOR SELECT
    USING (client_id = auth.uid());

-- Les coachs peuvent voir les exercices de leurs clients
CREATE POLICY "Coaches can view their clients' session exercises"
    ON client_session_exercises FOR SELECT
    USING (client_id IN (
        SELECT id FROM profiles 
        WHERE coach_id = auth.uid() AND role = 'client'
    ));

-- Insertion via RPC uniquement
CREATE POLICY "System can insert client session exercises"
    ON client_session_exercises FOR INSERT
    WITH CHECK (true); -- Contrôlé par la fonction RPC

-- Les clients peuvent modifier leurs exercices (notes, consignes)
CREATE POLICY "Clients can update their own session exercises"
    ON client_session_exercises FOR UPDATE
    USING (client_id = auth.uid());

-- Les coachs peuvent modifier les exercices de leurs clients
CREATE POLICY "Coaches can update their clients' session exercises"
    ON client_session_exercises FOR UPDATE
    USING (client_id IN (
        SELECT id FROM profiles 
        WHERE coach_id = auth.uid() AND role = 'client'
    ));

-- ============================================================================
-- POLITIQUES RLS POUR PERFORMANCE_LOGS (Logs de Performance)
-- ============================================================================

-- Les clients peuvent voir leurs propres logs
CREATE POLICY "Clients can view their own performance logs"
    ON performance_logs FOR SELECT
    USING (client_id = auth.uid());

-- Les coachs peuvent voir les logs de leurs clients
CREATE POLICY "Coaches can view their clients' performance logs"
    ON performance_logs FOR SELECT
    USING (client_id IN (
        SELECT id FROM profiles 
        WHERE coach_id = auth.uid() AND role = 'client'
    ));

-- Les clients peuvent insérer leurs propres logs
CREATE POLICY "Clients can insert their own performance logs"
    ON performance_logs FOR INSERT
    WITH CHECK (client_id = auth.uid());

-- Les clients peuvent modifier leurs propres logs (correction d'erreur)
CREATE POLICY "Clients can update their own performance logs"
    ON performance_logs FOR UPDATE
    USING (client_id = auth.uid());

-- Les clients peuvent supprimer leurs propres logs
CREATE POLICY "Clients can delete their own performance logs"
    ON performance_logs FOR DELETE
    USING (client_id = auth.uid());

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON POLICY "Coaches can view their own program templates" ON program_templates IS 
    'Un coach ne peut voir que ses propres templates de programmes';

COMMENT ON POLICY "Clients can view their own program assignments" ON program_assignments IS 
    'Un client ne peut voir que les programmes qui lui ont été assignés';

COMMENT ON POLICY "Coaches can view their own program assignments" ON program_assignments IS 
    'Un coach ne peut voir que les assignations qu''il a créées';
