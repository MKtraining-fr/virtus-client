-- Migration: Ajouter la colonne details à session_exercises
-- Date: 2025-11-25
-- Description: Permet de stocker des valeurs différentes par série dans les programmes du coach

-- Ajouter la colonne details (JSONB, nullable pour compatibilité)
ALTER TABLE session_exercises
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT NULL;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN session_exercises.details IS 
'Détails par série pour cet exercice. Format: [{ reps: "12", load: { value: "80", unit: "kg" }, tempo: "2010", rest: "60s" }]. Si NULL, utiliser les colonnes reps, load, tempo, rest_time (ancien format).';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_session_exercises_details 
ON session_exercises USING GIN (details);
