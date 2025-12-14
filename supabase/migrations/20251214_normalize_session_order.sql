-- Migration: Normaliser session_order dans client_sessions
-- Date: 2025-12-14
-- Description: Remplacer les valeurs non consécutives (1, 56, 93, 175...)
--              par des valeurs consécutives (1, 2, 3...) pour chaque semaine

-- ⚠️ IMPORTANT: Ce script modifie les données existantes
-- Faire un backup avant d'exécuter en production

-- Étape 1: Créer une table temporaire avec les nouveaux session_order
CREATE TEMP TABLE temp_session_order_mapping AS
SELECT 
  id,
  client_program_id,
  week_number,
  session_order AS old_session_order,
  ROW_NUMBER() OVER (
    PARTITION BY client_program_id, week_number 
    ORDER BY session_order
  ) AS new_session_order
FROM client_sessions;

-- Étape 2: Afficher un aperçu des changements (pour vérification)
DO $$
DECLARE
  total_sessions INT;
  sessions_to_update INT;
BEGIN
  SELECT COUNT(*) INTO total_sessions FROM client_sessions;
  SELECT COUNT(*) INTO sessions_to_update 
  FROM temp_session_order_mapping 
  WHERE old_session_order != new_session_order;
  
  RAISE NOTICE '=== NORMALISATION DE SESSION_ORDER ===';
  RAISE NOTICE 'Total de séances: %', total_sessions;
  RAISE NOTICE 'Séances à mettre à jour: %', sessions_to_update;
  RAISE NOTICE '';
  RAISE NOTICE 'Exemples de changements:';
END $$;

-- Afficher quelques exemples de changements
SELECT 
  client_program_id,
  week_number,
  old_session_order,
  new_session_order,
  (new_session_order - old_session_order) AS difference
FROM temp_session_order_mapping
WHERE old_session_order != new_session_order
ORDER BY client_program_id, week_number, old_session_order
LIMIT 10;

-- Étape 3: Mettre à jour les session_order
UPDATE client_sessions cs
SET session_order = tm.new_session_order
FROM temp_session_order_mapping tm
WHERE cs.id = tm.id
  AND cs.session_order != tm.new_session_order;

-- Étape 4: Vérifier qu'il n'y a plus de trous dans la numérotation
DO $$
DECLARE
  max_gap INT;
BEGIN
  SELECT MAX(gap) INTO max_gap
  FROM (
    SELECT 
      client_program_id,
      week_number,
      session_order - LAG(session_order) OVER (
        PARTITION BY client_program_id, week_number 
        ORDER BY session_order
      ) AS gap
    FROM client_sessions
  ) gaps
  WHERE gap IS NOT NULL;
  
  IF max_gap > 1 THEN
    RAISE WARNING 'Attention: Il reste des trous dans la numérotation (gap max: %)', max_gap;
  ELSE
    RAISE NOTICE '✅ Normalisation réussie: Tous les session_order sont consécutifs';
  END IF;
END $$;

-- Étape 5: Nettoyer la table temporaire
DROP TABLE temp_session_order_mapping;

-- Étape 6: Afficher un résumé des valeurs finales
SELECT 
  'Valeurs finales de session_order' AS info,
  MIN(session_order) AS min_value,
  MAX(session_order) AS max_value,
  COUNT(DISTINCT session_order) AS distinct_values
FROM client_sessions;

-- Ajouter un commentaire sur la migration
COMMENT ON COLUMN client_sessions.session_order IS 
'Ordre de la séance dans la semaine (valeurs consécutives: 1, 2, 3...). 
Normalisé le 2025-12-14 pour remplacer les valeurs héritées.';
