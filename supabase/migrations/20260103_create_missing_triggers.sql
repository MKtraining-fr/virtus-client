-- Créer les triggers manquants pour le système de performances
-- Date: 2026-01-03

-- Fonction: Calculer le 1RM avec formule de Brzycki et ajustement RIR
CREATE OR REPLACE FUNCTION calculate_one_rm()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcul du 1RM avec formule de Brzycki (valide pour 1-10 reps)
  IF NEW.reps > 0 AND NEW.reps <= 10 THEN
    -- Calcul brut
    NEW.one_rm_calculated := NEW.weight / (1.0278 - 0.0278 * NEW.reps);
    
    -- Ajustement selon le RIR (Reps In Reserve)
    -- Chaque RIR réduit le 1RM de 2.5%
    IF NEW.rir IS NOT NULL AND NEW.rir > 0 THEN
      NEW.one_rm_calculated := NEW.one_rm_calculated * (1 - NEW.rir * 0.025);
    END IF;
  ELSIF NEW.reps > 10 THEN
    -- Pour plus de 10 reps, utiliser une estimation plus conservative
    NEW.one_rm_calculated := NEW.weight * (1 + NEW.reps / 30.0);  -- Formule d'Epley
    
    -- Ajustement RIR
    IF NEW.rir IS NOT NULL AND NEW.rir > 0 THEN
      NEW.one_rm_calculated := NEW.one_rm_calculated * (1 - NEW.rir * 0.025);
    END IF;
  ELSE
    NEW.one_rm_calculated := NULL;
  END IF;
  
  -- Mettre à jour le timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Calculer automatiquement le 1RM
DROP TRIGGER IF EXISTS calculate_one_rm_trigger ON client_exercise_performance;
CREATE TRIGGER calculate_one_rm_trigger
BEFORE INSERT OR UPDATE ON client_exercise_performance
FOR EACH ROW
EXECUTE FUNCTION calculate_one_rm();

-- Fonction: Mettre à jour les projections après une nouvelle performance
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

-- Trigger: Mettre à jour les projections après insertion d'une performance
DROP TRIGGER IF EXISTS update_projections_trigger ON client_exercise_performance;
CREATE TRIGGER update_projections_trigger
AFTER INSERT OR UPDATE ON client_exercise_performance
FOR EACH ROW
EXECUTE FUNCTION update_projections_after_performance();

-- Trigger pour client_training_info
DROP TRIGGER IF EXISTS update_client_training_info_updated_at ON client_training_info;
CREATE TRIGGER update_client_training_info_updated_at
BEFORE UPDATE ON client_training_info
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour client_exercise_projections
DROP TRIGGER IF EXISTS update_projections_updated_at ON client_exercise_projections;
CREATE TRIGGER update_projections_updated_at
BEFORE UPDATE ON client_exercise_projections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
