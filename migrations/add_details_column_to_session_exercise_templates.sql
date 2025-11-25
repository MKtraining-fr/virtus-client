-- Migration: Ajouter la colonne details à session_exercise_templates
-- Date: 2025-11-25
-- Description: Permet de stocker des valeurs différentes par série dans les templates

-- Ajouter la colonne details (JSONB, nullable pour compatibilité)
ALTER TABLE session_exercise_templates
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT NULL;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN session_exercise_templates.details IS 
'Détails par série pour cet exercice template. Format: [{ reps: "12", load: { value: "80", unit: "kg" }, tempo: "2010", rest: "60s" }]. Si NULL, utiliser les colonnes reps, load, tempo, rest_time (ancien format).';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_session_exercise_templates_details 
ON session_exercise_templates USING GIN (details);
