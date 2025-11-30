-- Script de Test pour Valider la Correction du Bug de Persistance des Performances
-- Date: 2025-11-30
-- Auteur: Manus AI Assistant

-- ============================================================================
-- PARTIE 1 : VÉRIFICATIONS PRÉALABLES
-- ============================================================================

-- 1.1 Vérifier l'existence des tables
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('client_programs', 'client_sessions', 'client_session_exercises', 'performance_logs') 
    THEN '✅' 
    ELSE '❌' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('client_programs', 'client_sessions', 'client_session_exercises', 'performance_logs')
ORDER BY table_name;

-- 1.2 Compter les enregistrements actuels
SELECT 
  'client_programs' as table_name, 
  COUNT(*) as count 
FROM client_programs
UNION ALL
SELECT 
  'client_sessions', 
  COUNT(*) 
FROM client_sessions
UNION ALL
SELECT 
  'client_session_exercises', 
  COUNT(*) 
FROM client_session_exercises
UNION ALL
SELECT 
  'performance_logs', 
  COUNT(*) 
FROM performance_logs;

-- ============================================================================
-- PARTIE 2 : VÉRIFICATION DE LA STRUCTURE
-- ============================================================================

-- 2.1 Vérifier la structure de performance_logs
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'performance_logs'
ORDER BY ordinal_position;

-- 2.2 Vérifier les contraintes de clés étrangères
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'performance_logs';

-- ============================================================================
-- PARTIE 3 : DONNÉES DE TEST
-- ============================================================================

-- 3.1 Récupérer un client de test avec un programme assigné
SELECT 
  c.id as client_id,
  c.first_name,
  c.last_name,
  pa.id as assignment_id,
  cp.id as client_program_id,
  cp.name as program_name
FROM clients c
JOIN program_assignments pa ON c.id = pa.client_id
JOIN client_programs cp ON pa.id = cp.assignment_id
WHERE c.role = 'client'
  AND pa.status = 'active'
LIMIT 1;

-- 3.2 Récupérer une séance de test avec ses exercices
WITH test_client AS (
  SELECT 
    c.id as client_id,
    cp.id as client_program_id
  FROM clients c
  JOIN program_assignments pa ON c.id = pa.client_id
  JOIN client_programs cp ON pa.id = cp.assignment_id
  WHERE c.role = 'client'
    AND pa.status = 'active'
  LIMIT 1
)
SELECT 
  cs.id as client_session_id,
  cs.name as session_name,
  cs.week_number,
  cs.session_order,
  cs.status,
  COUNT(cse.id) as exercise_count
FROM test_client tc
JOIN client_sessions cs ON tc.client_program_id = cs.client_program_id
JOIN client_session_exercises cse ON cs.id = cse.client_session_id
GROUP BY cs.id, cs.name, cs.week_number, cs.session_order, cs.status
ORDER BY cs.week_number, cs.session_order
LIMIT 5;

-- 3.3 Récupérer les exercices d'une séance de test
WITH test_session AS (
  SELECT cs.id as client_session_id
  FROM clients c
  JOIN program_assignments pa ON c.id = pa.client_id
  JOIN client_programs cp ON pa.id = cp.assignment_id
  JOIN client_sessions cs ON cp.id = cs.client_program_id
  WHERE c.role = 'client'
    AND pa.status = 'active'
    AND cs.status = 'pending'
  LIMIT 1
)
SELECT 
  cse.id as client_session_exercise_id,
  cse.exercise_id,
  e.name as exercise_name,
  cse.sets,
  cse.reps,
  cse.load,
  cse.exercise_order
FROM test_session ts
JOIN client_session_exercises cse ON ts.client_session_id = cse.client_session_id
JOIN exercises e ON cse.exercise_id = e.id
ORDER BY cse.exercise_order;

-- ============================================================================
-- PARTIE 4 : SIMULATION D'INSERTION (À ADAPTER)
-- ============================================================================

-- 4.1 Exemple d'insertion de performance (REMPLACER LES UUIDs)
-- ATTENTION: Remplacer les valeurs ci-dessous par des UUIDs réels de votre base

-- INSERT INTO performance_logs (
--   client_session_exercise_id,
--   client_id,
--   set_number,
--   reps_achieved,
--   load_achieved,
--   rpe,
--   notes,
--   performed_at
-- ) VALUES (
--   'REMPLACER_PAR_CLIENT_SESSION_EXERCISE_ID',
--   'REMPLACER_PAR_CLIENT_ID',
--   1,
--   10,
--   '50kg',
--   7,
--   'Test de validation du bugfix',
--   NOW()
-- );

-- ============================================================================
-- PARTIE 5 : VÉRIFICATION POST-INSERTION
-- ============================================================================

