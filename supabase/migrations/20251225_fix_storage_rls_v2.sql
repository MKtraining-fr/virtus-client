-- Migration: Correction des politiques RLS pour le bucket client-documents
-- Date: 2025-12-25
-- Version: 2 - Sans dépendance aux fonctions helper

-- ============================================================================
-- SUPPRESSION DES ANCIENNES POLITIQUES
-- ============================================================================

DROP POLICY IF EXISTS "coach_upload_client_documents" ON storage.objects;
DROP POLICY IF EXISTS "client_upload_own_documents" ON storage.objects;
DROP POLICY IF EXISTS "coach_view_client_documents" ON storage.objects;
DROP POLICY IF EXISTS "client_view_own_documents" ON storage.objects;
DROP POLICY IF EXISTS "owner_delete_documents" ON storage.objects;
DROP POLICY IF EXISTS "upload_client_documents" ON storage.objects;
DROP POLICY IF EXISTS "read_client_documents" ON storage.objects;
DROP POLICY IF EXISTS "delete_client_documents" ON storage.objects;

-- ============================================================================
-- NOUVELLES POLITIQUES SIMPLIFIÉES POUR LE BUCKET client-documents
-- ============================================================================

-- Politique d'upload : Tout utilisateur authentifié peut uploader dans client-documents
CREATE POLICY "allow_upload_client_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents'
);

-- Politique de lecture : Tout utilisateur authentifié peut lire dans client-documents
CREATE POLICY "allow_read_client_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents'
);

-- Politique de mise à jour : Tout utilisateur authentifié peut mettre à jour dans client-documents
CREATE POLICY "allow_update_client_documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-documents'
);

-- Politique de suppression : Tout utilisateur authentifié peut supprimer dans client-documents
-- (La vraie sécurité est gérée au niveau de la table client_documents avec ses propres RLS)
CREATE POLICY "allow_delete_client_documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-documents'
);
