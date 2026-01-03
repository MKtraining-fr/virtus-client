-- Mettre à jour les triggers pour utiliser client_exercise_records
-- Date: 2026-01-03

-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS calculate_one_rm_trigger ON client_exercise_performance;
DROP TRIGGER IF EXISTS update_projections_trigger ON client_exercise_performance;

-- Créer les triggers sur client_exercise_records
CREATE TRIGGER calculate_one_rm_trigger
BEFORE INSERT OR UPDATE ON client_exercise_records
FOR EACH ROW
EXECUTE FUNCTION calculate_one_rm();

CREATE TRIGGER update_projections_trigger
AFTER INSERT OR UPDATE ON client_exercise_records
FOR EACH ROW
EXECUTE FUNCTION update_projections_after_performance();

-- Mettre à jour la fonction update_projections_after_performance pour référencer client_exercise_records
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

-- Mettre à jour la référence dans client_exercise_projections
ALTER TABLE client_exercise_projections 
  DROP CONSTRAINT IF EXISTS client_exercise_projections_based_on_performance_id_fkey;

ALTER TABLE client_exercise_projections 
  ADD CONSTRAINT client_exercise_projections_based_on_performance_id_fkey 
  FOREIGN KEY (based_on_performance_id) 
  REFERENCES client_exercise_records(id) ON DELETE CASCADE;

ALTER TABLE client_exercise_projections 
  DROP CONSTRAINT IF EXISTS client_exercise_projections_actual_performance_id_fkey;

ALTER TABLE client_exercise_projections 
  ADD CONSTRAINT client_exercise_projections_actual_performance_id_fkey 
  FOREIGN KEY (actual_performance_id) 
  REFERENCES client_exercise_records(id) ON DELETE SET NULL;
