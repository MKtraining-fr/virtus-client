-- Migration: Ajouter la colonne details à client_session_exercises
-- Date: 2025-11-25
-- Description: Permet de stocker des valeurs différentes par série (reps, load, tempo, rest)

-- Ajouter la colonne details (JSONB, nullable pour compatibilité avec les données existantes)
ALTER TABLE client_session_exercises
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT NULL;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN client_session_exercises.details IS 
'Détails par série pour cet exercice. Format: [{ reps: "12", load: { value: "80", unit: "kg" }, tempo: "2010", rest: "60s" }]. Si NULL, utiliser les colonnes reps, load, tempo, rest_time (ancien format).';

-- Index pour améliorer les performances de requêtes sur details
CREATE INDEX IF NOT EXISTS idx_client_session_exercises_details 
ON client_session_exercises USING GIN (details);
