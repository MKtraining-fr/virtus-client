-- Mise à jour des config_schema pour les techniques adaptatives

-- Drop Sets (Dégressif)
UPDATE intensification_techniques
SET config_schema = '{
  "type": "drop_set",
  "fields": [
    {
      "name": "applyTo",
      "label": "Appliquer à",
      "type": "select",
      "options": [
        {"value": "all", "label": "Toutes les séries"},
        {"value": "last", "label": "Dernière série uniquement"},
        {"value": "specific", "label": "Séries spécifiques"}
      ],
      "default": "last"
    },
    {
      "name": "specificSets",
      "label": "Numéros de séries",
      "type": "number_array",
      "showIf": {"applyTo": "specific"},
      "placeholder": "Ex: 3, 4"
    },
    {
      "name": "dropLevels",
      "label": "Paliers de dégressif",
      "type": "array",
      "minItems": 1,
      "maxItems": 4,
      "itemSchema": {
        "reduction": {"type": "number", "label": "Réduction (%)", "min": 5, "max": 50, "default": 20},
        "targetReps": {"type": "text", "label": "Répétitions cibles", "placeholder": "8-10", "default": "8-10"}
      }
    }
  ]
}'::jsonb
WHERE name = 'Drop Sets (Dégressif)';

-- Rest-Pause
UPDATE intensification_techniques
SET config_schema = '{
  "type": "rest_pause",
  "fields": [
    {
      "name": "applyTo",
      "label": "Appliquer à",
      "type": "select",
      "options": [
        {"value": "all", "label": "Toutes les séries"},
        {"value": "last", "label": "Dernière série uniquement"},
        {"value": "specific", "label": "Séries spécifiques"}
      ],
      "default": "last"
    },
    {
      "name": "pauseDuration",
      "label": "Durée de la pause (secondes)",
      "type": "number",
      "min": 5,
      "max": 30,
      "default": 15
    },
    {
      "name": "miniSets",
      "label": "Nombre de mini-séries",
      "type": "number",
      "min": 1,
      "max": 5,
      "default": 2
    }
  ]
}'::jsonb
WHERE name = 'Rest-Pause';

-- Myo-Reps
UPDATE intensification_techniques
SET config_schema = '{
  "type": "myo_reps",
  "fields": [
    {
      "name": "applyTo",
      "label": "Appliquer à",
      "type": "select",
      "options": [
        {"value": "all", "label": "Toutes les séries"},
        {"value": "last", "label": "Dernière série uniquement"},
        {"value": "specific", "label": "Séries spécifiques"}
      ],
      "default": "last"
    },
    {
      "name": "activationSet",
      "label": "Série d'\''activation",
      "type": "object",
      "fields": {
        "targetReps": {"type": "text", "label": "Répétitions cibles", "default": "12-15"}
      }
    },
    {
      "name": "miniSets",
      "label": "Nombre de mini-séries",
      "type": "number",
      "min": 2,
      "max": 6,
      "default": 3
    },
    {
      "name": "restBetween",
      "label": "Repos entre mini-séries (secondes)",
      "type": "number",
      "min": 3,
      "max": 10,
      "default": 5
    },
    {
      "name": "targetRepsPerMini",
      "label": "Répétitions par mini-série",
      "type": "text",
      "default": "3-5"
    }
  ]
}'::jsonb
WHERE name = 'Myo-Reps';

-- Cluster Sets
UPDATE intensification_techniques
SET config_schema = '{
  "type": "cluster_set",
  "fields": [
    {
      "name": "applyTo",
      "label": "Appliquer à",
      "type": "select",
      "options": [
        {"value": "all", "label": "Toutes les séries"},
        {"value": "last", "label": "Dernière série uniquement"},
        {"value": "specific", "label": "Séries spécifiques"}
      ],
      "default": "all"
    },
    {
      "name": "clusters",
      "label": "Nombre de clusters par série",
      "type": "number",
      "min": 2,
      "max": 6,
      "default": 3
    },
    {
      "name": "repsPerCluster",
      "label": "Répétitions par cluster",
      "type": "text",
      "default": "2-3"
    },
    {
      "name": "restBetweenClusters",
      "label": "Repos entre clusters (secondes)",
      "type": "number",
      "min": 5,
      "max": 30,
      "default": 10
    }
  ]
}'::jsonb
WHERE name = 'Cluster Sets';

-- Tempo Contrôlé
UPDATE intensification_techniques
SET config_schema = '{
  "type": "tempo",
  "fields": [
    {
      "name": "applyTo",
      "label": "Appliquer à",
      "type": "select",
      "options": [
        {"value": "all", "label": "Toutes les séries"},
        {"value": "last", "label": "Dernière série uniquement"},
        {"value": "specific", "label": "Séries spécifiques"}
      ],
      "default": "all"
    },
    {
      "name": "eccentric",
      "label": "Phase excentrique (secondes)",
      "type": "number",
      "min": 1,
      "max": 10,
      "default": 4
    },
    {
      "name": "pause1",
      "label": "Pause en bas (secondes)",
      "type": "number",
      "min": 0,
      "max": 5,
      "default": 1
    },
    {
      "name": "concentric",
      "label": "Phase concentrique (secondes)",
      "type": "number",
      "min": 1,
      "max": 5,
      "default": 1
    },
    {
      "name": "pause2",
      "label": "Pause en haut (secondes)",
      "type": "number",
      "min": 0,
      "max": 5,
      "default": 0
    }
  ]
}'::jsonb
WHERE name = 'Tempo Contrôlé';
