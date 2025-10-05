-- ============================================================
-- MIGRATION: Création de la table bilan_templates
-- ============================================================
-- Instructions:
-- 1. Aller sur: https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/sql
-- 2. Cliquer sur "New query"
-- 3. Copier-coller tout ce fichier
-- 4. Cliquer sur "Run"
-- ============================================================

-- 1. Créer la table bilan_templates
CREATE TABLE IF NOT EXISTS bilan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  coach_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  sections JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_bilan_templates_coach_id ON bilan_templates(coach_id);

-- 3. Commentaire de documentation
COMMENT ON TABLE bilan_templates IS 'Templates de questionnaires de bilans pour les coachs';
COMMENT ON COLUMN bilan_templates.coach_id IS 'ID du coach propriétaire du template, NULL pour les templates système';
COMMENT ON COLUMN bilan_templates.sections IS 'Sections et champs du questionnaire au format JSON';

-- 4. Trigger pour updated_at
DROP TRIGGER IF EXISTS update_bilan_templates_updated_at ON bilan_templates;
CREATE TRIGGER update_bilan_templates_updated_at
    BEFORE UPDATE ON bilan_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Politiques RLS (Row Level Security)
ALTER TABLE bilan_templates ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les templates système
CREATE POLICY "Lecture templates système"
ON bilan_templates FOR SELECT
USING (coach_id IS NULL OR auth.uid() IS NOT NULL);

-- Politique: Les coachs peuvent créer leurs propres templates
CREATE POLICY "Création templates coach"
ON bilan_templates FOR INSERT
WITH CHECK (auth.uid() = coach_id);

-- Politique: Les coachs peuvent modifier leurs propres templates
CREATE POLICY "Modification templates coach"
ON bilan_templates FOR UPDATE
USING (auth.uid() = coach_id);

-- Politique: Les coachs peuvent supprimer leurs propres templates
CREATE POLICY "Suppression templates coach"
ON bilan_templates FOR DELETE
USING (auth.uid() = coach_id);

-- 6. Vérification
SELECT 
    table_name, 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'bilan_templates'
ORDER BY ordinal_position;

-- ============================================================
-- Résultat attendu:
-- table_name        | column_name  | data_type
-- bilan_templates   | id           | uuid
-- bilan_templates   | name         | text
-- bilan_templates   | coach_id     | uuid
-- bilan_templates   | sections     | jsonb
-- bilan_templates   | created_at   | timestamp with time zone
-- bilan_templates   | updated_at   | timestamp with time zone
-- ============================================================
