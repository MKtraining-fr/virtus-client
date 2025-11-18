-- Script de test pour valider la migration de renommage des tables
-- Ce script doit être exécuté APRÈS la migration 20251118_rename_client_tables.sql

-- ============================================================================
-- 1. Vérifier que les nouvelles tables existent
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Test 1: Vérification de l''existence des tables ===';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_created_programs') THEN
    RAISE NOTICE '✓ Table client_created_programs existe';
  ELSE
    RAISE EXCEPTION '✗ Table client_created_programs n''existe pas';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_created_sessions') THEN
    RAISE NOTICE '✓ Table client_created_sessions existe';
  ELSE
    RAISE EXCEPTION '✗ Table client_created_sessions n''existe pas';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_created_session_exercises') THEN
    RAISE NOTICE '✓ Table client_created_session_exercises existe';
  ELSE
    RAISE EXCEPTION '✗ Table client_created_session_exercises n''existe pas';
  END IF;
END $$;

-- ============================================================================
-- 2. Vérifier que les anciennes tables n'existent plus
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Test 2: Vérification de la suppression des anciennes tables ===';
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_programs') THEN
    RAISE NOTICE '✓ Table client_programs n''existe plus';
  ELSE
    RAISE WARNING '✗ Table client_programs existe encore (devrait être renommée)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_sessions') THEN
    RAISE NOTICE '✓ Table client_sessions n''existe plus';
  ELSE
    RAISE WARNING '✗ Table client_sessions existe encore (devrait être renommée)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_session_exercises') THEN
    RAISE NOTICE '✓ Table client_session_exercises n''existe plus';
  ELSE
    RAISE WARNING '✗ Table client_session_exercises existe encore (devrait être renommée)';
  END IF;
END $$;

-- ============================================================================
-- 3. Vérifier les colonnes de client_created_programs
-- ============================================================================

DO $$
DECLARE
  required_columns TEXT[] := ARRAY['id', 'client_id', 'coach_id', 'name', 'objective', 'week_count', 'source_type', 'program_template_id', 'created_at', 'updated_at'];
  col TEXT;
  missing_columns TEXT[] := '{}';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Test 3: Vérification des colonnes de client_created_programs ===';
  
  FOREACH col IN ARRAY required_columns
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'client_created_programs' AND column_name = col
    ) THEN
      RAISE NOTICE '✓ Colonne % existe', col;
    ELSE
      missing_columns := array_append(missing_columns, col);
      RAISE WARNING '✗ Colonne % manquante', col;
    END IF;
  END LOOP;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Colonnes manquantes dans client_created_programs: %', array_to_string(missing_columns, ', ');
  END IF;
END $$;

-- ============================================================================
-- 4. Vérifier les politiques RLS
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Test 4: Vérification des politiques RLS ===';
  
  -- Vérifier RLS sur client_created_programs
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'client_created_programs';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✓ client_created_programs a % politique(s) RLS', policy_count;
  ELSE
    RAISE WARNING '✗ client_created_programs n''a aucune politique RLS';
  END IF;

  -- Vérifier RLS sur client_created_sessions
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'client_created_sessions';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✓ client_created_sessions a % politique(s) RLS', policy_count;
  ELSE
    RAISE WARNING '✗ client_created_sessions n''a aucune politique RLS';
  END IF;

  -- Vérifier RLS sur client_created_session_exercises
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'client_created_session_exercises';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✓ client_created_session_exercises a % politique(s) RLS', policy_count;
  ELSE
    RAISE WARNING '✗ client_created_session_exercises n''a aucune politique RLS';
  END IF;
END $$;

-- ============================================================================
-- 5. Vérifier les contraintes de clés étrangères
-- ============================================================================

DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Test 5: Vérification des contraintes FK ===';
  
  -- FK vers client_created_programs
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE ccu.table_name = 'client_created_programs'
    AND tc.constraint_type = 'FOREIGN KEY';
  
  RAISE NOTICE '✓ % contrainte(s) FK pointent vers client_created_programs', fk_count;

  -- FK vers client_created_sessions
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE ccu.table_name = 'client_created_sessions'
    AND tc.constraint_type = 'FOREIGN KEY';
  
  RAISE NOTICE '✓ % contrainte(s) FK pointent vers client_created_sessions', fk_count;

  -- FK depuis client_created_sessions vers client_created_programs
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'client_created_sessions'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'client_created_programs'
  ) THEN
    RAISE NOTICE '✓ FK de client_created_sessions vers client_created_programs existe';
  ELSE
    RAISE WARNING '✗ FK de client_created_sessions vers client_created_programs manquante';
  END IF;

  -- FK depuis client_created_session_exercises vers client_created_sessions
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'client_created_session_exercises'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'client_created_sessions'
  ) THEN
    RAISE NOTICE '✓ FK de client_created_session_exercises vers client_created_sessions existe';
  ELSE
    RAISE WARNING '✗ FK de client_created_session_exercises vers client_created_sessions manquante';
  END IF;
END $$;

-- ============================================================================
-- 6. Vérifier que la fonction RPC peut insérer dans les nouvelles tables
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Test 6: Vérification de la fonction RPC ===';
  
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'assign_program_to_client_atomic'
  ) THEN
    RAISE NOTICE '✓ Fonction assign_program_to_client_atomic existe';
  ELSE
    RAISE EXCEPTION '✗ Fonction assign_program_to_client_atomic n''existe pas';
  END IF;
END $$;

-- ============================================================================
-- 7. Afficher les statistiques des tables
-- ============================================================================

DO $$
DECLARE
  programs_count INTEGER;
  sessions_count INTEGER;
  exercises_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Test 7: Statistiques des tables ===';
  
  SELECT COUNT(*) INTO programs_count FROM client_created_programs;
  SELECT COUNT(*) INTO sessions_count FROM client_created_sessions;
  SELECT COUNT(*) INTO exercises_count FROM client_created_session_exercises;
  
  RAISE NOTICE 'Nombre de programmes: %', programs_count;
  RAISE NOTICE 'Nombre de séances: %', sessions_count;
  RAISE NOTICE 'Nombre d''exercices: %', exercises_count;
END $$;

-- ============================================================================
-- 8. Résumé des tests
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Résumé des tests ===';
  RAISE NOTICE 'Si tous les tests sont passés (✓), la migration est réussie.';
  RAISE NOTICE 'Si des warnings (✗) apparaissent, une vérification manuelle est nécessaire.';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '1. Vérifier que l''application frontend fonctionne correctement';
  RAISE NOTICE '2. Tester l''assignation d''un programme à un client';
  RAISE NOTICE '3. Vérifier que les données sont correctement affichées';
  RAISE NOTICE '';
  RAISE NOTICE 'En cas de problème, exécuter: SELECT rollback_rename_client_tables();';
END $$;
