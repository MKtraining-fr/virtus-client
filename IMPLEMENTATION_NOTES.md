# Notes d'implémentation - Système de suppression d'exercices

## Analyse de l'existant

### Structure de la base de données
- Table `exercises` avec colonnes:
  - `id` (uuid)
  - `name`, `description`, `category`, etc.
  - `created_by` (uuid) - identifie le créateur
  - `is_archived` (boolean)
  - `image_url` (text) - **Note: pas `illustration_url`**

- Table `exercise_archives` déjà existante:
  - `id`, `exercise_id`, `exercise_name`
  - `exercise_data` (jsonb) - contient toutes les données de l'exercice
  - `archived_by` (uuid)
  - `archived_at`, `marked_for_deletion_at`

### Service d'archivage existant
Le fichier `exerciseArchiveService.ts` contient déjà:
- `archiveExercise()` - archive un exercice (copie dans exercise_archives puis supprime)
- `archiveMultipleExercises()` - archive plusieurs exercices
- `restoreExercise()` - restaure un exercice archivé
- `deleteArchivedExercise()` - supprime définitivement une archive

### Interface actuelle (WorkoutDatabase.tsx)
- Mode sélection déjà implémenté avec `selectionMode`
- Boutons "Archiver" et "Supprimer" déjà présents
- Logique de sélection limitée aux exercices du coach (`user?.id === exercise.coachId`)
- Les exercices système ne peuvent pas être sélectionnés

### Système de rôles
- `user.role` peut être: 'admin', 'coach', 'client'
- Les admins ont accès à tous les exercices
- Les coachs ne voient que leurs exercices et ceux du système

## Besoins identifiés

### 1. Admin - Suppression illimitée
- L'admin doit pouvoir sélectionner TOUS les exercices (pas seulement les siens)
- Pas de limite sur la sélection
- Le système d'archivage doit être préservé

### 2. Coach - Suppression limitée
- Les coachs peuvent supprimer uniquement leurs propres exercices
- Comportement actuel déjà correct

### 3. Connexion à Supabase
- Les fonctions d'archivage utilisent déjà Supabase
- Pas besoin de modification majeure, juste d'ajuster les permissions de sélection dans l'UI

## Plan d'implémentation

### Étape 1: Modifier la logique de sélection dans WorkoutDatabase.tsx
- Permettre à l'admin de sélectionner tous les exercices
- Garder la restriction pour les coachs (uniquement leurs exercices)

### Étape 2: Vérifier les politiques RLS Supabase
- S'assurer que les admins ont les permissions nécessaires
- Vérifier que le système d'archivage fonctionne pour tous les rôles

### Étape 3: Tester
- Tester la sélection et suppression en tant qu'admin
- Tester la sélection et suppression en tant que coach
- Vérifier que les archives sont bien créées
