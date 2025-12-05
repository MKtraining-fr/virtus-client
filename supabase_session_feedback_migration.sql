-- Migration pour ajouter la table session_feedback
-- Permet de stocker le feedback des clients après chaque séance

CREATE TABLE IF NOT EXISTS session_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  performance_log_id TEXT,
  
  -- Réponses aux questions (0-10)
  pre_fatigue INTEGER CHECK (pre_fatigue >= 0 AND pre_fatigue <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 0 AND sleep_quality <= 10),
  perceived_difficulty INTEGER CHECK (perceived_difficulty >= 0 AND perceived_difficulty <= 10),
  enjoyment INTEGER CHECK (enjoyment >= 0 AND enjoyment <= 10),
  
  -- Commentaire optionnel
  comment TEXT,
  
  -- Métadonnées
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_session_feedback_client ON session_feedback(client_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_session ON session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_submitted ON session_feedback(submitted_at DESC);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE session_feedback IS 'Stocke le feedback des clients après chaque séance d''entraînement';
COMMENT ON COLUMN session_feedback.pre_fatigue IS 'Niveau de fatigue avant la séance (0=très fatigué, 10=en pleine forme)';
COMMENT ON COLUMN session_feedback.sleep_quality IS 'Qualité du sommeil la veille (0=très mal dormi, 10=très bien dormi)';
COMMENT ON COLUMN session_feedback.perceived_difficulty IS 'Difficulté perçue de la séance (0=facile, 10=très difficile)';
COMMENT ON COLUMN session_feedback.enjoyment IS 'Appréciation de la séance (0=pas aimé, 10=adoré)';
