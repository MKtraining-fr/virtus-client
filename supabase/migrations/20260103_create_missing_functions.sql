-- Créer les fonctions manquantes pour le système de performances
-- Date: 2026-01-03

-- Fonction: Calculer une projection pour un nombre de reps cible
CREATE OR REPLACE FUNCTION calculate_projection(one_rm NUMERIC, target_reps INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  -- Table de correspondance basée sur les standards de force
  RETURN CASE target_reps
    WHEN 1 THEN one_rm * 1.00
    WHEN 2 THEN one_rm * 0.95
    WHEN 3 THEN one_rm * 0.93
    WHEN 4 THEN one_rm * 0.90
    WHEN 5 THEN one_rm * 0.87
    WHEN 6 THEN one_rm * 0.85
    WHEN 7 THEN one_rm * 0.83
    WHEN 8 THEN one_rm * 0.80
    WHEN 9 THEN one_rm * 0.77
    WHEN 10 THEN one_rm * 0.75
    WHEN 12 THEN one_rm * 0.70
    WHEN 15 THEN one_rm * 0.65
    ELSE one_rm / (1.0278 - 0.0278 * target_reps)  -- Formule inverse de Brzycki
  END;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Déterminer le profil nerveux
CREATE OR REPLACE FUNCTION determine_nervous_profile(difference_percent NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF difference_percent > 5 THEN
    RETURN 'force';  -- Surperformance en force pure
  ELSIF difference_percent < -2 THEN
    RETURN 'endurance';  -- Meilleur en endurance
  ELSE
    RETURN 'balanced';  -- Profil équilibré
  END IF;
END;
$$ LANGUAGE plpgsql;