-- 5.1 Vérifier les performances enregistrées (après test)
SELECT 
  pl.id,
  pl.client_id,
  c.first_name,
  c.last_name,
  pl.set_number,
  pl.reps_achieved,
  pl.load_achieved,
  pl.rpe,
  pl.notes,
  pl.performed_at,
  cse.exercise_id,
  e.name as exercise_name,
  cs.name as session_name
FROM performance_logs pl
JOIN client_session_exercises cse ON pl.client_session_exercise_id = cse.id
JOIN exercises e ON cse.exercise_id = e.id
JOIN client_sessions cs ON cse.client_session_id = cs.id
JOIN clients c ON pl.client_id = c.id
ORDER BY pl.performed_at DESC
LIMIT 20;

-- 5.2 Vérifier le statut des séances après validation
SELECT 
  cs.id,
  cs.name,
  cs.week_number,
  cs.session_order,
  cs.status,
  cs.completed_at,
  COUNT(DISTINCT pl.id) as performance_count,
  COUNT(DISTINCT cse.id) as exercise_count
FROM client_sessions cs
LEFT JOIN client_session_exercises cse ON cs.id = cse.client_session_id
LEFT JOIN performance_logs pl ON cse.id = pl.client_session_exercise_id
GROUP BY cs.id, cs.name, cs.week_number, cs.session_order, cs.status, cs.completed_at
ORDER BY cs.completed_at DESC NULLS LAST
LIMIT 10;

-- 5.3 Statistiques globales par client
SELECT 
  c.id,
  c.first_name,
  c.last_name,
  c.role,
  COUNT(DISTINCT pl.id) as total_performances,
  COUNT(DISTINCT cse.client_session_id) as sessions_with_data,
  COUNT(DISTINCT cs_completed.id) as sessions_completed,
  MAX(pl.performed_at) as last_performance_date
FROM clients c
LEFT JOIN performance_logs pl ON c.id = pl.client_id
LEFT JOIN client_session_exercises cse ON pl.client_session_exercise_id = cse.id
LEFT JOIN client_sessions cs_completed ON c.id = cs_completed.client_id AND cs_completed.status = 'completed'
WHERE c.role = 'client'
GROUP BY c.id, c.first_name, c.last_name, c.role
ORDER BY total_performances DESC;

-- ============================================================================
-- PARTIE 6 : TESTS DE COHÉRENCE
-- ============================================================================

-- 6.1 Vérifier qu'il n'y a pas de performance_logs orphelines
SELECT 
  pl.id,
  pl.client_session_exercise_id,
  pl.client_id
FROM performance_logs pl
LEFT JOIN client_session_exercises cse ON pl.client_session_exercise_id = cse.id
WHERE cse.id IS NULL;
-- Résultat attendu: 0 ligne

-- 6.2 Vérifier que toutes les séances complétées ont des performances
SELECT 
  cs.id,
  cs.name,
  cs.status,
  cs.completed_at,
  COUNT(pl.id) as performance_count
FROM client_sessions cs
LEFT JOIN client_session_exercises cse ON cs.id = cse.client_session_id
LEFT JOIN performance_logs pl ON cse.id = pl.client_session_exercise_id
WHERE cs.status = 'completed'
GROUP BY cs.id, cs.name, cs.status, cs.completed_at
HAVING COUNT(pl.id) = 0;
-- Résultat attendu après correction: 0 ligne (toutes les séances complétées ont des performances)

-- 6.3 Vérifier la cohérence des dates
SELECT 
  cs.id,
  cs.name,
  cs.completed_at as session_completed_at,
  MIN(pl.performed_at) as first_performance_at,
  MAX(pl.performed_at) as last_performance_at
FROM client_sessions cs
JOIN client_session_exercises cse ON cs.id = cse.client_session_id
JOIN performance_logs pl ON cse.id = pl.client_session_exercise_id
WHERE cs.status = 'completed'
GROUP BY cs.id, cs.name, cs.completed_at
HAVING cs.completed_at < MIN(pl.performed_at) OR cs.completed_at < MAX(pl.performed_at);
-- Résultat attendu: 0 ligne (les performances sont enregistrées avant ou en même temps que la complétion)

-- ============================================================================
-- PARTIE 7 : NETTOYAGE (SI NÉCESSAIRE)
-- ============================================================================

-- 7.1 Supprimer les données de test (DÉCOMMENTER SI BESOIN)
-- DELETE FROM performance_logs 
-- WHERE notes = 'Test de validation du bugfix';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Notes:
-- - Exécuter les requêtes une par une pour comprendre l'état de la base
-- - Adapter les UUIDs dans la partie 4 pour tester l'insertion
-- - Les parties 5 et 6 permettent de valider que le bugfix fonctionne
-- - Utiliser la partie 7 pour nettoyer les données de test
