-- Migration pour corriger la suppression des coachs avec clients affiliés
-- Cette migration modifie la fonction delete_user_and_profile pour gérer correctement
-- la suppression d'un coach ayant des clients affiliés

-- Étape 1 : Modifier la contrainte de clé étrangère pour permettre SET NULL
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_coach_id_fkey;

ALTER TABLE clients 
ADD CONSTRAINT clients_coach_id_fkey 
FOREIGN KEY (coach_id) 
REFERENCES clients(id) 
ON DELETE SET NULL;

-- Étape 2 : Créer ou remplacer la fonction de suppression améliorée
CREATE OR REPLACE FUNCTION public.delete_user_and_profile(user_id_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_id uuid;
  user_role text;
  affiliated_client RECORD;
  coach_full_name text;
BEGIN
  -- Convertir le texte en UUID
  user_id := user_id_text::uuid;

  -- Vérifier si l'utilisateur existe et récupérer son rôle
  SELECT role, COALESCE(first_name || ' ' || last_name, email) INTO user_role, coach_full_name
  FROM public.clients
  WHERE id = user_id;

  -- Si l'utilisateur est un coach, gérer les clients affiliés
  IF user_role = 'coach' THEN
    -- Créer des notifications pour tous les clients affiliés
    FOR affiliated_client IN 
      SELECT id, first_name, last_name, email 
      FROM public.clients 
      WHERE coach_id = user_id AND role = 'client'
    LOOP
      -- Insérer une notification pour chaque client
      INSERT INTO public.notifications (
        id,
        user_id,
        title,
        message,
        type,
        read,
        created_at
      ) VALUES (
        gen_random_uuid(),
        affiliated_client.id,
        'Votre coach n''est plus disponible',
        'Votre coach ' || coach_full_name || ' n''est plus présent sur la plateforme Virtus. Vous êtes maintenant un pratiquant indépendant et conservez l''accès à toutes vos données (programmes, séances, performances, etc.). Vous pouvez continuer à utiliser la plateforme de manière autonome ou vous affilier à un nouveau coach.',
        'coach_removed',
        false,
        NOW()
      );
    END LOOP;

    -- Mettre à jour les clients affiliés : définir coach_id à NULL
    -- (Cela se fera automatiquement grâce à ON DELETE SET NULL, mais on le fait explicitement pour plus de clarté)
    UPDATE public.clients
    SET coach_id = NULL
    WHERE coach_id = user_id;

    -- Supprimer les données créées par le coach (exercices personnalisés, templates, etc.)
    -- Note : Les données des clients (performances, logs, etc.) sont préservées
    
    -- Supprimer les templates de bilans créés par le coach
    DELETE FROM public.bilan_templates
    WHERE coach_id = user_id;

    -- Supprimer les exercices créés par le coach
    DELETE FROM public.exercises
    WHERE created_by = user_id;

    -- Supprimer les programmes créés par le coach (templates uniquement, pas les assignations)
    DELETE FROM public.programs
    WHERE created_by = user_id AND is_template = true;

    -- Supprimer les sessions créées par le coach (templates uniquement)
    DELETE FROM public.sessions
    WHERE created_by = user_id AND is_template = true;

    -- Note : Les plans nutritionnels n'ont pas de coach_id, ils sont liés aux clients

    -- Supprimer les recettes créées par le coach
    DELETE FROM public.recipes
    WHERE created_by = user_id;

    -- Supprimer les aliments personnalisés créés par le coach
    DELETE FROM public.food_items
    WHERE created_by = user_id;

    -- Supprimer les techniques d'intensification créées par le coach
    DELETE FROM public.intensity_techniques
    WHERE created_by = user_id;
  END IF;

  -- Supprimer l'utilisateur de l'authentification (auth.users)
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    PERFORM supabase_auth.delete_user(user_id);
  END IF;

  -- Supprimer le profil client (clients)
  -- Les clients affiliés ont déjà été mis à jour (coach_id = NULL)
  DELETE FROM public.clients
  WHERE id = user_id;

  RAISE NOTICE 'Utilisateur % supprimé avec succès', user_id;
END;
$function$;

-- Étape 3 : Ajouter un commentaire sur la fonction
COMMENT ON FUNCTION public.delete_user_and_profile(text) IS 
'Supprime un utilisateur (coach ou client) et son profil. 
Pour les coachs : notifie les clients affiliés, les rend indépendants, et supprime les données du coach.
Pour les clients : supprime simplement le profil et l''authentification.';
