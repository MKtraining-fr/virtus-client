-- Migration: Refonte du trigger de synchronisation auth.users -> public.clients
-- Date: 2025-12-15
-- Description: Supprime l'ancien trigger qui pointait vers la table 'profiles' obsolète
--              et crée un nouveau trigger qui synchronise vers la table 'clients'

-- ============================================================================
-- ÉTAPE 1: Supprimer l'ancien trigger et la fonction obsolète
-- ============================================================================

-- Supprimer le trigger existant sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Supprimer l'ancienne fonction handle_new_user (pointait vers profiles)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================================
-- ÉTAPE 2: Créer la nouvelle fonction de synchronisation vers clients
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_client_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer un nouveau profil dans public.clients pour chaque nouvel utilisateur auth
  -- Les colonnes first_name et last_name sont NOT NULL, on utilise des valeurs par défaut si absentes
  INSERT INTO public.clients (
    id,
    email,
    role,
    first_name,
    last_name,
    phone,
    coach_id,
    status,
    affiliation_code
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')::text,
    COALESCE(NEW.raw_user_meta_data->>'first_name', '')::text,
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')::text,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')::text,
    CASE 
      WHEN NEW.raw_user_meta_data->>'coach_id' IS NOT NULL 
           AND NEW.raw_user_meta_data->>'coach_id' != '' 
      THEN (NEW.raw_user_meta_data->>'coach_id')::uuid 
      ELSE NULL 
    END,
    COALESCE(NEW.raw_user_meta_data->>'status', 'active')::text,
    NEW.raw_user_meta_data->>'affiliation_code'
  )
  ON CONFLICT (id) DO NOTHING; -- Éviter les erreurs si le profil existe déjà
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 3: Créer le nouveau trigger
-- ============================================================================

CREATE TRIGGER on_auth_user_created_sync_clients
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_client_profile_for_new_user();

-- ============================================================================
-- ÉTAPE 4: Ajouter un commentaire pour la documentation
-- ============================================================================

COMMENT ON FUNCTION public.create_client_profile_for_new_user() IS 
'Trigger function qui crée automatiquement un profil dans public.clients 
lorsqu''un nouvel utilisateur est créé dans auth.users. 
Les métadonnées (role, first_name, last_name, coach_id, etc.) sont extraites 
de raw_user_meta_data et insérées dans le profil client.
Créé le 2025-12-15 dans le cadre de la refonte du système d''authentification.';
