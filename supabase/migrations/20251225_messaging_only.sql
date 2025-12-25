-- Migration: Améliorations de la messagerie (colonnes et table documents uniquement)
-- Date: 2025-12-25
-- Note: Ce script ne touche PAS aux politiques de la table clients

-- ============================================================================
-- ÉTAPE 1: Ajouter les colonnes à la table messages
-- ============================================================================

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_type_check 
  CHECK (message_type IN ('text', 'voice', 'document'));

-- ============================================================================
-- ÉTAPE 2: Créer la table client_documents
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON public.client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_coach_id ON public.client_documents(coach_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_uploaded_by ON public.client_documents(uploaded_by);

ALTER TABLE public.client_documents DROP CONSTRAINT IF EXISTS client_documents_category_check;
ALTER TABLE public.client_documents ADD CONSTRAINT client_documents_category_check 
  CHECK (category IN ('medical', 'identity', 'contract', 'progress', 'nutrition', 'other'));

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 3: Politiques RLS pour client_documents UNIQUEMENT
-- ============================================================================

DROP POLICY IF EXISTS "admin_full_access_client_documents" ON public.client_documents;
CREATE POLICY "admin_full_access_client_documents" ON public.client_documents
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "coach_view_client_documents" ON public.client_documents;
CREATE POLICY "coach_view_client_documents" ON public.client_documents
FOR SELECT TO authenticated
USING (coach_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "coach_insert_client_documents" ON public.client_documents;
CREATE POLICY "coach_insert_client_documents" ON public.client_documents
FOR INSERT TO authenticated
WITH CHECK (uploaded_by = auth.uid() AND (public.is_coach() OR public.is_admin()));

DROP POLICY IF EXISTS "client_view_own_documents" ON public.client_documents;
CREATE POLICY "client_view_own_documents" ON public.client_documents
FOR SELECT TO authenticated
USING (client_id = auth.uid());

DROP POLICY IF EXISTS "client_insert_own_documents" ON public.client_documents;
CREATE POLICY "client_insert_own_documents" ON public.client_documents
FOR INSERT TO authenticated
WITH CHECK (client_id = auth.uid() AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "user_delete_own_uploads" ON public.client_documents;
CREATE POLICY "user_delete_own_uploads" ON public.client_documents
FOR DELETE TO authenticated
USING (uploaded_by = auth.uid() OR public.is_admin());

-- ============================================================================
-- ÉTAPE 4: Fonction helper pour marquer les messages comme lus
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_message_as_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read_at IS NULL AND OLD.read_at IS NULL THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
