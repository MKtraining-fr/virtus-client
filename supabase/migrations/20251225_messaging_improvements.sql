-- Migration: Améliorations de la messagerie
-- Date: 2025-12-25
-- Description: Ajout indicateur de lecture, messages vocaux, pièces jointes et documents clients

-- ============================================================================
-- ÉTAPE 1: Ajouter les colonnes à la table messages
-- ============================================================================

-- Colonne pour l'horodatage de lecture (indicateur "vu")
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Type de message (text, voice, document)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';

-- Pièces jointes
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Durée des messages vocaux (en secondes)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER;

-- Contrainte pour le type de message
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

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON public.client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_coach_id ON public.client_documents(coach_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_uploaded_by ON public.client_documents(uploaded_by);

-- Contrainte pour la catégorie de document
ALTER TABLE public.client_documents DROP CONSTRAINT IF EXISTS client_documents_category_check;
ALTER TABLE public.client_documents ADD CONSTRAINT client_documents_category_check 
  CHECK (category IN ('medical', 'identity', 'contract', 'progress', 'nutrition', 'other'));

-- ============================================================================
-- ÉTAPE 3: Activer RLS sur client_documents
-- ============================================================================

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 4: Politiques RLS pour client_documents
-- ============================================================================

-- Supprimer les politiques existantes si elles existent (évite les erreurs)
DROP POLICY IF EXISTS "clients_can_view_own_profile" ON public.clients;
DROP POLICY IF EXISTS "clients_can_view_their_coach" ON public.clients;

-- Les admins peuvent tout voir
DROP POLICY IF EXISTS "admin_full_access_client_documents" ON public.client_documents;
CREATE POLICY "admin_full_access_client_documents" ON public.client_documents
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Les coachs peuvent voir les documents de leurs clients
DROP POLICY IF EXISTS "coach_view_client_documents" ON public.client_documents;
CREATE POLICY "coach_view_client_documents" ON public.client_documents
FOR SELECT TO authenticated
USING (
  coach_id = auth.uid()
  OR public.is_admin()
);

-- Les coachs peuvent ajouter des documents pour leurs clients
DROP POLICY IF EXISTS "coach_insert_client_documents" ON public.client_documents;
CREATE POLICY "coach_insert_client_documents" ON public.client_documents
FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND (
    public.is_coach()
    OR public.is_admin()
  )
);

-- Les clients peuvent voir leurs propres documents
DROP POLICY IF EXISTS "client_view_own_documents" ON public.client_documents;
CREATE POLICY "client_view_own_documents" ON public.client_documents
FOR SELECT TO authenticated
USING (client_id = auth.uid());

-- Les clients peuvent ajouter leurs propres documents
DROP POLICY IF EXISTS "client_insert_own_documents" ON public.client_documents;
CREATE POLICY "client_insert_own_documents" ON public.client_documents
FOR INSERT TO authenticated
WITH CHECK (
  client_id = auth.uid()
  AND uploaded_by = auth.uid()
);

-- Les utilisateurs peuvent supprimer les documents qu'ils ont uploadés
DROP POLICY IF EXISTS "user_delete_own_uploads" ON public.client_documents;
CREATE POLICY "user_delete_own_uploads" ON public.client_documents
FOR DELETE TO authenticated
USING (
  uploaded_by = auth.uid()
  OR public.is_admin()
);

-- ============================================================================
-- ÉTAPE 5: Mettre à jour les politiques RLS de messages pour les nouvelles colonnes
-- ============================================================================

-- Fonction pour mettre à jour read_at quand un message est lu
CREATE OR REPLACE FUNCTION public.mark_message_as_read()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour read_at seulement si le destinataire lit le message
  IF NEW.read_at IS NULL AND OLD.read_at IS NULL THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 6: Commentaires pour la documentation
-- ============================================================================

COMMENT ON TABLE public.client_documents IS 'Documents partagés entre coachs et clients (conformité RGPD)';
COMMENT ON COLUMN public.client_documents.client_id IS 'Client propriétaire du document';
COMMENT ON COLUMN public.client_documents.coach_id IS 'Coach ayant accès au document';
COMMENT ON COLUMN public.client_documents.uploaded_by IS 'Utilisateur ayant téléversé le document';
COMMENT ON COLUMN public.client_documents.category IS 'Catégorie: medical, identity, contract, progress, nutrition, other';

COMMENT ON COLUMN public.messages.read_at IS 'Horodatage de lecture par le destinataire (indicateur vu)';
COMMENT ON COLUMN public.messages.message_type IS 'Type de message: text, voice, document';
COMMENT ON COLUMN public.messages.attachment_url IS 'URL du fichier joint dans Supabase Storage';
COMMENT ON COLUMN public.messages.voice_duration IS 'Durée du message vocal en secondes';
