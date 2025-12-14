-- Migration: Amélioration du système de bilans
-- Date: 2025-12-14
-- Description: Ajoute les fonctionnalités d'assignation récurrente, validation du bilan initial,
--              et corrige les problèmes de sécurité (RLS notifications, contraintes manquantes)

-- ============================================================================
-- ÉTAPE 1: Ajouter les colonnes manquantes à bilan_assignments
-- ============================================================================

-- Ajouter la colonne frequency pour gérer les assignations récurrentes
ALTER TABLE bilan_assignments 
ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'once' NOT NULL;

-- Ajouter la colonne scheduled_date pour la date prévue d'assignation
ALTER TABLE bilan_assignments 
ADD COLUMN IF NOT EXISTS scheduled_date DATE DEFAULT CURRENT_DATE NOT NULL;

-- Ajouter la colonne parent_assignment_id pour tracer la chaîne de récurrence
ALTER TABLE bilan_assignments 
ADD COLUMN IF NOT EXISTS parent_assignment_id UUID REFERENCES bilan_assignments(id) ON DELETE SET NULL;

-- ============================================================================
-- ÉTAPE 2: Ajouter les contraintes manquantes
-- ============================================================================

-- Contrainte CHECK sur le statut (si elle n'existe pas déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bilan_assignments_status_check' 
    AND conrelid = 'bilan_assignments'::regclass
  ) THEN
    ALTER TABLE bilan_assignments 
    ADD CONSTRAINT bilan_assignments_status_check 
    CHECK (status IN ('assigned', 'completed', 'archived'));
  END IF;
END $$;

-- Contrainte CHECK sur la fréquence
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bilan_assignments_frequency_check' 
    AND conrelid = 'bilan_assignments'::regclass
  ) THEN
    ALTER TABLE bilan_assignments 
    ADD CONSTRAINT bilan_assignments_frequency_check 
    CHECK (frequency IN ('once', 'weekly', 'biweekly', 'monthly'));
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3: Activer RLS sur la table notifications (correction de sécurité)
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 4: Nettoyer les politiques RLS en doublon sur bilan_templates
-- ============================================================================

-- Supprimer les anciennes politiques en doublon (garder les plus récentes)
DROP POLICY IF EXISTS "Templates système visibles par tous" ON bilan_templates;
DROP POLICY IF EXISTS "Coaches peuvent créer leurs templates" ON bilan_templates;
DROP POLICY IF EXISTS "Coaches peuvent modifier leurs templates" ON bilan_templates;
DROP POLICY IF EXISTS "Coaches peuvent supprimer leurs templates" ON bilan_templates;

-- Les politiques "Coaches can view/insert/update/delete their own bilan templates" sont conservées

-- ============================================================================
-- ÉTAPE 5: Fonction RPC - assign_bilan_atomic
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_bilan_atomic(
  p_template_id UUID,
  p_client_id UUID,
  p_coach_id UUID,
  p_frequency TEXT DEFAULT 'once',
  p_scheduled_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_id UUID;
  v_template_data JSONB;
  v_template_name TEXT;
  v_coach_name TEXT;
  v_result JSON;
BEGIN
  -- Vérifier que le template existe
  SELECT name, sections INTO v_template_name, v_template_data
  FROM bilan_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Template not found'
    );
  END IF;

  -- Récupérer le nom du coach pour la notification
  SELECT first_name || ' ' || last_name INTO v_coach_name
  FROM clients
  WHERE id = p_coach_id;

  -- Créer l'assignation avec snapshot du template
  INSERT INTO bilan_assignments (
    coach_id,
    client_id,
    bilan_template_id,
    status,
    frequency,
    scheduled_date,
    assigned_at,
    data
  ) VALUES (
    p_coach_id,
    p_client_id,
    p_template_id,
    'assigned',
    p_frequency,
    p_scheduled_date,
    NOW(),
    jsonb_build_object(
      'template_snapshot', v_template_data,
      'template_name', v_template_name,
      'answers', '{}'::jsonb
    )
  )
  RETURNING id INTO v_assignment_id;

  -- Créer une notification pour le client
  INSERT INTO notifications (user_id, title, message, type, read, created_at)
  VALUES (
    p_client_id,
    'Nouveau bilan assigné',
    v_coach_name || ' vous a assigné un nouveau bilan : ' || v_template_name,
    'assignment',
    false,
    NOW()
  );

  -- Retourner le résultat
  v_result := json_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'message', 'Bilan assigné avec succès'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ============================================================================
