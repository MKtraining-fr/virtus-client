-- Migration: Corriger les politiques RLS de la table notifications
-- Permet aux clients d'envoyer des notifications aux coachs

-- 1. Voir les politiques actuelles (pour diagnostic)
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'notifications';

-- 2. Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;

-- 3. Activer RLS si pas déjà fait
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Créer les nouvelles politiques

-- Les utilisateurs peuvent voir leurs propres notifications (où ils sont le destinataire)
CREATE POLICY "users_view_own_notifications" ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Tous les utilisateurs authentifiés peuvent créer des notifications pour n'importe qui
-- (le contrôle se fait au niveau applicatif pour s'assurer que c'est légitime)
CREATE POLICY "users_can_create_notifications" ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Les utilisateurs peuvent mettre à jour leurs propres notifications (marquer comme lu)
CREATE POLICY "users_update_own_notifications" ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "users_delete_own_notifications" ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 5. Vérifier que les colonnes nécessaires existent
DO $$
BEGIN
  -- Ajouter la colonne from_name si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'from_name') THEN
    ALTER TABLE public.notifications ADD COLUMN from_name TEXT;
  END IF;
  
  -- Ajouter la colonne link si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'link') THEN
    ALTER TABLE public.notifications ADD COLUMN link TEXT;
  END IF;
END $$;
