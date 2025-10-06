-- Mise à jour du template "Bilan Initial" avec les modifications demandées
-- 1. Déplacement du champ "Niveau d'activité physique" vers "Informations Générales"
-- 2. Remplacement du champ "Allergies alimentaires" par une liste de cases à cocher
-- 3. Ajout d'une option "Autre" avec champ conditionnel

UPDATE bilan_templates
SET sections = '[
  {
    "id": "informations_generales",
    "title": "Informations Générales",
    "fields": [
      {
        "id": "prenom",
        "type": "text",
        "label": "Prénom",
        "placeholder": ""
      },
      {
        "id": "nom",
        "type": "text",
        "label": "Nom",
        "placeholder": ""
      },
      {
        "id": "date_naissance",
        "type": "date",
        "label": "Date de naissance",
        "placeholder": ""
      },
      {
        "id": "sexe",
        "type": "select",
        "label": "Sexe",
        "options": [
          "Homme",
          "Femme",
          "Autre"
        ]
      },
      {
        "id": "taille",
        "type": "number",
        "label": "Taille (cm)",
        "placeholder": ""
      },
      {
        "id": "poids",
        "type": "number",
        "label": "Poids actuel (kg)",
        "placeholder": ""
      },
      {
        "id": "email",
        "type": "text",
        "label": "Email",
        "placeholder": ""
      },
      {
        "id": "telephone",
        "type": "text",
        "label": "Téléphone",
        "placeholder": ""
      },
      {
        "id": "activite_physique",
        "type": "select",
        "label": "Niveau d'\''activité physique",
        "options": [
          "Sédentaire",
          "Légèrement actif",
          "Modérément actif",
          "Très actif",
          "Extrêmement actif"
        ]
      }
    ],
    "isCivility": true,
    "isRemovable": false
  },
  {
    "id": "objectif",
    "title": "Objectif",
    "fields": [
      {
        "id": "objectif_principal",
        "type": "textarea",
        "label": "Quel est votre objectif principal?",
        "placeholder": ""
      },
      {
        "id": "poids_souhaite",
        "type": "number",
        "label": "Poids souhaité (kg)",
        "placeholder": ""
      },
      {
        "id": "delai",
        "type": "text",
        "label": "Délai souhaité",
        "placeholder": ""
      }
    ],
    "isRemovable": false
  },
  {
    "id": "vie_quotidienne",
    "title": "Vie Quotidienne",
    "fields": [
      {
        "id": "profession",
        "type": "text",
        "label": "Profession",
        "placeholder": ""
      }
    ],
    "isRemovable": false
  },
  {
    "id": "alimentation",
    "title": "Alimentation",
    "fields": [
      {
        "id": "allergies",
        "type": "checkbox",
        "label": "Allergies alimentaires",
        "options": [
          "Céréales contenant du gluten (blé, seigle, orge, avoine)",
          "Crustacés",
          "Œufs",
          "Poisson",
          "Arachides (cacahuètes)",
          "Soja",
          "Lait et produits laitiers",
          "Fruits à coque (amandes, noisettes, noix, cajou, etc.)",
          "Céleri",
          "Moutarde",
          "Graines de sésame",
          "Sulfites",
          "Lupin",
          "Mollusques",
          "Autre"
        ],
        "hasOther": true,
        "otherFieldId": "allergies_autre"
      },
      {
        "id": "allergies_autre",
        "type": "text",
        "label": "Précisez autre allergie",
        "placeholder": "Indiquez les autres allergies...",
        "conditionalOn": "allergies",
        "conditionalValue": "Autre"
      },
      {
        "id": "aversions",
        "type": "textarea",
        "label": "Aliments que vous n'\''aimez pas",
        "placeholder": ""
      },
      {
        "id": "habitudes",
        "type": "textarea",
        "label": "Habitudes alimentaires actuelles",
        "placeholder": ""
      }
    ],
    "isRemovable": false
  }
]'::jsonb,
updated_at = NOW()
WHERE name = 'Bilan Initial';
