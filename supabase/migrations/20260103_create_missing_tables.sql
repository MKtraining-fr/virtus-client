-- Créer les tables manquantes pour le système de performances
-- Date: 2026-01-03

-- ============================================================================
-- 1. TABLE: client_training_info
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_training_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Informations d'entraînement
  experience TEXT,
  training_since TEXT,
  sessions_per_week INTEGER CHECK (sessions_per_week >= 1 AND sessions_per_week <= 7),
  session_duration INTEGER,
  training_type TEXT,
  issues TEXT,
  
  -- Mouvements proscrits (JSONB)
  forbidden_movements JSONB DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(client_id)
);

CREATE INDEX IF NOT EXISTS idx_client_training_info_client ON client_training_info(client_id);

ALTER TABLE client_training_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_own_training_info ON client_training_info
  FOR ALL
  USING (client_id = auth.uid());

CREATE POLICY coach_clients_training_info ON client_training_info
  FOR ALL
  USING (
    client_id IN (
      SELECT id FROM clients WHERE coach_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. TABLE: client_exercise_projections
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_exercise_projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  
  -- Projection
  target_reps INTEGER NOT NULL,
  projected_weight NUMERIC NOT NULL,
  based_on_performance_id UUID REFERENCES client_exercise_performance(id) ON DELETE CASCADE,
  
  -- Performance réelle (si testée)
  actual_weight NUMERIC,
  actual_performance_id UUID REFERENCES client_exercise_performance(id) ON DELETE SET NULL,
  
  -- Écart et profil nerveux
  difference NUMERIC,
  difference_percent NUMERIC,
  nervous_profile TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(client_id, exercise_id, target_reps)
);

CREATE INDEX IF NOT EXISTS idx_projections_client_exercise ON client_exercise_projections(client_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_projections_target_reps ON client_exercise_projections(target_reps);

ALTER TABLE client_exercise_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_own_projections ON client_exercise_projections
  FOR ALL
  USING (client_id = auth.uid());

CREATE POLICY coach_clients_projections ON client_exercise_projections
  FOR ALL
  USING (
    client_id IN (
      SELECT id FROM clients WHERE coach_id = auth.uid()
    )
  );

COMMENT ON TABLE client_training_info IS 'Informations d''entraînement et conditions du client';
COMMENT ON TABLE client_exercise_projections IS 'Projections de performances et analyse du profil nerveux';
