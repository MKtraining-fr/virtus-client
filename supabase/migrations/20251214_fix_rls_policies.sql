-- Migration: Correction des politiques RLS pour les bilans
-- Date: 2025-12-14
-- Description: Ajoute la politique manquante pour permettre aux coachs de voir les templates système

-- ============================================================================
-- ÉTAPE 1: Ajouter la politique pour voir les templates système
-- ============================================================================

-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "Coaches can view their own bilan templates" ON bilan_templates;

-- Créer une nouvelle politique qui permet de voir :
-- 1. Les templates système (coach_id IS NULL)
-- 2. Les templates du coach connecté (coach_id = auth.uid())
CREATE POLICY "Coaches can view system and own bilan templates"
ON bilan_templates
FOR SELECT
TO public
USING (
  coach_id IS NULL OR coach_id = auth.uid()
);

-- ============================================================================
-- ÉTAPE 2: Vérifier les politiques sur bilan_assignments
-- ============================================================================

-- Vérifier que les politiques SELECT existent pour bilan_assignments
-- Si elles n'existent pas, les créer

DO $$ 
BEGIN
  -- Politique SELECT pour les coaches
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bilan_assignments' 
    AND policyname = 'Coaches can view their assignments'
  ) THEN
    CREATE POLICY "Coaches can view their assignments"
    ON bilan_assignments
    FOR SELECT
    TO public
    USING (coach_id = auth.uid());
  END IF;

  -- Politique SELECT pour les clients
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bilan_assignments' 
    AND policyname = 'Clients can view their assignments'
  ) THEN
    CREATE POLICY "Clients can view their assignments"
    ON bilan_assignments
    FOR SELECT
    TO public
    USING (client_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3: Vérifier que RLS est bien activée
-- ============================================================================

-- S'assurer que RLS est activée sur les deux tables
ALTER TABLE bilan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bilan_assignments ENABLE ROW LEVEL SECURITY;
