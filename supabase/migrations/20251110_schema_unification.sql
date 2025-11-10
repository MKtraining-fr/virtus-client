-- Migration: Unification du schéma de la base de données
-- Date: 2025-11-10
-- Description: Corrige les incohérences du schéma et standardise les références

-- ============================================================================
-- 1. Standardiser les timestamps de program_assignments
-- ============================================================================

ALTER TABLE program_assignments 
  ALTER COLUMN created_at TYPE timestamp with time zone,
  ALTER COLUMN updated_at TYPE timestamp with time zone;

COMMENT ON COLUMN program_assignments.created_at IS 'Date de création de l''assignement (avec timezone)';
COMMENT ON COLUMN program_assignments.updated_at IS 'Date de dernière modification (avec timezone)';

-- ============================================================================
-- 2. Ajouter les colonnes de tracking des modifications
-- ============================================================================

-- Ajouter les colonnes pour tracker les modifications par le client
ALTER TABLE client_created_programs 
  ADD COLUMN IF NOT EXISTS modified_by_client BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS viewed_by_coach BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN client_created_programs.modified_by_client IS 'Indique si le programme a été modifié par le client après assignement';
COMMENT ON COLUMN client_created_programs.last_modified_at IS 'Date de la dernière modification du programme';
COMMENT ON COLUMN client_created_programs.viewed_by_coach IS 'Indique si le coach a vu les dernières modifications';

-- Trigger pour mettre à jour automatiquement last_modified_at
CREATE OR REPLACE FUNCTION update_last_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = NOW();
  NEW.modified_by_client = TRUE;
  NEW.viewed_by_coach = FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_modified_at ON client_created_programs;

CREATE TRIGGER trigger_update_last_modified_at
BEFORE UPDATE ON client_created_programs
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION update_last_modified_at();

-- ============================================================================
-- 3. Vérifier et nettoyer la table profiles
-- ============================================================================

-- Vérifier si la table profiles contient des données
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  IF profile_count > 0 THEN
    RAISE NOTICE 'ATTENTION: La table profiles contient % lignes. Vérification manuelle nécessaire avant suppression.', profile_count;
  ELSE
    RAISE NOTICE 'La table profiles est vide, elle peut être supprimée en toute sécurité.';
    -- Supprimer la table profiles si elle est vide
    DROP TABLE IF EXISTS profiles CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 4. Ajouter des index pour améliorer les performances
-- ============================================================================

-- Index sur program_assignments pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_program_assignments_coach_client 
  ON program_assignments(coach_id, client_id);

CREATE INDEX IF NOT EXISTS idx_program_assignments_status 
  ON program_assignments(status) 
  WHERE status = 'active';

-- Index sur client_created_programs
CREATE INDEX IF NOT EXISTS idx_client_created_programs_source_coach 
  ON client_created_programs(source_type, coach_id) 
  WHERE source_type = 'coach_assigned';

CREATE INDEX IF NOT EXISTS idx_client_created_programs_modified 
  ON client_created_programs(modified_by_client, viewed_by_coach) 
  WHERE modified_by_client = TRUE AND viewed_by_coach = FALSE;

-- Index sur performance_logs
CREATE INDEX IF NOT EXISTS idx_performance_logs_client_date 
  ON performance_logs(client_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_performance_logs_assignment 
  ON performance_logs(program_assignment_id);

-- ============================================================================
-- 5. Vérifications post-migration
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Migration terminée avec succès ===';
  RAISE NOTICE 'Timestamps standardisés: program_assignments';
  RAISE NOTICE 'Colonnes de tracking ajoutées: client_created_programs';
  RAISE NOTICE 'Index créés pour optimiser les performances';
END $$;
