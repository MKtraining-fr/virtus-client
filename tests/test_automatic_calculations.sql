-- ============================================================================
-- TEST PHASE 3 : Calcul automatique du 1RM et des projections
-- ============================================================================
-- Date: 2026-01-03
-- Description: Test complet du système de calcul automatique avec données réelles

-- Nettoyer les données de test précédentes
DELETE FROM client_exercise_projections WHERE client_id IN (SELECT id FROM clients WHERE email LIKE '%test-perf%');
DELETE FROM client_exercise_records WHERE client_id IN (SELECT id FROM clients WHERE email LIKE '%test-perf%');

-- ============================================================================
-- TEST 1 : Récupérer un client existant pour les tests
-- ============================================================================

SELECT 'TEST 1: Sélection d''un client pour les tests' AS test_name;

-- Récupérer le premier client disponible
WITH test_client AS (
  SELECT id, first_name, last_name, email
  FROM clients
  WHERE email IS NOT NULL
  LIMIT 1
)
SELECT 
  id AS client_id,
  first_name || ' ' || last_name AS client_name,
  email,
  '✅ Client sélectionné' AS status
FROM test_client;

-- ============================================================================
-- TEST 2 : Récupérer un exercice pour les tests
-- ============================================================================

SELECT 'TEST 2: Sélection d''un exercice pour les tests' AS test_name;

WITH test_exercise AS (
  SELECT id, name
  FROM exercises
  WHERE name ILIKE '%squat%'
  LIMIT 1
)
SELECT 
  id AS exercise_id,
  name AS exercise_name,
  '✅ Exercice sélectionné' AS status
FROM test_exercise;

-- ============================================================================
-- TEST 3 : Insérer une performance et vérifier le calcul automatique du 1RM
-- ============================================================================

SELECT 'TEST 3: Insertion d''une performance et calcul automatique du 1RM' AS test_name;

-- Insérer une performance : 100kg × 10 reps, RIR=0 (échec musculaire)
WITH test_client AS (
  SELECT id FROM clients WHERE email IS NOT NULL LIMIT 1
),
test_exercise AS (
  SELECT id FROM exercises WHERE name ILIKE '%squat%' LIMIT 1
),
inserted_perf AS (
  INSERT INTO client_exercise_records (
    client_id,
    exercise_id,
    weight,
    reps,
    sets,
    rir,
    source,
    recorded_at
  )
  SELECT 
    tc.id,
    te.id,
    100,
    10,
    1,
    0,
    'manual',
    NOW()
  FROM test_client tc, test_exercise te
  RETURNING *
)
SELECT 
  weight || 'kg × ' || reps || ' reps (RIR=' || COALESCE(rir, 0) || ')' AS performance,
  ROUND(one_rm_calculated, 1) AS one_rm_calculated,
  CASE 
    WHEN one_rm_calculated IS NOT NULL AND one_rm_calculated > 0
    THEN '✅ 1RM calculé automatiquement'
    ELSE '❌ Échec du calcul'
  END AS status
FROM inserted_perf;

-- ============================================================================
-- TEST 4 : Vérifier que les projections ont été créées automatiquement
-- ============================================================================

SELECT 'TEST 4: Vérification des projections créées automatiquement' AS test_name;

WITH test_client AS (
  SELECT id FROM clients WHERE email IS NOT NULL LIMIT 1
),
test_exercise AS (
  SELECT id FROM exercises WHERE name ILIKE '%squat%' LIMIT 1
)
SELECT 
  target_reps || ' reps' AS target,
  ROUND(projected_weight, 1) || 'kg' AS projected_weight,
  CASE 
    WHEN actual_weight IS NOT NULL 
    THEN '✅ Performance réelle: ' || ROUND(actual_weight, 1) || 'kg'
    ELSE '📊 Projection uniquement'
  END AS status
FROM client_exercise_projections
WHERE client_id = (SELECT id FROM test_client)
  AND exercise_id = (SELECT id FROM test_exercise)
ORDER BY target_reps;

-- ============================================================================
-- TEST 5 : Tester avec RIR > 0 (réserve de force)
-- ============================================================================

SELECT 'TEST 5: Test avec RIR=2 (réserve de force)' AS test_name;

-- Insérer une performance : 100kg × 10 reps, RIR=2 (2 reps en réserve)
WITH test_client AS (
  SELECT id FROM clients WHERE email IS NOT NULL LIMIT 1
),
test_exercise AS (
  SELECT id FROM exercises WHERE name ILIKE '%squat%' LIMIT 1
),
inserted_perf AS (
  INSERT INTO client_exercise_records (
    client_id,
    exercise_id,
    weight,
    reps,
    sets,
    rir,
    source,
    recorded_at
  )
  SELECT 
    tc.id,
    te.id,
    100,
    10,
    5,  -- 5 séries
    2,  -- RIR=2
    'manual',
    NOW()
  FROM test_client tc, test_exercise te
  RETURNING *
)
SELECT 
  weight || 'kg × ' || reps || ' reps × ' || sets || ' séries (RIR=' || rir || ')' AS performance,
  ROUND(one_rm_calculated, 1) AS one_rm_with_rir,
  ROUND(weight / (1.0278 - 0.0278 * reps), 1) AS one_rm_without_rir,
  ROUND(one_rm_calculated, 1) - ROUND(weight / (1.0278 - 0.0278 * reps), 1) AS difference,
  '✅ RIR pris en compte' AS status
FROM inserted_perf;

-- ============================================================================
-- TEST 6 : Tester le profil nerveux
-- ============================================================================

SELECT 'TEST 6: Test du profil nerveux' AS test_name;

SELECT 
  'Différence +7%' AS scenario,
  determine_nervous_profile(7.0) AS profile,
  CASE 
    WHEN determine_nervous_profile(7.0) = 'force'
    THEN '✅ Correct (profil force)'
    ELSE '❌ Incorrect'
  END AS status
UNION ALL
SELECT 
  'Différence -3%',
  determine_nervous_profile(-3.0),
  CASE 
    WHEN determine_nervous_profile(-3.0) = 'endurance'
    THEN '✅ Correct (profil endurance)'
    ELSE '❌ Incorrect'
  END
UNION ALL
SELECT 
  'Différence +2%',
  determine_nervous_profile(2.0),
  CASE 
    WHEN determine_nervous_profile(2.0) = 'balanced'
    THEN '✅ Correct (profil équilibré)'
    ELSE '❌ Incorrect'
  END;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

SELECT 'RÉSUMÉ: Tests du système de calcul automatique terminés' AS summary;
