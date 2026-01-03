-- ============================================================
-- MIGRATION: Mise à jour du template "Bilan Initial"
-- Date: 2026-01-03
-- Description: Suppression de l'option "Autre" pour le champ Sexe
-- Justification: Les calculs physiologiques nécessitent une distinction binaire homme/femme
-- ============================================================

-- Mettre à jour le template de bilan initial pour ne garder que Homme et Femme
UPDATE bilan_templates 
SET sections = jsonb_set(
  sections, 
  '{0,fields,3,options}', 
  '["Homme", "Femme"]'::jsonb
)
WHERE coach_id IS NULL 
  AND name = 'Bilan Initial'
  AND sections->0->'fields'->3->>'id' = 'sexe';

-- Vérification
SELECT 
  id, 
  name, 
  sections->0->'fields'->3->>'label' as field_label,
  sections->0->'fields'->3->'options' as options
FROM bilan_templates
WHERE coach_id IS NULL AND name = 'Bilan Initial';

-- ============================================================
-- Résultat attendu:
-- Le champ "Sexe" ne doit avoir que les options: ["Homme", "Femme"]
-- ============================================================
