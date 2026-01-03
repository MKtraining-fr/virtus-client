-- Créer la table client_exercise_records pour les records personnels
-- Date: 2026-01-03
-- Note: Distincte de client_exercise_performance qui gère les performances des séances

-- ============================================================================
-- TABLE: client_exercise_records
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_exercise_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  
  -- Performance
  weight NUMERIC NOT NULL CHECK (weight > 0),
  reps INTEGER NOT NULL CHECK (reps > 0),
  sets INTEGER DEFAULT 1 CHECK (sets > 0),
  rir INTEGER DEFAULT 0 CHECK (rir >= 0),  -- Reps In Reserve
  
  -- 1RM calculé automatiquement
  one_rm_calculated NUMERIC,
  
  -- Source et contexte
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'session', 'initial_assessment')),
  session_id UUID REFERENCES client_sessions(id) ON DELETE SET NULL,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_exercise_records_client ON client_exercise_records(client_id);
CREATE INDEX IF NOT EXISTS idx_exercise_records_exercise ON client_exercise_records(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_records_client_exercise ON client_exercise_records(client_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_records_recorded_at ON client_exercise_records(recorded_at DESC);

ALTER TABLE client_exercise_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_own_records ON client_exercise_records
  FOR ALL
  USING (client_id = auth.uid());

CREATE POLICY coach_clients_records ON client_exercise_records
  FOR ALL
  USING (
    client_id IN (
      SELECT id FROM clients WHERE coach_id = auth.uid()
    )
  );

COMMENT ON TABLE client_exercise_records IS 'Records personnels et performances de référence des clients';
COMMENT ON COLUMN client_exercise_records.rir IS 'Reps In Reserve - Nombre de répétitions en réserve (0 = échec musculaire)';
COMMENT ON COLUMN client_exercise_records.source IS 'Source de la performance: manual (saisie manuelle), session (depuis une séance), initial_assessment (bilan initial)';
