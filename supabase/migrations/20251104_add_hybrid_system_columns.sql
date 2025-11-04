-- Migration: Ajout des colonnes pour le système hybride d'attribution
-- Date: 2024-11-04
-- Description: Ajoute les colonnes nécessaires pour supporter le système hybride
--              où les programmes peuvent être créés par les clients OU attribués par les coachs

-- ============================================================================
-- 1. Ajouter source_type dans client_created_programs
-- ============================================================================

-- Ajouter la colonne source_type
ALTER TABLE client_created_programs 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'client_created' 
CHECK (source_type IN ('client_created', 'coach_assigned'));

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN client_created_programs.source_type IS 
'Origine du programme: 
- client_created: Programme créé directement par le client ou pratiquant
- coach_assigned: Programme attribué par un coach (copie d''un template)';

-- Mettre à jour les programmes existants (tous créés par des clients)
UPDATE client_created_programs 
SET source_type = 'client_created' 
WHERE source_type IS NULL;

-- ============================================================================
-- 2. Ajouter program_template_id dans client_created_programs
-- ============================================================================

-- Ajouter la colonne program_template_id (référence au template original)
ALTER TABLE client_created_programs 
ADD COLUMN IF NOT EXISTS program_template_id UUID 
REFERENCES programs(id) ON DELETE SET NULL;

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN client_created_programs.program_template_id IS 
'Référence au template original (table programs) si le programme a été attribué par un coach.
NULL si le programme a été créé directement par le client/pratiquant.';

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_client_created_programs_template_id 
ON client_created_programs(program_template_id) 
WHERE program_template_id IS NOT NULL;

-- ============================================================================
-- 3. Ajouter client_program_id dans program_assignments
-- ============================================================================

-- Ajouter la colonne client_program_id (référence vers la copie client)
ALTER TABLE program_assignments 
ADD COLUMN IF NOT EXISTS client_program_id UUID 
REFERENCES client_created_programs(id) ON DELETE CASCADE;

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN program_assignments.client_program_id IS 
'Référence vers la copie du programme dans client_created_programs.
Cette copie est créée lors de l''attribution et peut être modifiée indépendamment du template.';

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_program_assignments_client_program_id 
ON program_assignments(client_program_id) 
WHERE client_program_id IS NOT NULL;

-- ============================================================================
-- 4. Ajouter des index supplémentaires pour les performances
-- ============================================================================

-- Index sur source_type pour filtrer rapidement
CREATE INDEX IF NOT EXISTS idx_client_created_programs_source_type 
ON client_created_programs(source_type);

-- Index composite pour les requêtes coach → programmes de ses clients
CREATE INDEX IF NOT EXISTS idx_client_created_programs_coach_client 
ON client_created_programs(coach_id, client_id) 
WHERE coach_id IS NOT NULL;

-- Index pour les pratiquants indépendants (sans coach)
CREATE INDEX IF NOT EXISTS idx_client_created_programs_independent 
ON client_created_programs(client_id) 
WHERE coach_id IS NULL;

-- ============================================================================
-- 5. Mettre à jour les RLS policies si nécessaire
-- ============================================================================

-- Les policies existantes sont déjà correctes :
-- - "Clients can view their own programs" : OK
-- - "Coaches can view their clients' programs" : OK (via coach_id)
-- 
-- Pas besoin de modification car :
-- 1. Les pratiquants indépendants (coach_id = NULL) peuvent voir leurs programmes
-- 2. Les coachs peuvent voir les programmes de leurs clients (coach_id = leur ID)
-- 3. Les programmes attribués par les coachs auront coach_id rempli

-- ============================================================================
-- 6. Vérifications post-migration
-- ============================================================================

-- Vérifier que toutes les colonnes ont été ajoutées
DO $$
BEGIN
    -- Vérifier source_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_created_programs' 
        AND column_name = 'source_type'
    ) THEN
        RAISE EXCEPTION 'Migration échouée: colonne source_type non créée';
    END IF;

    -- Vérifier program_template_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_created_programs' 
        AND column_name = 'program_template_id'
    ) THEN
        RAISE EXCEPTION 'Migration échouée: colonne program_template_id non créée';
    END IF;

    -- Vérifier client_program_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'program_assignments' 
        AND column_name = 'client_program_id'
    ) THEN
        RAISE EXCEPTION 'Migration échouée: colonne client_program_id non créée';
    END IF;

    RAISE NOTICE 'Migration réussie: Toutes les colonnes ont été ajoutées';
END $$;

-- ============================================================================
-- 7. Statistiques post-migration
-- ============================================================================

-- Afficher un résumé des programmes existants
DO $$
DECLARE
    total_programs INT;
    programs_with_coach INT;
    programs_without_coach INT;
BEGIN
    SELECT COUNT(*) INTO total_programs FROM client_created_programs;
    SELECT COUNT(*) INTO programs_with_coach FROM client_created_programs WHERE coach_id IS NOT NULL;
    SELECT COUNT(*) INTO programs_without_coach FROM client_created_programs WHERE coach_id IS NULL;

    RAISE NOTICE '=== Statistiques post-migration ===';
    RAISE NOTICE 'Total programmes: %', total_programs;
    RAISE NOTICE 'Programmes avec coach: %', programs_with_coach;
    RAISE NOTICE 'Programmes sans coach (pratiquants indépendants): %', programs_without_coach;
END $$;
