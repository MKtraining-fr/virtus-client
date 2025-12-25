-- Migration: Correction des politiques RLS pour la table client_documents
-- Date: 2025-12-25
-- Problème: Le client ne voit pas les documents uploadés par le coach

-- ============================================================================
-- SUPPRESSION DES ANCIENNES POLITIQUES
-- ============================================================================

DROP POLICY IF EXISTS "admin_full_access_client_documents" ON public.client_documents;
DROP POLICY IF EXISTS "coach_view_client_documents" ON public.client_documents;
DROP POLICY IF EXISTS "coach_insert_client_documents" ON public.client_documents;
DROP POLICY IF EXISTS "client_view_own_documents" ON public.client_documents;
DROP POLICY IF EXISTS "client_insert_own_documents" ON public.client_documents;
DROP POLICY IF EXISTS "user_delete_own_uploads" ON public.client_documents;

-- ============================================================================
-- NOUVELLES POLITIQUES SIMPLIFIÉES
-- ============================================================================

-- 1. Le client peut voir TOUS les documents où il est le client_id
-- (que ce soit uploadé par lui-même ou par son coach)
CREATE POLICY "client_view_documents"
ON public.client_documents
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- 2. Le coach peut voir les documents de ses clients
-- (où il est le coach_id OU où il a uploadé le document)
CREATE POLICY "coach_view_documents"
ON public.client_documents
FOR SELECT
TO authenticated
USING (
  coach_id = auth.uid() 
  OR uploaded_by = auth.uid()
);

-- 3. Le client peut uploader ses propres documents
CREATE POLICY "client_insert_documents"
ON public.client_documents
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = auth.uid() 
  AND uploaded_by = auth.uid()
);

-- 4. Le coach peut uploader des documents pour ses clients
-- (vérifie que le coach est bien lié au client)
CREATE POLICY "coach_insert_documents"
ON public.client_documents
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = client_id 
    AND coach_id = auth.uid()
  )
);

-- 5. L'uploadeur peut supprimer ses propres documents
CREATE POLICY "owner_delete_documents"
ON public.client_documents
FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());

-- 6. Le client peut supprimer les documents de son dossier
CREATE POLICY "client_delete_own_documents"
ON public.client_documents
FOR DELETE
TO authenticated
USING (client_id = auth.uid());
