-- Migration: Renommage des tables client_* en client_created_*
-- Date: 2025-11-18
-- Description: Corrige l'incohérence entre le code et le schéma de la base de données
--              en renommant les tables pour correspondre aux références dans le code

-- ============================================================================
-- IMPORTANT: Cette migration corrige un problème critique
-- ============================================================================
-- Le code fait référence à client_created_programs, client_created_sessions, etc.
-- mais ces tables n'existent pas. Elles sont nommées client_programs, client_sessions, etc.
-- Cette migration renomme les tables pour aligner la base de données avec le code.

-- ============================================================================
-- 1. Vérifier l'existence des tables avant renommage
-- ============================================================================

DO $$
BEGIN
  -- Vérifier que les tables sources existent
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_programs') THEN
    RAISE EXCEPTION 'La table client_programs n''existe pas. Migration annulée.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_sessions') THEN
    RAISE EXCEPTION 'La table client_sessions n''existe pas. Migration annulée.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_session_exercises') THEN
    RAISE EXCEPTION 'La table client_session_exercises n''existe pas. Migration annulée.';
  END IF;

  -- Vérifier que les tables cibles n'existent pas déjà
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_created_programs') THEN
    RAISE EXCEPTION 'La table client_created_programs existe déjà. Migration annulée pour éviter la perte de données.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_created_sessions') THEN
    RAISE EXCEPTION 'La table client_created_sessions existe déjà. Migration annulée pour éviter la perte de données.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_created_session_exercises') THEN
    RAISE EXCEPTION 'La table client_created_session_exercises existe déjà. Migration annulée pour éviter la perte de données.';
  END IF;

  RAISE NOTICE 'Vérifications préalables réussies. Début du renommage...';
END $$;

-- ============================================================================
-- 2. Renommer les tables
-- ============================================================================

-- Renommer client_programs en client_created_programs
ALTER TABLE client_programs RENAME TO client_created_programs;
RAISE NOTICE 'Table client_programs renommée en client_created_programs';

-- Renommer client_sessions en client_created_sessions
ALTER TABLE client_sessions RENAME TO client_created_sessions;
RAISE NOTICE 'Table client_sessions renommée en client_created_sessions';

-- Renommer client_session_exercises en client_created_session_exercises
ALTER TABLE client_session_exercises RENAME TO client_created_session_exercises;
RAISE NOTICE 'Table client_session_exercises renommée en client_created_session_exercises';

-- ============================================================================
-- 3. Mettre à jour les contraintes de clés étrangères
-- ============================================================================

-- Les contraintes de clés étrangères sont automatiquement mises à jour par PostgreSQL
-- lors du renommage des tables, mais nous vérifions leur existence

DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  -- Compter les contraintes FK pointant vers client_created_programs
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE ccu.table_name = 'client_created_programs'
    AND tc.constraint_type = 'FOREIGN KEY';

  RAISE NOTICE 'Nombre de contraintes FK vers client_created_programs: %', constraint_count;

  -- Compter les contraintes FK pointant vers client_created_sessions
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE ccu.table_name = 'client_created_sessions'
    AND tc.constraint_type = 'FOREIGN KEY';

  RAISE NOTICE 'Nombre de contraintes FK vers client_created_sessions: %', constraint_count;
END $$;

-- ============================================================================
-- 4. Mettre à jour les séquences et index
-- ============================================================================

-- Les séquences et index sont automatiquement mis à jour par PostgreSQL
-- Vérifier que tous les index existent

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename IN ('client_created_programs', 'client_created_sessions', 'client_created_session_exercises');

  RAISE NOTICE 'Nombre total d''index sur les tables renommées: %', index_count;
END $$;

-- ============================================================================
-- 5. Vérifier les politiques RLS
-- ============================================================================

-- Les politiques RLS sont automatiquement mises à jour avec le nouveau nom de table
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename IN ('client_created_programs', 'client_created_sessions', 'client_created_session_exercises');

  RAISE NOTICE 'Nombre total de politiques RLS sur les tables renommées: %', policy_count;

  IF policy_count = 0 THEN
    RAISE WARNING 'ATTENTION: Aucune politique RLS trouvée sur les tables renommées. Vérification manuelle nécessaire.';
  END IF;
END $$;

-- ============================================================================
-- 6. Ajouter des commentaires sur les tables
-- ============================================================================

COMMENT ON TABLE client_created_programs IS 
'Programmes créés ou assignés aux clients/pratiquants.
- source_type = ''client_created'' : Programme créé directement par le client
- source_type = ''coach_assigned'' : Programme assigné par un coach (copie d''un template)';

COMMENT ON TABLE client_created_sessions IS
'Séances appartenant aux programmes clients.
Chaque séance est liée à un programme via program_id.';

COMMENT ON TABLE client_created_session_exercises IS
'Exercices appartenant aux séances clients.
Chaque exercice est lié à une séance via session_id.';

-- ============================================================================
-- 7. Vérifications post-migration
-- ============================================================================

DO $$
DECLARE
  programs_count INTEGER;
  sessions_count INTEGER;
  exercises_count INTEGER;
BEGIN
  -- Compter les enregistrements dans chaque table
  SELECT COUNT(*) INTO programs_count FROM client_created_programs;
  SELECT COUNT(*) INTO sessions_count FROM client_created_sessions;
  SELECT COUNT(*) INTO exercises_count FROM client_created_session_exercises;

  RAISE NOTICE '=== Migration terminée avec succès ===';
  RAISE NOTICE 'Tables renommées:';
  RAISE NOTICE '  - client_programs → client_created_programs (% enregistrements)', programs_count;
  RAISE NOTICE '  - client_sessions → client_created_sessions (% enregistrements)', sessions_count;
  RAISE NOTICE '  - client_session_exercises → client_created_session_exercises (% enregistrements)', exercises_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Les contraintes FK, index, séquences et politiques RLS ont été automatiquement mis à jour.';
  RAISE NOTICE 'Veuillez vérifier que l''application fonctionne correctement après cette migration.';
END $$;

-- ============================================================================
-- 8. Créer une fonction de rollback (à utiliser en cas de problème)
-- ============================================================================

-- Cette fonction permet de revenir en arrière si nécessaire
CREATE OR REPLACE FUNCTION rollback_rename_client_tables()
RETURNS void AS $$
BEGIN
  ALTER TABLE client_created_programs RENAME TO client_programs;
  ALTER TABLE client_created_sessions RENAME TO client_sessions;
  ALTER TABLE client_created_session_exercises RENAME TO client_session_exercises;
  
  RAISE NOTICE 'Rollback effectué: tables renommées à leur nom original';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rollback_rename_client_tables IS
'Fonction de rollback pour annuler le renommage des tables.
À utiliser UNIQUEMENT en cas de problème critique après la migration.
Usage: SELECT rollback_rename_client_tables();';
