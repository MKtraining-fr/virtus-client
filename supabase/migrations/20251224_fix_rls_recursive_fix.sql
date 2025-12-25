-- Migration: Correction urgente des politiques RLS - Suppression de la récursion
-- Date: 2025-12-24
-- Description: Corrige la politique clients_can_view_own_and_coach qui cause une erreur 500

-- ============================================================================
-- ÉTAPE 1: Supprimer la politique problématique
-- ============================================================================

DROP POLICY IF EXISTS "clients_can_view_own_and_coach" ON public.clients;

-- ============================================================================
-- ÉTAPE 2: Créer une fonction helper pour obtenir le coach_id de l'utilisateur courant
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_coach_id()
RETURNS UUID AS $$
DECLARE
  coach_uuid UUID;
BEGIN
  SELECT coach_id INTO coach_uuid FROM public.clients WHERE id = auth.uid();
  RETURN coach_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- ÉTAPE 3: Recréer la politique sans récursion
-- ============================================================================

-- Les clients peuvent voir leur propre profil
CREATE POLICY "clients_can_view_own_profile" ON public.clients
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Les clients peuvent voir le profil de leur coach (utilise la fonction helper)
CREATE POLICY "clients_can_view_their_coach" ON public.clients
FOR SELECT
TO authenticated
USING (id = public.get_current_user_coach_id());

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION public.get_current_user_coach_id() IS 'Retourne le coach_id de l''utilisateur courant. Utilise SECURITY DEFINER pour éviter les problèmes de récursion RLS.';
