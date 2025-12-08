-- Ajouter la colonne viewed_by_coach à client_sessions
ALTER TABLE client_sessions
ADD COLUMN IF NOT EXISTS viewed_by_coach BOOLEAN DEFAULT FALSE;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_client_sessions_viewed_by_coach 
ON client_sessions(viewed_by_coach) 
WHERE viewed_by_coach = FALSE;

-- Commentaire sur la colonne
COMMENT ON COLUMN client_sessions.viewed_by_coach IS 'Indique si le coach a visualisé cette séance complétée par le client';
