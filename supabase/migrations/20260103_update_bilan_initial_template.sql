-- Mettre à jour le template de bilan initial dans Supabase avec la nouvelle section "Objectif et Conditions d'Entraînement"
-- Date: 2026-01-03

UPDATE bilan_templates
SET sections = jsonb_set(
  sections,
  '{3}',
  '{
    "id": "training",
    "title": "Objectif et Conditions d''Entraînement",
    "isRemovable": false,
    "fields": [
      {
        "id": "experience_sportive",
        "label": "Expérience sportive",
        "type": "textarea",
        "placeholder": "Décrivez l''expérience sportive du client",
        "required": false
      },
      {
        "id": "pratique_musculation_depuis",
        "label": "Pratique la musculation depuis",
        "type": "select",
        "options": ["Pas encore commencé", "Moins de 6 mois", "Plus d''1 an", "Entre 2 ans et 5 ans", "Plus de 5 ans"],
        "required": false
      },
      {
        "id": "seances_par_semaine",
        "label": "Combien de séances/semaine",
        "type": "number",
        "placeholder": "Ex: 4",
        "required": false
      },
      {
        "id": "duree_seances",
        "label": "Durée des séances (minutes)",
        "type": "number",
        "placeholder": "Ex: 90",
        "required": false
      },
      {
        "id": "entrainement_type",
        "label": "Entraînement type",
        "type": "textarea",
        "placeholder": "Décrivez le type d''entraînement (ex: PPL, Full Body, etc.)",
        "required": false
      },
      {
        "id": "problematique",
        "label": "Problématique rencontrée",
        "type": "textarea",
        "placeholder": "Décrivez les problématiques rencontrées (douleurs, limitations, etc.)",
        "required": false
      }
    ]
  }'::jsonb
),
updated_at = NOW()
WHERE name = 'Bilan Initial (Système)' OR id = 'initial-bilan';
