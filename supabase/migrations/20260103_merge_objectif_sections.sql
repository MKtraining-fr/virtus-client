-- Fusionner les sections "Objectif" et "Objectif et Conditions d'Entraînement"
-- et placer la section fusionnée juste après "Informations Générales"
-- Date: 2026-01-03

DO $$
DECLARE
  current_sections jsonb;
  new_sections jsonb := '[]'::jsonb;
  objectif_section jsonb;
  training_section jsonb;
  merged_fields jsonb := '[]'::jsonb;
BEGIN
  -- Récupérer les sections actuelles
  SELECT sections INTO current_sections
  FROM bilan_templates
  WHERE id = 'cefbfd36-aa7f-401d-8231-403a858238ab';
  
  -- Extraire les champs de la section "objectif"
  SELECT elem->'fields' INTO objectif_section
  FROM jsonb_array_elements(current_sections) elem
  WHERE elem->>'id' = 'objectif';
  
  -- Extraire les champs de la section "training"
  SELECT elem->'fields' INTO training_section
  FROM jsonb_array_elements(current_sections) elem
  WHERE elem->>'id' = 'training';
  
  -- Fusionner les champs des deux sections
  merged_fields := COALESCE(objectif_section, '[]'::jsonb) || COALESCE(training_section, '[]'::jsonb);
  
  -- Construire le nouveau tableau de sections dans l'ordre souhaité:
  -- 1. Informations Générales
  -- 2. Objectif et Conditions d'Entraînement (fusionné)
  -- 3. Vie Quotidienne
  -- 4. Alimentation
  -- 5. Notes et Médical
  
  -- 1. Informations Générales
  SELECT new_sections || elem INTO new_sections
  FROM jsonb_array_elements(current_sections) elem
  WHERE elem->>'id' = 'informations_generales';
  
  -- 2. Section fusionnée "Objectif et Conditions d'Entraînement"
  new_sections := new_sections || jsonb_build_object(
    'id', 'objectif_training',
    'title', 'Objectif et Conditions d''Entraînement',
    'isRemovable', false,
    'fields', merged_fields
  );
  
  -- 3. Vie Quotidienne
  SELECT new_sections || elem INTO new_sections
  FROM jsonb_array_elements(current_sections) elem
  WHERE elem->>'id' = 'vie_quotidienne';
  
  -- 4. Alimentation
  SELECT new_sections || elem INTO new_sections
  FROM jsonb_array_elements(current_sections) elem
  WHERE elem->>'id' = 'alimentation';
  
  -- 5. Notes et Médical
  SELECT new_sections || elem INTO new_sections
  FROM jsonb_array_elements(current_sections) elem
  WHERE elem->>'id' = 'notes_medical';
  
  -- Mettre à jour le template
  UPDATE bilan_templates
  SET sections = new_sections,
      updated_at = NOW()
  WHERE id = 'cefbfd36-aa7f-401d-8231-403a858238ab';
  
  RAISE NOTICE 'Template mis à jour : sections fusionnées et réordonnées';
END $$;
