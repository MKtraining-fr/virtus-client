# Structure de la table exercises

## Colonnes disponibles:
- id (uuid)
- name (text)
- description (text)
- category (text)
- muscle_group (text)
- equipment (text)
- difficulty (text)
- video_url (text)
- **image_url** (text) ← EXISTE
- created_at (timestamptz)
- updated_at (timestamptz)
- type (text)
- secondary_muscle_groups (array)
- alternative_1_id (uuid)
- alternative_2_id (uuid)
- created_by (uuid)
- is_public (boolean)
- is_archived (boolean)
- archived_at (timestamp)

## Problème identifié:
Le code dans `clientCreatedProgramServiceV4.ts` essaie de sélectionner la colonne `illustration_url` qui **N'EXISTE PAS** dans la table.
La colonne correcte est `image_url`.

## Lignes problématiques:
- Ligne 73: `.select('id, name, illustration_url')`
- Ligne 200: `.select('id, name, illustration_url')`
- Ligne 101: `illustrationUrl: exerciseInfo?.illustration_url || ''`
- Ligne 220: `illustrationUrl: exerciseInfo?.illustration_url || ''`
