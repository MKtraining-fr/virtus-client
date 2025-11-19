-- Migration : Système d'assignation de programmes refactorisé
-- Date : 2025-11-19
-- Description : Crée les tables pour le système hybride template/instance clarifié

-- ============================================================================
-- PARTIE 1 : TABLES DES MODÈLES (TEMPLATES) - Bibliothèque du Coach
-- ============================================================================

-- Table des modèles de programmes
CREATE TABLE IF NOT EXISTS program_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    objective TEXT,
    week_count INT NOT NULL DEFAULT 1,
    is_public BOOLEAN DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_program_templates_coach_id ON program_templates(coach_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_program_templates_updated_at 
    BEFORE UPDATE ON program_templates
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Table des modèles de séances
CREATE TABLE IF NOT EXISTS session_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_template_id uuid NOT NULL REFERENCES program_templates(id) ON DELETE CASCADE,
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    week_number INT NOT NULL DEFAULT 1,
    session_order INT NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_session_templates_program_id ON session_templates(program_template_id);
CREATE INDEX idx_session_templates_coach_id ON session_templates(coach_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_session_templates_updated_at 
    BEFORE UPDATE ON session_templates
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Table de jonction pour les exercices dans un modèle de séance
CREATE TABLE IF NOT EXISTS session_exercise_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_template_id uuid NOT NULL REFERENCES session_templates(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_order INT NOT NULL DEFAULT 1,
    sets INT,
    reps TEXT,
    load TEXT,
    tempo TEXT,
    rest_time TEXT,
    intensification JSONB,
    notes TEXT,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_session_exercise_templates_session_id ON session_exercise_templates(session_template_id);
CREATE INDEX idx_session_exercise_templates_exercise_id ON session_exercise_templates(exercise_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_session_exercise_templates_updated_at 
    BEFORE UPDATE ON session_exercise_templates
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTIE 2 : TABLE D'ASSIGNATION - Le Registre Central (Source de Vérité)
-- ============================================================================

-- Renommer l'ancienne table pour migration progressive
ALTER TABLE IF EXISTS program_assignments RENAME TO program_assignments_old;

-- Créer la nouvelle table program_assignments avec la structure correcte
CREATE TABLE program_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_template_id uuid NOT NULL REFERENCES program_templates(id) ON DELETE RESTRICT,
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    start_date DATE NOT NULL,
    end_date DATE, -- Calculé automatiquement ou défini manuellement
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'paused', 'archived')),
    
    -- Suivi de la progression
    current_week INT DEFAULT 1,
    current_session_order INT DEFAULT 1,
    
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    
    -- Contrainte d'unicité : un client peut avoir plusieurs assignations du même template, mais pas à la même date
    UNIQUE(program_template_id, client_id, start_date)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_program_assignments_client_id ON program_assignments(client_id);
CREATE INDEX idx_program_assignments_coach_id ON program_assignments(coach_id);
CREATE INDEX idx_program_assignments_template_id ON program_assignments(program_template_id);
CREATE INDEX idx_program_assignments_status ON program_assignments(status);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_program_assignments_updated_at 
    BEFORE UPDATE ON program_assignments
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTIE 3 : TABLES DES INSTANCES CLIENT - Données "Vivantes"
-- ============================================================================

-- Renommer les anciennes tables pour migration progressive
ALTER TABLE IF EXISTS client_created_programs RENAME TO client_created_programs_old;
ALTER TABLE IF EXISTS client_created_sessions RENAME TO client_created_sessions_old;
ALTER TABLE IF EXISTS client_created_session_exercises RENAME TO client_created_session_exercises_old;

-- Table des programmes "vivants" des clients
CREATE TABLE client_programs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id uuid NOT NULL REFERENCES program_assignments(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    objective TEXT,
    week_count INT NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_client_programs_assignment_id ON client_programs(assignment_id);
CREATE INDEX idx_client_programs_client_id ON client_programs(client_id);
CREATE INDEX idx_client_programs_coach_id ON client_programs(coach_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_client_programs_updated_at 
    BEFORE UPDATE ON client_programs
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Table des séances "vivantes" des clients
CREATE TABLE client_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_program_id uuid NOT NULL REFERENCES client_programs(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    week_number INT NOT NULL,
    session_order INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    completed_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_client_sessions_program_id ON client_sessions(client_program_id);
CREATE INDEX idx_client_sessions_client_id ON client_sessions(client_id);
CREATE INDEX idx_client_sessions_status ON client_sessions(status);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_client_sessions_updated_at 
    BEFORE UPDATE ON client_sessions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Table des exercices dans une séance client
CREATE TABLE client_session_exercises (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_session_id uuid NOT NULL REFERENCES client_sessions(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_order INT NOT NULL DEFAULT 1,
    sets INT,
    reps TEXT,
    load TEXT,
    tempo TEXT,
    rest_time TEXT,
    intensification JSONB,
    notes TEXT,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_client_session_exercises_session_id ON client_session_exercises(client_session_id);
CREATE INDEX idx_client_session_exercises_exercise_id ON client_session_exercises(exercise_id);
CREATE INDEX idx_client_session_exercises_client_id ON client_session_exercises(client_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_client_session_exercises_updated_at 
    BEFORE UPDATE ON client_session_exercises
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTIE 4 : TABLE DE SUIVI DES PERFORMANCES
-- ============================================================================

-- Table des logs de performance (peut coexister avec l'ancienne si elle existe)
CREATE TABLE IF NOT EXISTS performance_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_session_exercise_id uuid NOT NULL REFERENCES client_session_exercises(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    reps_achieved INT,
    load_achieved TEXT,
    rpe INT CHECK (rpe >= 1 AND rpe <= 10), -- Rating of Perceived Exertion (1-10)
    notes TEXT,
    performed_at timestamptz DEFAULT now() NOT NULL,
    
    -- Contrainte d'unicité : un seul log par série d'exercice
    UNIQUE (client_session_exercise_id, set_number)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_performance_logs_client_id ON performance_logs(client_id);
CREATE INDEX idx_performance_logs_exercise_id ON performance_logs(client_session_exercise_id);
CREATE INDEX idx_performance_logs_performed_at ON performance_logs(performed_at);

-- ============================================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE program_templates IS 'Modèles de programmes créés par les coachs (bibliothèque réutilisable)';
COMMENT ON TABLE session_templates IS 'Modèles de séances appartenant aux programmes templates';
COMMENT ON TABLE session_exercise_templates IS 'Configuration des exercices dans les séances templates';
COMMENT ON TABLE program_assignments IS 'Registre central des assignations (source de vérité unique)';
COMMENT ON TABLE client_programs IS 'Instances de programmes dupliquées pour chaque client';
COMMENT ON TABLE client_sessions IS 'Instances de séances appartenant aux programmes clients';
COMMENT ON TABLE client_session_exercises IS 'Exercices dans les séances clients (modifiables)';
COMMENT ON TABLE performance_logs IS 'Logs des performances réelles enregistrées par les clients';