-- ÉTAPE 6: Fonction RPC - complete_bilan_atomic
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_bilan_atomic(
  p_assignment_id UUID,
  p_answers JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment RECORD;
  v_new_assignment_id UUID;
  v_new_scheduled_date DATE;
  v_client_name TEXT;
  v_template_name TEXT;
  v_result JSON;
BEGIN
  -- Récupérer l'assignation et vérifier qu'elle existe
  SELECT * INTO v_assignment
  FROM bilan_assignments
  WHERE id = p_assignment_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Assignment not found'
    );
  END IF;

  -- Vérifier que le bilan n'est pas déjà complété
  IF v_assignment.status = 'completed' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Bilan already completed'
    );
  END IF;

  -- Mettre à jour l'assignation avec les réponses
  UPDATE bilan_assignments
  SET 
    status = 'completed',
    completed_at = NOW(),
    data = jsonb_set(
      data,
      '{answers}',
      p_answers
    )
  WHERE id = p_assignment_id;

  -- Récupérer le nom du client et du template pour la notification
  SELECT first_name || ' ' || last_name INTO v_client_name
  FROM clients
  WHERE id = v_assignment.client_id;

  v_template_name := v_assignment.data->>'template_name';

  -- Créer une notification pour le coach
  INSERT INTO notifications (user_id, title, message, type, read, created_at)
  VALUES (
    v_assignment.coach_id,
    'Bilan complété',
    v_client_name || ' a complété le bilan : ' || v_template_name,
    'completion',
    false,
    NOW()
  );

  -- Si la fréquence n'est pas 'once', créer une nouvelle assignation
  IF v_assignment.frequency != 'once' THEN
    -- Calculer la nouvelle date selon la fréquence
    CASE v_assignment.frequency
      WHEN 'weekly' THEN
        v_new_scheduled_date := v_assignment.scheduled_date + INTERVAL '7 days';
      WHEN 'biweekly' THEN
        v_new_scheduled_date := v_assignment.scheduled_date + INTERVAL '14 days';
      WHEN 'monthly' THEN
        v_new_scheduled_date := v_assignment.scheduled_date + INTERVAL '1 month';
      ELSE
        v_new_scheduled_date := NULL;
    END CASE;

    -- Créer la nouvelle assignation si une date a été calculée
    IF v_new_scheduled_date IS NOT NULL THEN
      INSERT INTO bilan_assignments (
        coach_id,
        client_id,
        bilan_template_id,
        status,
        frequency,
        scheduled_date,
        assigned_at,
        parent_assignment_id,
        data
      ) VALUES (
        v_assignment.coach_id,
        v_assignment.client_id,
        v_assignment.bilan_template_id,
        'assigned',
        v_assignment.frequency,
        v_new_scheduled_date,
        NOW(),
        p_assignment_id,
        jsonb_build_object(
          'template_snapshot', v_assignment.data->'template_snapshot',
          'template_name', v_template_name,
          'answers', '{}'::jsonb
        )
      )
      RETURNING id INTO v_new_assignment_id;

      -- Créer une notification pour le nouveau bilan
      INSERT INTO notifications (user_id, title, message, type, read, created_at)
      VALUES (
        v_assignment.client_id,
        'Nouveau bilan assigné',
        'Un nouveau bilan récurrent vous a été assigné : ' || v_template_name,
        'assignment',
        false,
        NOW()
      );

      -- Retourner le résultat avec la nouvelle assignation
      v_result := json_build_object(
        'success', true,
        'message', 'Bilan complété et nouvelle assignation créée',
        'new_assignment_id', v_new_assignment_id,
        'new_scheduled_date', v_new_scheduled_date
      );
    ELSE
      v_result := json_build_object(
        'success', true,
        'message', 'Bilan complété avec succès'
      );
    END IF;
  ELSE
    v_result := json_build_object(
      'success', true,
      'message', 'Bilan complété avec succès'
    );
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ============================================================================
-- ÉTAPE 7: Fonction RPC - validate_initial_bilan
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_initial_bilan(
  p_assignment_id UUID,
  p_coach_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment RECORD;
  v_template RECORD;
  v_answers JSONB;
  v_client_id UUID;
  v_activity_mapping TEXT;
  v_result JSON;
BEGIN
  -- Récupérer l'assignation
  SELECT * INTO v_assignment
  FROM bilan_assignments
  WHERE id = p_assignment_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Assignment not found'
    );
  END IF;

  -- Vérifier que le bilan est bien le "Bilan Initial"
  SELECT * INTO v_template
  FROM bilan_templates
  WHERE id = v_assignment.bilan_template_id
  AND coach_id IS NULL
  AND name = 'Bilan Initial';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'This is not the Initial Bilan'
    );
  END IF;

  -- Vérifier que le bilan est complété
  IF v_assignment.status != 'completed' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Bilan must be completed before validation'
    );
  END IF;

  v_client_id := v_assignment.client_id;
  v_answers := v_assignment.data->'answers';

  -- Mapper le niveau d'activité physique
  CASE v_answers->>'activite_physique'
    WHEN 'Sédentaire' THEN v_activity_mapping := 'sedentary';
    WHEN 'Légèrement actif' THEN v_activity_mapping := 'lightly_active';
    WHEN 'Modérément actif' THEN v_activity_mapping := 'moderately_active';
    WHEN 'Très actif' THEN v_activity_mapping := 'very_active';
    WHEN 'Extrêmement actif' THEN v_activity_mapping := 'extremely_active';
    ELSE v_activity_mapping := NULL;
  END CASE;

  -- Mettre à jour le profil client avec les données du bilan initial
  UPDATE clients
  SET
    first_name = COALESCE(v_answers->>'prenom', first_name),
    last_name = COALESCE(v_answers->>'nom', last_name),
    dob = COALESCE((v_answers->>'date_naissance')::date, dob),
    sex = COALESCE(v_answers->>'sexe', sex),
    height = COALESCE((v_answers->>'taille')::numeric, height),
    weight = COALESCE((v_answers->>'poids')::numeric, weight),
    email = COALESCE(v_answers->>'email', email),
    phone = COALESCE(v_answers->>'telephone', phone),
    energy_expenditure_level = COALESCE(v_activity_mapping, energy_expenditure_level),
    objective = COALESCE(v_answers->>'objectif_principal', objective),
    status = 'active',
    coach_id = p_coach_id,
    nutrition = jsonb_build_object(
      'allergies', COALESCE(v_answers->'allergies', '[]'::jsonb),
      'allergies_autre', COALESCE(v_answers->>'allergies_autre', ''),
      'aversions', COALESCE(v_answers->>'aversions', ''),
      'habitudes', COALESCE(v_answers->>'habitudes', '')
    ),
    medical_info = jsonb_build_object(
      'antecedents', COALESCE(v_answers->>'antecedents_medicaux', '')
    ),
    notes = COALESCE(v_answers->>'notes_coach', notes),
    lifestyle = jsonb_build_object(
      'profession', COALESCE(v_answers->>'profession', '')
    ),
    updated_at = NOW()
  WHERE id = v_client_id;

  -- Créer une notification pour le client
  INSERT INTO notifications (user_id, title, message, type, read, created_at)
  VALUES (
    v_client_id,
    'Profil validé',
    'Votre profil a été validé et vous êtes maintenant un client actif !',
    'validation',
    false,
    NOW()
  );

  -- Retourner le résultat
  v_result := json_build_object(
    'success', true,
    'message', 'Client validé avec succès',
    'client_id', v_client_id
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ============================================================================
-- ÉTAPE 8: Fonction helper - check_template_has_assignments
-- ============================================================================

CREATE OR REPLACE FUNCTION check_template_has_assignments(
  p_template_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM bilan_assignments
  WHERE bilan_template_id = p_template_id
  AND status IN ('assigned', 'completed');

  RETURN v_count > 0;
END;
$$;

-- ============================================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN bilan_assignments.frequency IS 'Fréquence de récurrence: once (une fois), weekly (hebdomadaire), biweekly (toutes les 2 semaines), monthly (mensuel)';
COMMENT ON COLUMN bilan_assignments.scheduled_date IS 'Date prévue pour cette assignation (peut différer de assigned_at)';
COMMENT ON COLUMN bilan_assignments.parent_assignment_id IS 'Référence à l''assignation précédente dans la chaîne de récurrence';

COMMENT ON FUNCTION assign_bilan_atomic IS 'Assigne un bilan à un client de manière atomique avec support de la récurrence';
COMMENT ON FUNCTION complete_bilan_atomic IS 'Marque un bilan comme complété et crée automatiquement la prochaine assignation si récurrent';
COMMENT ON FUNCTION validate_initial_bilan IS 'Valide un bilan initial et convertit le prospect en client actif';
COMMENT ON FUNCTION check_template_has_assignments IS 'Vérifie si un template a des assignations actives (pour empêcher la suppression)';
