-- ============================================================
-- SCRIPT COMPLET: Création table + Import Bilan Initial
-- ============================================================
-- Ce script fait tout en une seule fois :
-- 1. Crée la table bilan_templates
-- 2. Importe le template "Bilan Initial" système
-- ============================================================

-- PARTIE 1: Créer la table bilan_templates
-- ============================================================

CREATE TABLE IF NOT EXISTS bilan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  coach_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  sections JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_bilan_templates_coach_id ON bilan_templates(coach_id);

-- Commentaires de documentation
COMMENT ON TABLE bilan_templates IS 'Templates de questionnaires de bilans pour les coachs';
COMMENT ON COLUMN bilan_templates.coach_id IS 'ID du coach propriétaire du template, NULL pour les templates système';
COMMENT ON COLUMN bilan_templates.sections IS 'Sections et champs du questionnaire au format JSON';

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_bilan_templates_updated_at ON bilan_templates;
CREATE TRIGGER update_bilan_templates_updated_at
    BEFORE UPDATE ON bilan_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS (Row Level Security)
ALTER TABLE bilan_templates ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les templates système
DROP POLICY IF EXISTS "Lecture templates système" ON bilan_templates;
CREATE POLICY "Lecture templates système"
ON bilan_templates FOR SELECT
USING (coach_id IS NULL OR auth.uid() IS NOT NULL);

-- Politique: Les coachs peuvent créer leurs propres templates
DROP POLICY IF EXISTS "Création templates coach" ON bilan_templates;
CREATE POLICY "Création templates coach"
ON bilan_templates FOR INSERT
WITH CHECK (auth.uid() = coach_id);

-- Politique: Les coachs peuvent modifier leurs propres templates
DROP POLICY IF EXISTS "Modification templates coach" ON bilan_templates;
CREATE POLICY "Modification templates coach"
ON bilan_templates FOR UPDATE
USING (auth.uid() = coach_id);

-- Politique: Les coachs peuvent supprimer leurs propres templates
DROP POLICY IF EXISTS "Suppression templates coach" ON bilan_templates;
CREATE POLICY "Suppression templates coach"
ON bilan_templates FOR DELETE
USING (auth.uid() = coach_id);


-- PARTIE 2: Importer le template "Bilan Initial" système
-- ============================================================

INSERT INTO bilan_templates (id, name, coach_id, sections)
VALUES (
  'system-default'::uuid,
  'Bilan Initial',
  NULL,
  '[
    {
      "id": "sec_civility",
      "title": "Informations générales",
      "isRemovable": false,
      "isCivility": true,
      "fields": [
        {"id": "firstName", "label": "Prénom", "type": "text", "placeholder": "Jean"},
        {"id": "lastName", "label": "Nom", "type": "text", "placeholder": "Dupont"},
        {"id": "dob", "label": "Date de naissance", "type": "date"},
        {"id": "sex", "label": "Sexe", "type": "select", "options": ["Homme", "Femme", "Autre"]},
        {"id": "address", "label": "Adresse", "type": "text", "placeholder": "123 rue de la Forme"},
        {"id": "email", "label": "Email", "type": "text", "placeholder": "jean.dupont@email.com"},
        {"id": "phone", "label": "Téléphone", "type": "text", "placeholder": "0612345678"},
        {"id": "height", "label": "Taille (cm)", "type": "number", "placeholder": "180"},
        {"id": "weight", "label": "Poids (kg)", "type": "number", "placeholder": "75"},
        {"id": "energyExpenditureLevel", "label": "Niveau de dépense énergétique", "type": "select", "options": ["Sédentaire", "Légèrement actif", "Actif", "Très actif"]}
      ]
    },
    {
      "id": "sec_objectif",
      "title": "Objectif",
      "isRemovable": false,
      "fields": [
        {"id": "fld_objectif", "label": "Objectif principal", "type": "textarea", "placeholder": "Décrivez vos objectifs..."}
      ]
    },
    {
      "id": "sec_lifestyle",
      "title": "Vie quotidienne",
      "isRemovable": true,
      "fields": [
        {"id": "fld_profession", "label": "Profession", "type": "text", "placeholder": "Ex: Employé de bureau"}
      ]
    },
    {
      "id": "sec_alimentation",
      "title": "Alimentation",
      "isRemovable": true,
      "fields": [
        {"id": "fld_allergies", "label": "Allergies", "type": "textarea", "placeholder": "Lister les allergies connues..."},
        {"id": "fld_aversions", "label": "Aversions alimentaires", "type": "textarea", "placeholder": "Lister les aliments que la personne n'\''aime pas..."},
        {"id": "fld_habits", "label": "Habitudes alimentaires générales", "type": "textarea", "placeholder": "Décrire les habitudes alimentaires, nombre de repas par jour, etc."}
      ]
    }
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sections = EXCLUDED.sections,
  updated_at = NOW();


-- PARTIE 3: Vérification
-- ============================================================

-- Vérifier que la table existe
SELECT 
    table_name, 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'bilan_templates'
ORDER BY ordinal_position;

-- Vérifier que le bilan initial est importé
SELECT id, name, coach_id, created_at
FROM bilan_templates
WHERE id = 'system-default'::uuid;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
