-- Migration: Mise à jour des politiques RLS sur la table clients
-- Date: 2025-12-15
-- Description: Remplace les politiques RLS trop permissives par des politiques sécurisées
--              qui respectent la hiérarchie admin > coach > client

-- ============================================================================
-- ÉTAPE 1: Supprimer les anciennes politiques trop permissives
-- ============================================================================

DROP POLICY IF EXISTS "Enable insert for anyone" ON public.clients;
DROP POLICY IF EXISTS "authenticated_users_can_insert_clients" ON public.clients;
DROP POLICY IF EXISTS "authenticated_users_can_see_all_clients" ON public.clients;
DROP POLICY IF EXISTS "authenticated_users_can_update_clients" ON public.clients;
DROP POLICY IF EXISTS "only_admins_can_delete_clients" ON public.clients;

-- ============================================================================
-- ÉTAPE 2: Créer les nouvelles politiques SELECT (lecture)
-- ============================================================================

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "users_can_view_own_profile" ON public.clients
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Les coachs peuvent voir les profils de leurs clients directs
CREATE POLICY "coaches_can_view_their_clients" ON public.clients
FOR SELECT
TO authenticated
USING (
  coach_id = auth.uid()
);

-- Les admins peuvent voir tous les profils
CREATE POLICY "admins_can_view_all_profiles" ON public.clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- ÉTAPE 3: Créer les nouvelles politiques INSERT (création)
-- ============================================================================

-- Permettre l'insertion via le trigger (service role) - nécessaire pour le trigger auth
CREATE POLICY "service_role_can_insert" ON public.clients
FOR INSERT
TO service_role
WITH CHECK (true);

-- Les admins peuvent créer des utilisateurs
CREATE POLICY "admins_can_insert_clients" ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Les coachs peuvent créer des clients (pour le flux d'invitation)
CREATE POLICY "coaches_can_insert_clients" ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = auth.uid() AND role IN ('admin', 'coach')
  )
);

-- ============================================================================
-- ÉTAPE 4: Créer les nouvelles politiques UPDATE (modification)
-- ============================================================================

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "users_can_update_own_profile" ON public.clients
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Les coachs peuvent modifier les profils de leurs clients
CREATE POLICY "coaches_can_update_their_clients" ON public.clients
FOR UPDATE
TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Les admins peuvent modifier tous les profils
CREATE POLICY "admins_can_update_all_profiles" ON public.clients
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- ÉTAPE 5: Créer les nouvelles politiques DELETE (suppression)
-- ============================================================================

-- Seuls les admins peuvent supprimer des profils
CREATE POLICY "only_admins_can_delete" ON public.clients
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- ÉTAPE 6: Vérifier que RLS est activé
-- ============================================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
