-- ============================================================
-- MIGRATION: Insertion du template "Bilan Initial" système
-- ============================================================
-- Instructions:
-- 1. Exécuter d'abord create_bilan_templates_table.sql
-- 2. Puis exécuter ce fichier dans le SQL Editor
-- ============================================================

-- Insérer le template "Bilan Initial" système
INSERT INTO bilan_templates (id, name, coach_id, sections)
VALUES (
  'system-default'::uuid,
  'Bilan Initial',
  NULL, -- NULL = template système accessible à tous
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

-- Vérification
SELECT id, name, coach_id, created_at
FROM bilan_templates
WHERE id = 'system-default'::uuid;

-- ============================================================
-- Résultat attendu:
-- id            | name           | coach_id | created_at
-- system-default| Bilan Initial  | NULL     | 2025-10-05...
-- ============================================================
