-- Migration: Corriger les politiques RLS du bucket voice-messages
-- Permet aux coachs d'uploader des messages vocaux

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "coach_upload_voice" ON storage.objects;
DROP POLICY IF EXISTS "coach_view_voice" ON storage.objects;
DROP POLICY IF EXISTS "client_view_voice" ON storage.objects;
DROP POLICY IF EXISTS "voice_messages_upload" ON storage.objects;
DROP POLICY IF EXISTS "voice_messages_view" ON storage.objects;
DROP POLICY IF EXISTS "voice_messages_delete" ON storage.objects;

-- Politique pour permettre aux utilisateurs authentifiés d'uploader dans voice-messages
CREATE POLICY "voice_messages_insert" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice-messages');

-- Politique pour permettre aux utilisateurs authentifiés de voir les fichiers dans voice-messages
CREATE POLICY "voice_messages_select" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'voice-messages');

-- Politique pour permettre aux utilisateurs authentifiés de supprimer leurs propres fichiers
CREATE POLICY "voice_messages_delete" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'voice-messages' AND auth.uid()::text = (storage.foldername(name))[1]);
