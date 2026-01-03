-- Migration: Système de suivi des performances et profil nerveux
-- Date: 2026-01-03
-- Description: Création des tables et triggers pour le système complet de suivi des performances

-- ============================================================================
-- 1. TABLE: client_training_info
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_training_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Informations d'entraînement
  experience TEXT,  -- Expérience sportive
  training_since TEXT,  -- Pratique la musculation depuis
  sessions_per_week INTEGER CHECK (sessions_per_week >= 1 AND sessions_per_week <= 7),
  session_duration INTEGER,  -- En minutes
  training_type TEXT,  -- Type d'entraînement
  issues TEXT,  -- Problématiques rencontrées
  
  -- Mouvements proscrits (JSONB)
  -- Format: [{"exercise_id": "uuid", "exercise_name": "nom", "reason": "raison"}]
  forbidden_movements JSONB DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(client_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_client_training_info_client ON client_training_info(client_id);

-- RLS (Row Level Security)
ALTER TABLE client_training_info ENABLE ROW LEVEL SECURITY;

-- Policy : Client peut voir et modifier ses propres données
CREATE POLICY client_own_training_info ON client_training_info
  FOR ALL
  USING (client_id = auth.uid());

-- Policy : Coach peut voir et modifier les données de ses clients
CREATE POLICY coach_clients_training_info ON client_training_info
  FOR ALL
  USING (
    client_id IN (
      SELECT id FROM clients WHERE coach_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. MODIFICATION TABLE: client_exercise_performance
-- ============================================================================

-- Vérifier si la table existe, sinon la créer
CREATE TABLE IF NOT EXISTS client_exercise_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  
  -- Données de performance
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  sets INTEGER,
  
  -- Métadonnées de base
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les nouvelles colonnes si elles n'existent pas
DO $$
BEGIN
  -- Colonne RIR (Reps In Reserve)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='client_exercise_performance' AND column_name='rir') THEN
    ALTER TABLE client_exercise_performance ADD COLUMN rir INTEGER;
  END IF;
  
  -- Colonne source
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='client_exercise_performance' AND column_name='source') THEN
    ALTER TABLE client_exercise_performance ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;
  
  -- Colonne session_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='client_exercise_performance' AND column_name='session_id') THEN
    ALTER TABLE client_exercise_performance ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
  END IF;
  
  -- Colonne one_rm_calculated
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='client_exercise_performance' AND column_name='one_rm_calculated') THEN
    ALTER TABLE client_exercise_performance ADD COLUMN one_rm_calculated NUMERIC;
  END IF;
  
  -- Colonne updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='client_exercise_performance' AND column_name='updated_at') THEN
    ALTER TABLE client_exercise_performance ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Colonne created_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='client_exercise_performance' AND column_name='created_by') THEN
    ALTER TABLE client_exercise_performance ADD COLUMN created_by UUID;
  END IF;
  
  -- Colonne updated_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='client_exercise_performance' AND column_name='updated_by') THEN
    ALTER TABLE client_exercise_performance ADD COLUMN updated_by UUID;
  END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_performance_client_exercise ON client_exercise_performance(client_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_performance_recorded_at ON client_exercise_performance(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_session ON client_exercise_performance(session_id);

-- RLS
ALTER TABLE client_exercise_performance ENABLE ROW LEVEL SECURITY;

-- Policy : Client peut voir et modifier ses propres performances
DROP POLICY IF EXISTS client_own_performances ON client_exercise_performance;
CREATE POLICY client_own_performances ON client_exercise_performance
  FOR ALL
  USING (client_id = auth.uid());

-- Policy : Coach peut voir et modifier les performances de ses clients
DROP POLICY IF EXISTS coach_clients_performances ON client_exercise_performance;
CREATE POLICY coach_clients_performances ON client_exercise_performance
  FOR ALL
  USING (
    client_id IN (
      SELECT id FROM clients WHERE coach_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. TABLE: client_exercise_projections
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
  difference NUMERIC,  -- actual_weight - projected_weight
  difference_percent NUMERIC,  -- (difference / projected_weight) * 100
  nervous_profile TEXT,  -- 'force' | 'endurance' | 'balanced'
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(client_id, exercise_id, target_reps)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_projections_client_exercise ON client_exercise_projections(client_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_projections_target_reps ON client_exercise_projections(target_reps);

-- RLS
ALTER TABLE client_exercise_projections ENABLE ROW LEVEL SECURITY;

-- Policy : Client peut voir et modifier ses propres projections
CREATE POLICY client_own_projections ON client_exercise_projections
  FOR ALL
  USING (client_id = auth.uid());

-- Policy : Coach peut voir et modifier les projections de ses clients
CREATE POLICY coach_clients_projections ON client_exercise_projections
  FOR ALL
  USING (
    client_id IN (
      SELECT id FROM clients WHERE coach_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction: Calculer le 1RM avec formule de Brzycki et ajustement RIR
CREATE OR REPLACE FUNCTION calculate_one_rm()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcul du 1RM avec formule de Brzycki (valide pour 1-10 reps)
  IF NEW.reps > 0 AND NEW.reps <= 10 THEN
    -- Calcul brut
    NEW.one_rm_calculated := NEW.weight / (1.0278 - 0.0278 * NEW.reps);
    
    -- Ajustement selon le RIR (Reps In Reserve)
    -- Chaque RIR réduit le 1RM de 2.5%
    IF NEW.rir IS NOT NULL AND NEW.rir > 0 THEN
      NEW.one_rm_calculated := NEW.one_rm_calculated * (1 - NEW.rir * 0.025);
    END IF;
  ELSIF NEW.reps > 10 THEN
    -- Pour plus de 10 reps, utiliser une estimation plus conservative
    NEW.one_rm_calculated := NEW.weight * (1 + NEW.reps / 30.0);  -- Formule d'Epley
    
    -- Ajustement RIR
    IF NEW.rir IS NOT NULL AND NEW.rir > 0 THEN
      NEW.one_rm_calculated := NEW.one_rm_calculated * (1 - NEW.rir * 0.025);
    END IF;
  ELSE
    NEW.one_rm_calculated := NULL;
  END IF;
  
  -- Mettre à jour le timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Calculer automatiquement le 1RM
DROP TRIGGER IF EXISTS calculate_one_rm_trigger ON client_exercise_performance;
CREATE TRIGGER calculate_one_rm_trigger
BEFORE INSERT OR UPDATE ON client_exercise_performance
FOR EACH ROW
EXECUTE FUNCTION calculate_one_rm();

-- Fonction: Calculer une projection pour un nombre de reps cible
CREATE OR REPLACE FUNCTION calculate_projection(one_rm NUMERIC, target_reps INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  -- Table de correspondance basée sur les standards de force
  RETURN CASE target_reps
    WHEN 1 THEN one_rm * 1.00
    WHEN 2 THEN one_rm * 0.95
    WHEN 3 THEN one_rm * 0.93
    WHEN 4 THEN one_rm * 0.90
    WHEN 5 THEN one_rm * 0.87
    WHEN 6 THEN one_rm * 0.85
    WHEN 7 THEN one_rm * 0.83
    WHEN 8 THEN one_rm * 0.80
    WHEN 9 THEN one_rm * 0.77
    WHEN 10 THEN one_rm * 0.75
    WHEN 12 THEN one_rm * 0.70
    WHEN 15 THEN one_rm * 0.65
    ELSE one_rm / (1.0278 - 0.0278 * target_reps)  -- Formule inverse de Brzycki
  END;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Déterminer le profil nerveux
CREATE OR REPLACE FUNCTION determine_nervous_profile(difference_percent NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF difference_percent > 5 THEN
    RETURN 'force';  -- Surperformance en force pure
  ELSIF difference_percent < -2 THEN
    RETURN 'endurance';  -- Meilleur en endurance
  ELSE
    RETURN 'balanced';  -- Profil équilibré
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Mettre à jour les projections après une nouvelle performance
CREATE OR REPLACE FUNCTION update_projections_after_performance()
RETURNS TRIGGER AS $$
DECLARE
  latest_one_rm NUMERIC;
  target_reps_array INTEGER[] := ARRAY[1, 2, 3, 5, 8, 10, 12];
  target_rep INTEGER;
BEGIN
  -- Récupérer le 1RM calculé de la nouvelle performance
  latest_one_rm := NEW.one_rm_calculated;
  
  -- Si le 1RM est valide
  IF latest_one_rm IS NOT NULL THEN
    -- Générer/mettre à jour les projections pour différents nombres de reps
    FOREACH target_rep IN ARRAY target_reps_array
    LOOP
      -- Vérifier si cette performance correspond à un target_reps existant
      IF NEW.reps = target_rep THEN
        -- C'est une performance réelle, mettre à jour la projection existante
        INSERT INTO client_exercise_projections (
          client_id,
          exercise_id,
          target_reps,
          projected_weight,
          based_on_performance_id,
          actual_weight,
          actual_performance_id,
          difference,
          difference_percent,
          nervous_profile
        )
        VALUES (
          NEW.client_id,
          NEW.exercise_id,
          target_rep,
          calculate_projection(latest_one_rm, target_rep),
          NEW.id,
          NEW.weight,
          NEW.id,
          NEW.weight - calculate_projection(latest_one_rm, target_rep),
          ((NEW.weight - calculate_projection(latest_one_rm, target_rep)) / calculate_projection(latest_one_rm, target_rep)) * 100,
          determine_nervous_profile(((NEW.weight - calculate_projection(latest_one_rm, target_rep)) / calculate_projection(latest_one_rm, target_rep)) * 100)
        )
        ON CONFLICT (client_id, exercise_id, target_reps)
        DO UPDATE SET
          projected_weight = EXCLUDED.projected_weight,
          actual_weight = EXCLUDED.actual_weight,
          actual_performance_id = EXCLUDED.actual_performance_id,
          difference = EXCLUDED.difference,
          difference_percent = EXCLUDED.difference_percent,
          nervous_profile = EXCLUDED.nervous_profile,
          updated_at = NOW();
      ELSE
        -- C'est une projection, ne pas écraser les performances réelles existantes
        INSERT INTO client_exercise_projections (
          client_id,
          exercise_id,
          target_reps,
          projected_weight,
          based_on_performance_id
        )
        VALUES (
          NEW.client_id,
          NEW.exercise_id,
          target_rep,
          calculate_projection(latest_one_rm, target_rep),
          NEW.id
        )
        ON CONFLICT (client_id, exercise_id, target_reps)
        DO UPDATE SET
          projected_weight = EXCLUDED.projected_weight,
          based_on_performance_id = EXCLUDED.based_on_performance_id,
          updated_at = NOW()
        WHERE client_exercise_projections.actual_weight IS NULL;  -- Ne pas écraser les performances réelles
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Mettre à jour les projections après insertion d'une performance
DROP TRIGGER IF EXISTS update_projections_trigger ON client_exercise_performance;
CREATE TRIGGER update_projections_trigger
AFTER INSERT OR UPDATE ON client_exercise_performance
FOR EACH ROW
EXECUTE FUNCTION update_projections_after_performance();

-- ============================================================================
-- 5. FONCTION DE MISE À JOUR DU TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour client_training_info
DROP TRIGGER IF EXISTS update_client_training_info_updated_at ON client_training_info;
CREATE TRIGGER update_client_training_info_updated_at
BEFORE UPDATE ON client_training_info
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour client_exercise_projections
DROP TRIGGER IF EXISTS update_projections_updated_at ON client_exercise_projections;
CREATE TRIGGER update_projections_updated_at
BEFORE UPDATE ON client_exercise_projections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. COMMENTAIRES SUR LES TABLES
-- ============================================================================

COMMENT ON TABLE client_training_info IS 'Informations d''entraînement et conditions du client';
COMMENT ON TABLE client_exercise_performance IS 'Historique des performances par exercice avec calcul automatique du 1RM';
COMMENT ON TABLE client_exercise_projections IS 'Projections de performances et analyse du profil nerveux';

COMMENT ON COLUMN client_training_info.forbidden_movements IS 'JSONB array: [{"exercise_id": "uuid", "exercise_name": "nom", "reason": "raison"}]';
COMMENT ON COLUMN client_exercise_performance.rir IS 'Reps In Reserve: nombre de répétitions restantes avant échec musculaire';
COMMENT ON COLUMN client_exercise_performance.source IS 'Source de la performance: manual | session | initial_assessment';
COMMENT ON COLUMN client_exercise_projections.nervous_profile IS 'Profil nerveux: force | endurance | balanced';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
