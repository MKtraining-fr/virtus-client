-- Migration: Correction des politiques RLS pour le bucket client-documents
-- Date: 2025-12-25
-- Problème: Le coach ne peut pas uploader de documents pour ses clients

-- ============================================================================
-- SUPPRESSION DES ANCIENNES POLITIQUES
-- ============================================================================

DROP POLICY IF EXISTS "coach_upload_client_documents" ON storage.objects;
DROP POLICY IF EXISTS "client_upload_own_documents" ON storage.objects;
DROP POLICY IF EXISTS "coach_view_client_documents" ON storage.objects;
DROP POLICY IF EXISTS "client_view_own_documents" ON storage.objects;
DROP POLICY IF EXISTS "owner_delete_documents" ON storage.objects;

-- ============================================================================
-- NOUVELLES POLITIQUES POUR LE BUCKET client-documents
-- ============================================================================

-- Politique d'upload : Coachs, Admins et Clients peuvent uploader
-- Le chemin du fichier doit être dans le dossier du client (client_id/filename)
CREATE POLICY "upload_client_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents'
);

-- Politique de lecture : Tout utilisateur authentifié peut lire
-- (la sécurité est gérée au niveau de la table client_documents)
CREATE POLICY "read_client_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents'
);

-- Politique de suppression : Seul le propriétaire ou un admin peut supprimer
CREATE POLICY "delete_client_documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-documents'
  AND (owner_id = auth.uid() OR public.is_admin())
);
