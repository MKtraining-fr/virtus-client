-- Rollback Migration: Suppression des colonnes du système hybride
-- Date: 2024-11-04
-- Description: Script de rollback pour annuler la migration 20251104_add_hybrid_system_columns.sql
--              À utiliser UNIQUEMENT en cas de problème critique

-- ATTENTION: Ce script supprime des colonnes et peut entraîner une perte de données
-- Assurez-vous d'avoir une sauvegarde avant d'exécuter ce script

-- ============================================================================
-- 1. Supprimer les index créés
-- ============================================================================

DROP INDEX IF EXISTS idx_client_created_programs_template_id;
DROP INDEX IF EXISTS idx_program_assignments_client_program_id;
DROP INDEX IF EXISTS idx_client_created_programs_source_type;
DROP INDEX IF EXISTS idx_client_created_programs_coach_client;
DROP INDEX IF EXISTS idx_client_created_programs_independent;

RAISE NOTICE 'Index supprimés';

-- ============================================================================
-- 2. Supprimer la colonne client_program_id de program_assignments
-- ============================================================================

ALTER TABLE program_assignments 
DROP COLUMN IF EXISTS client_program_id CASCADE;

RAISE NOTICE 'Colonne client_program_id supprimée de program_assignments';

-- ============================================================================
-- 3. Supprimer les colonnes de client_created_programs
-- ============================================================================

ALTER TABLE client_created_programs 
DROP COLUMN IF EXISTS program_template_id CASCADE;

ALTER TABLE client_created_programs 
DROP COLUMN IF EXISTS source_type CASCADE;

RAISE NOTICE 'Colonnes program_template_id et source_type supprimées de client_created_programs';

-- ============================================================================
-- 4. Vérification post-rollback
-- ============================================================================

DO $$
BEGIN
    -- Vérifier que source_type a été supprimée
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_created_programs' 
        AND column_name = 'source_type'
    ) THEN
        RAISE EXCEPTION 'Rollback échoué: colonne source_type toujours présente';
    END IF;

    -- Vérifier que program_template_id a été supprimée
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_created_programs' 
        AND column_name = 'program_template_id'
    ) THEN
        RAISE EXCEPTION 'Rollback échoué: colonne program_template_id toujours présente';
    END IF;

    -- Vérifier que client_program_id a été supprimée
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'program_assignments' 
        AND column_name = 'client_program_id'
    ) THEN
        RAISE EXCEPTION 'Rollback échoué: colonne client_program_id toujours présente';
    END IF;

    RAISE NOTICE 'Rollback réussi: Toutes les colonnes ont été supprimées';
END $$;
