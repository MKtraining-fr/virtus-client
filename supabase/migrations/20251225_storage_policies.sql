-- Migration: Politiques RLS pour les buckets Storage
-- Date: 2025-12-25

-- ============================================================================
-- POLITIQUES POUR LE BUCKET voice-messages
-- ============================================================================

-- Seuls les coachs peuvent uploader des vocaux
CREATE POLICY "coach_upload_voice_messages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-messages' 
  AND public.is_coach()
);

-- Les coachs peuvent voir leurs propres vocaux
CREATE POLICY "coach_view_own_voice_messages"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-messages'
  AND (owner_id = auth.uid() OR public.is_admin())
);

-- Les clients peuvent voir les vocaux qui leur sont destinés
-- (via la table messages qui contient l'URL)
CREATE POLICY "client_view_voice_messages"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-messages'
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.attachment_url LIKE '%' || storage.objects.name || '%'
    AND m.receiver_id = auth.uid()
  )
);

-- Les coachs peuvent supprimer leurs propres vocaux
CREATE POLICY "coach_delete_own_voice_messages"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-messages'
  AND owner_id = auth.uid()
);

-- ============================================================================
-- POLITIQUES POUR LE BUCKET client-documents
-- ============================================================================

-- Les coachs peuvent uploader des documents pour leurs clients
CREATE POLICY "coach_upload_client_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents'
  AND (public.is_coach() OR public.is_admin())
);

-- Les clients peuvent uploader leurs propres documents
CREATE POLICY "client_upload_own_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Les coachs peuvent voir les documents de leurs clients
CREATE POLICY "coach_view_client_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents'
  AND (
    public.is_coach() 
    OR public.is_admin()
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Les clients peuvent voir leurs propres documents
CREATE POLICY "client_view_own_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Seul l'uploadeur peut supprimer un document
CREATE POLICY "owner_delete_documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-documents'
  AND (owner_id = auth.uid() OR public.is_admin())
);
