-- Migration: Mettre à jour la vue session_exercises pour inclure details
-- Date: 2025-11-25
-- Description: Ajoute la colonne details à la vue pour permettre l'accès aux détails par série

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
  details, -- ✅ Ajout de la colonne details
  created_at,
  updated_at
FROM session_exercise_templates;
