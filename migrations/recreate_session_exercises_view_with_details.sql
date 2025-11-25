-- Migration: Recréer la vue session_exercises avec la colonne details
-- Date: 2025-11-25
-- Description: Ajoute la colonne details à la vue session_exercises

-- Supprimer la vue existante
DROP VIEW IF EXISTS session_exercises;

-- Recréer la vue avec la colonne details
CREATE VIEW session_exercises AS
SELECT 
  id,
  session_template_id AS session_id,
  coach_id,
  exercise_id,
  exercise_order,
  sets,
  reps,
  load,
  tempo,
  rest_time,
  intensification,
  notes,
  details, -- ✅ Nouvelle colonne
  created_at,
  updated_at
FROM session_exercise_templates;
