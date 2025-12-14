-- Migration: Corriger la suppression des templates de bilans
-- Date: 2025-12-14
-- Description: Modifie la contrainte de clé étrangère pour permettre la suppression
--              des templates même avec des assignations actives (ON DELETE CASCADE)

-- ============================================================================
-- ÉTAPE 1: Supprimer l'ancienne contrainte de clé étrangère
-- ============================================================================

ALTER TABLE bilan_assignments 
DROP CONSTRAINT IF EXISTS bilan_assignments_bilan_template_id_fkey;

-- ============================================================================
-- ÉTAPE 2: Recréer la contrainte avec ON DELETE CASCADE
-- ============================================================================

ALTER TABLE bilan_assignments 
ADD CONSTRAINT bilan_assignments_bilan_template_id_fkey 
FOREIGN KEY (bilan_template_id) 
REFERENCES bilan_templates(id) 
ON DELETE CASCADE;

-- Note: Avec ON DELETE CASCADE, quand un template est supprimé,
-- toutes les assignations associées seront automatiquement supprimées.
-- Cela correspond au comportement attendu : si le coach supprime un template,
-- les assignations en cours sont également supprimées.
