-- Migration: Correction des politiques RLS récursives sur la table clients
-- Date: 2025-12-24
-- Description: Crée des fonctions SECURITY DEFINER pour éviter les requêtes récursives
--              dans les politiques RLS qui bloquaient l'accès admin

-- ============================================================================
-- ÉTAPE 1: Créer les fonctions helper avec SECURITY DEFINER
-- ============================================================================

-- Fonction pour vérifier si l'utilisateur courant est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour vérifier si l'utilisateur courant est coach
CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = auth.uid() AND role = 'coach'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour vérifier si l'utilisateur courant est admin ou coach
CREATE OR REPLACE FUNCTION public.is_admin_or_coach()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = auth.uid() AND role IN ('admin', 'coach')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour obtenir le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.clients WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- ÉTAPE 2: Supprimer les anciennes politiques
-- ============================================================================

DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.clients;
DROP POLICY IF EXISTS "coaches_can_view_their_clients" ON public.clients;
DROP POLICY IF EXISTS "admins_can_view_all_profiles" ON public.clients;
DROP POLICY IF EXISTS "service_role_can_insert" ON public.clients;
DROP POLICY IF EXISTS "admins_can_insert_clients" ON public.clients;
DROP POLICY IF EXISTS "coaches_can_insert_clients" ON public.clients;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.clients;
DROP POLICY IF EXISTS "coaches_can_update_their_clients" ON public.clients;
DROP POLICY IF EXISTS "admins_can_update_all_profiles" ON public.clients;
DROP POLICY IF EXISTS "only_admins_can_delete" ON public.clients;

-- ============================================================================
-- ÉTAPE 3: Créer les nouvelles politiques SELECT (lecture)
-- ============================================================================

-- Les admins peuvent voir tous les profils (utilise la fonction helper)
CREATE POLICY "admins_can_view_all_profiles" ON public.clients
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Les coachs peuvent voir leur propre profil et les profils de leurs clients
CREATE POLICY "coaches_can_view_own_and_clients" ON public.clients
FOR SELECT
TO authenticated
USING (
  public.is_coach() AND (
    id = auth.uid() OR coach_id = auth.uid()
  )
);

-- Les clients peuvent voir leur propre profil et le profil de leur coach
CREATE POLICY "clients_can_view_own_and_coach" ON public.clients
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR id = (SELECT coach_id FROM public.clients WHERE id = auth.uid())
);

-- ============================================================================
-- ÉTAPE 4: Créer les nouvelles politiques INSERT (création)
-- ============================================================================

-- Permettre l'insertion via le service role (nécessaire pour le trigger auth)
CREATE POLICY "service_role_can_insert" ON public.clients
FOR INSERT
TO service_role
WITH CHECK (true);

-- Les admins peuvent créer des utilisateurs
CREATE POLICY "admins_can_insert_clients" ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Les coachs peuvent créer des clients (pour le flux d'invitation)
CREATE POLICY "coaches_can_insert_clients" ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_coach());

-- ============================================================================
-- ÉTAPE 5: Créer les nouvelles politiques UPDATE (modification)
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
USING (coach_id = auth.uid() AND public.is_coach())
WITH CHECK (coach_id = auth.uid() AND public.is_coach());

-- Les admins peuvent modifier tous les profils
CREATE POLICY "admins_can_update_all_profiles" ON public.clients
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- ÉTAPE 6: Créer les nouvelles politiques DELETE (suppression)
-- ============================================================================

-- Seuls les admins peuvent supprimer des profils
CREATE POLICY "only_admins_can_delete" ON public.clients
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- ÉTAPE 7: Vérifier que RLS est activé
-- ============================================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION public.is_admin() IS 'Vérifie si l''utilisateur courant est admin. Utilise SECURITY DEFINER pour éviter les problèmes de récursion RLS.';
COMMENT ON FUNCTION public.is_coach() IS 'Vérifie si l''utilisateur courant est coach. Utilise SECURITY DEFINER pour éviter les problèmes de récursion RLS.';
COMMENT ON FUNCTION public.is_admin_or_coach() IS 'Vérifie si l''utilisateur courant est admin ou coach. Utilise SECURITY DEFINER pour éviter les problèmes de récursion RLS.';
COMMENT ON FUNCTION public.get_current_user_role() IS 'Retourne le rôle de l''utilisateur courant. Utilise SECURITY DEFINER pour éviter les problèmes de récursion RLS.';
