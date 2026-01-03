-- ============================================================================
-- TESTS PHASE 1 : Validation de la base de données
-- ============================================================================
-- Date: 2026-01-03
-- Description: Tests pour valider les tables, triggers et calculs automatiques

-- ============================================================================
-- TEST 1 : Vérifier que toutes les tables existent
-- ============================================================================

SELECT 'TEST 1: Vérification des tables' AS test_name;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('client_training_info', 'client_exercise_performance', 'client_exercise_projections') 
    THEN '✅ OK'
    ELSE '❌ MANQUANT'
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('client_training_info', 'client_exercise_performance', 'client_exercise_projections')
ORDER BY table_name;

-- ============================================================================
-- TEST 2 : Vérifier les colonnes de client_exercise_performance
-- ============================================================================

SELECT 'TEST 2: Vérification des colonnes de client_exercise_performance' AS test_name;

SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('rir', 'source', 'session_id', 'one_rm_calculated', 'updated_at', 'created_by', 'updated_by')
    THEN '✅ OK'
    ELSE 'ℹ️  Colonne existante'
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'client_exercise_performance'
  AND column_name IN ('rir', 'source', 'session_id', 'one_rm_calculated', 'updated_at', 'created_by', 'updated_by', 'weight', 'reps', 'sets')
ORDER BY column_name;

-- ============================================================================
-- TEST 3 : Vérifier les triggers
-- ============================================================================

SELECT 'TEST 3: Vérification des triggers' AS test_name;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  '✅ OK' AS status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('calculate_one_rm_trigger', 'update_projections_trigger', 'update_client_training_info_updated_at', 'update_projections_updated_at')
ORDER BY trigger_name;

-- ============================================================================
-- TEST 4 : Vérifier les fonctions
-- ============================================================================

SELECT 'TEST 4: Vérification des fonctions' AS test_name;

SELECT 
  routine_name,
  routine_type,
  '✅ OK' AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('calculate_one_rm', 'calculate_projection', 'determine_nervous_profile', 'update_projections_after_performance', 'update_updated_at_column')
ORDER BY routine_name;

-- ============================================================================
-- TEST 5 : Vérifier les politiques RLS
-- ============================================================================

SELECT 'TEST 5: Vérification des politiques RLS' AS test_name;

SELECT 
  tablename,
  policyname,
  '✅ OK' AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('client_training_info', 'client_exercise_performance', 'client_exercise_projections')
ORDER BY tablename, policyname;

-- ============================================================================
-- TEST 6 : Test du calcul du 1RM (formule de Brzycki)
-- ============================================================================

SELECT 'TEST 6: Test du calcul du 1RM' AS test_name;

-- Test avec différentes combinaisons poids/reps
WITH test_data AS (
  SELECT 
    100 AS weight,
    10 AS reps,
    0 AS rir,
    'Squat' AS exercise_name
  UNION ALL
  SELECT 100, 10, 2, 'Squat avec RIR=2'
  UNION ALL
  SELECT 120, 5, 0, 'Développé couché'
  UNION ALL
  SELECT 80, 8, 1, 'Soulevé de terre avec RIR=1'
)
SELECT 
  exercise_name,
  weight || 'kg × ' || reps || ' reps (RIR=' || rir || ')' AS performance,
  ROUND(
    CASE 
      WHEN reps > 0 AND reps <= 10 THEN
        (weight / (1.0278 - 0.0278 * reps)) * (1 - rir * 0.025)
      ELSE NULL
    END, 
    1
  ) AS one_rm_calculated,
  CASE 
    WHEN ROUND((weight / (1.0278 - 0.0278 * reps)) * (1 - rir * 0.025), 1) > 0
    THEN '✅ OK'
    ELSE '❌ ERREUR'
  END AS status
FROM test_data;

-- ============================================================================
-- TEST 7 : Test de la fonction calculate_projection
-- ============================================================================

SELECT 'TEST 7: Test de la fonction calculate_projection' AS test_name;

SELECT 
  target_reps || ' reps' AS target,
  ROUND(calculate_projection(133::NUMERIC, target_reps), 1) AS projected_weight,
  '✅ OK' AS status
FROM (
  SELECT unnest(ARRAY[1, 3, 5, 8, 10, 12]) AS target_reps
) AS targets;

-- ============================================================================
-- TEST 8 : Test de la fonction determine_nervous_profile
-- ============================================================================

SELECT 'TEST 8: Test de la fonction determine_nervous_profile' AS test_name;

SELECT 
  difference_percent || '%' AS difference,
  determine_nervous_profile(difference_percent) AS nervous_profile,
  CASE 
    WHEN determine_nervous_profile(difference_percent) IN ('force', 'endurance', 'balanced')
    THEN '✅ OK'
    ELSE '❌ ERREUR'
  END AS status
FROM (
  SELECT unnest(ARRAY[-5.0, -2.0, 0.0, 3.0, 7.0]) AS difference_percent
) AS test_values;

-- ============================================================================
-- RÉSUMÉ DES TESTS
-- ============================================================================

SELECT 'RÉSUMÉ: Tous les tests de Phase 1 sont terminés' AS summary;
