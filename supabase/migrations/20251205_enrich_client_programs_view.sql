-- Migration : Enrichissement de la vue client_created_programs
-- Date : 2024-12-05
-- Description : Ajoute les colonnes manquantes à client_programs et recrée la vue client_created_programs

-- ============================================================================
-- PARTIE 1 : Ajouter les colonnes manquantes à la table client_programs
-- ============================================================================

-- Ajouter la colonne source_type pour distinguer l'origine du programme
ALTER TABLE client_programs
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'coach_assigned' 
  CHECK (source_type IN ('client_created', 'coach_assigned'));

COMMENT ON COLUMN client_programs.source_type IS 
'Origine du programme:
- client_created: Programme créé directement par le client/pratiquant
- coach_assigned: Programme attribué par un coach (copie d''un template)';

-- Ajouter la colonne program_template_id pour référencer le template original
ALTER TABLE client_programs
  ADD COLUMN IF NOT EXISTS program_template_id UUID 
  REFERENCES program_templates(id) ON DELETE SET NULL;

COMMENT ON COLUMN client_programs.program_template_id IS 
'Référence au template original (table program_templates) si le programme a été attribué par un coach.
NULL si le programme a été créé directement par le client/pratiquant.';

-- Ajouter la colonne modified_by_client pour tracker les modifications
ALTER TABLE client_programs
  ADD COLUMN IF NOT EXISTS modified_by_client BOOLEAN DEFAULT false;

COMMENT ON COLUMN client_programs.modified_by_client IS 
'Indique si le programme a été modifié par le client après son assignation.
Permet au coach de voir quels programmes ont été personnalisés.';

-- Ajouter la colonne viewed_by_coach pour tracker la visualisation
ALTER TABLE client_programs
  ADD COLUMN IF NOT EXISTS viewed_by_coach BOOLEAN DEFAULT false;

COMMENT ON COLUMN client_programs.viewed_by_coach IS 
'Indique si le coach a vu les modifications apportées par le client.
Permet de gérer les notifications de changement.';

-- ============================================================================
-- PARTIE 2 : Créer des index pour optimiser les performances
-- ============================================================================

-- Index sur source_type pour filtrer rapidement
CREATE INDEX IF NOT EXISTS idx_client_programs_source_type 
  ON client_programs(source_type);

-- Index sur program_template_id pour les jointures
CREATE INDEX IF NOT EXISTS idx_client_programs_template_id 
  ON client_programs(program_template_id) 
  WHERE program_template_id IS NOT NULL;

-- Index composite pour les requêtes coach → programmes de ses clients
CREATE INDEX IF NOT EXISTS idx_client_programs_coach_client 
  ON client_programs(coach_id, client_id) 
  WHERE coach_id IS NOT NULL;

-- Index pour les pratiquants indépendants (sans coach)
CREATE INDEX IF NOT EXISTS idx_client_programs_independent 
  ON client_programs(client_id) 
  WHERE coach_id IS NULL;

-- Index pour les programmes modifiés non vus
CREATE INDEX IF NOT EXISTS idx_client_programs_modified_not_viewed 
  ON client_programs(coach_id, modified_by_client, viewed_by_coach) 
  WHERE modified_by_client = true AND viewed_by_coach = false;

-- ============================================================================
-- PARTIE 3 : Recréer la vue client_created_programs avec toutes les colonnes
-- ============================================================================

-- Supprimer la vue existante
DROP VIEW IF EXISTS client_created_programs;

-- Recréer la vue avec toutes les colonnes
CREATE VIEW client_created_programs AS
SELECT 
  id,
  assignment_id,
  client_id,
  coach_id,
  name,
  objective,
  week_count,
  source_type,
  program_template_id,
  modified_by_client,
  viewed_by_coach,
  created_at,
  updated_at
FROM client_programs;

COMMENT ON VIEW client_created_programs IS 
'Vue sur les programmes clients avec toutes les métadonnées.
Cette vue est un alias de client_programs pour la rétrocompatibilité.';

-- ============================================================================
-- PARTIE 4 : Mettre à jour les données existantes
-- ============================================================================

-- Pour les programmes existants avec assignment_id, définir source_type = 'coach_assigned'
UPDATE client_programs
SET source_type = 'coach_assigned'
WHERE assignment_id IS NOT NULL AND source_type IS NULL;

-- Pour les programmes existants sans assignment_id, définir source_type = 'client_created'
UPDATE client_programs
SET source_type = 'client_created'
WHERE assignment_id IS NULL AND source_type IS NULL;

-- Récupérer le program_template_id depuis program_assignments si disponible
UPDATE client_programs cp
SET program_template_id = pa.program_template_id
FROM program_assignments pa
WHERE cp.assignment_id = pa.id 
  AND cp.program_template_id IS NULL;

-- ============================================================================
-- PARTIE 5 : Vérifications post-migration
-- ============================================================================

-- Vérifier que toutes les colonnes ont été ajoutées
DO $$
BEGIN
    -- Vérifier source_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_programs' 
        AND column_name = 'source_type'
    ) THEN
        RAISE EXCEPTION 'Migration échouée: colonne source_type non créée';
    END IF;

    -- Vérifier program_template_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_programs' 
        AND column_name = 'program_template_id'
    ) THEN
        RAISE EXCEPTION 'Migration échouée: colonne program_template_id non créée';
    END IF;

    -- Vérifier modified_by_client
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_programs' 
        AND column_name = 'modified_by_client'
    ) THEN
        RAISE EXCEPTION 'Migration échouée: colonne modified_by_client non créée';
    END IF;

    -- Vérifier viewed_by_coach
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_programs' 
        AND column_name = 'viewed_by_coach'
    ) THEN
        RAISE EXCEPTION 'Migration échouée: colonne viewed_by_coach non créée';
    END IF;

    -- Vérifier que la vue a été recréée
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'client_created_programs'
    ) THEN
        RAISE EXCEPTION 'Migration échouée: vue client_created_programs non créée';
    END IF;

    RAISE NOTICE 'Migration réussie: Toutes les colonnes et la vue ont été créées';
END $$;

-- ============================================================================
-- PARTIE 6 : Statistiques post-migration
-- ============================================================================

-- Afficher un résumé des programmes existants
DO $$
DECLARE
    total_programs INT;
    coach_assigned INT;
    client_created INT;
    with_template INT;
    modified_programs INT;
BEGIN
    SELECT COUNT(*) INTO total_programs FROM client_programs;
    SELECT COUNT(*) INTO coach_assigned FROM client_programs WHERE source_type = 'coach_assigned';
    SELECT COUNT(*) INTO client_created FROM client_programs WHERE source_type = 'client_created';
    SELECT COUNT(*) INTO with_template FROM client_programs WHERE program_template_id IS NOT NULL;
    SELECT COUNT(*) INTO modified_programs FROM client_programs WHERE modified_by_client = true;

    RAISE NOTICE '=== Statistiques post-migration ===';
    RAISE NOTICE 'Total programmes: %', total_programs;
    RAISE NOTICE 'Programmes assignés par coach: %', coach_assigned;
    RAISE NOTICE 'Programmes créés par client: %', client_created;
    RAISE NOTICE 'Programmes avec template: %', with_template;
    RAISE NOTICE 'Programmes modifiés par client: %', modified_programs;
END $$;
