-- Migration: Création de la table photo_sessions pour gérer les sessions de photos
-- Date: 2026-01-08
-- Description: Permet de regrouper plusieurs photos uploadées ensemble en sessions

-- ============================================================================
-- CRÉATION DE LA TABLE photo_sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.photo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_photo_sessions_client_id ON public.photo_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_coach_id ON public.photo_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_session_date ON public.photo_sessions(session_date DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_photo_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_photo_sessions_updated_at
  BEFORE UPDATE ON public.photo_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_sessions_updated_at();

-- ============================================================================
-- AJOUT DE LA COLONNE session_id À client_documents
-- ============================================================================

-- Ajouter la colonne session_id si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_documents' 
    AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.client_documents 
    ADD COLUMN session_id UUID REFERENCES public.photo_sessions(id) ON DELETE SET NULL;
    
    -- Index pour améliorer les performances
    CREATE INDEX idx_client_documents_session_id ON public.client_documents(session_id);
  END IF;
END $$;

-- ============================================================================
-- ACTIVATION DE RLS
-- ============================================================================

ALTER TABLE public.photo_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLITIQUES RLS POUR photo_sessions
-- ============================================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "client_view_own_sessions" ON public.photo_sessions;
DROP POLICY IF EXISTS "coach_view_client_sessions" ON public.photo_sessions;
DROP POLICY IF EXISTS "client_insert_own_sessions" ON public.photo_sessions;
DROP POLICY IF EXISTS "coach_insert_client_sessions" ON public.photo_sessions;

-- 1. Le client peut voir ses propres sessions
CREATE POLICY "client_view_own_sessions"
ON public.photo_sessions
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- 2. Le coach peut voir les sessions de ses clients
CREATE POLICY "coach_view_client_sessions"
ON public.photo_sessions
FOR SELECT
TO authenticated
USING (
  coach_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = client_id 
    AND coach_id = auth.uid()
  )
);

-- 3. Le client peut créer ses propres sessions
-- (via l'upload de photos multiples)
CREATE POLICY "client_insert_own_sessions"
ON public.photo_sessions
FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

-- 4. Le coach peut créer des sessions pour ses clients
CREATE POLICY "coach_insert_client_sessions"
ON public.photo_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = client_id 
    AND coach_id = auth.uid()
  )
);

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.photo_sessions IS 'Sessions de photos regroupant plusieurs photos uploadées ensemble';
COMMENT ON COLUMN public.photo_sessions.id IS 'Identifiant unique de la session';
COMMENT ON COLUMN public.photo_sessions.client_id IS 'ID du client propriétaire de la session';
COMMENT ON COLUMN public.photo_sessions.coach_id IS 'ID du coach du client';
COMMENT ON COLUMN public.photo_sessions.session_date IS 'Date de la session (par défaut date de création)';
COMMENT ON COLUMN public.photo_sessions.description IS 'Description optionnelle de la session';
COMMENT ON COLUMN public.photo_sessions.created_at IS 'Date de création de la session';
COMMENT ON COLUMN public.photo_sessions.updated_at IS 'Date de dernière modification';
