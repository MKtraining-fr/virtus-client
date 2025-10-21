# Documentation Technique - Système d'Archivage des Exercices

## Vue d'Ensemble

Ce document décrit l'architecture technique et l'implémentation du système d'archivage et de suppression automatique des exercices dans l'application Virtus.

## Architecture

### Composants Principaux

1. **Interface Utilisateur** (`WorkoutDatabase.tsx`)
   - Mode de sélection multiple avec cases à cocher
   - Barre d'actions pour les opérations groupées
   - Boutons d'archivage et de suppression

2. **Service d'Archivage** (`exerciseArchiveService.ts`)
   - Fonctions pour archiver, restaurer et supprimer des exercices
   - Gestion des opérations groupées
   - Communication avec Supabase

3. **Base de Données Supabase**
   - Table `exercise_archives` : Stockage des exercices archivés
   - Table `archive_cleanup_logs` : Logs des opérations de nettoyage
   - Fonction PostgreSQL `cleanup_old_archived_exercises()` : Nettoyage automatique

4. **Fonction Edge Supabase** (`cleanup-archived-exercises`)
   - Point d'entrée HTTP pour le nettoyage automatique
   - Appelée par GitHub Actions quotidiennement

5. **Workflow GitHub Actions** (`cleanup-archived-exercises.yml`)
   - Exécution quotidienne à 2h du matin (UTC)
   - Exécution manuelle possible via l'interface GitHub

## Schéma de Base de Données

### Table `exercise_archives`

```sql
CREATE TABLE public.exercise_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL UNIQUE,
    exercise_name TEXT NOT NULL,
    exercise_data JSONB NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    marked_for_deletion_at TIMESTAMPTZ
);
```

**Champs** :
- `id` : Identifiant unique de l'archive
- `exercise_id` : ID de l'exercice archivé (unique)
- `exercise_name` : Nom de l'exercice (pour faciliter les recherches)
- `exercise_data` : Données complètes de l'exercice au format JSONB
- `archived_at` : Date et heure d'archivage
- `archived_by` : ID de l'utilisateur qui a archivé l'exercice
- `marked_for_deletion_at` : Date de marquage pour suppression (optionnel)

**Index** :
- `idx_exercise_archives_archived_by` : Index sur `archived_by`
- `idx_exercise_archives_archived_at` : Index sur `archived_at`
- `idx_exercise_archives_marked_for_deletion` : Index partiel sur `marked_for_deletion_at`

**RLS (Row Level Security)** :
- Les utilisateurs peuvent voir, insérer, modifier et supprimer uniquement leurs propres archives
- Les politiques sont basées sur `auth.uid() = archived_by`

### Table `archive_cleanup_logs`

```sql
CREATE TABLE public.archive_cleanup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_count INTEGER NOT NULL DEFAULT 0,
    exercise_ids UUID[] NOT NULL DEFAULT '{}',
    execution_details JSONB
);
```

**Champs** :
- `id` : Identifiant unique du log
- `deleted_at` : Date et heure de l'opération de nettoyage
- `deleted_count` : Nombre d'exercices supprimés
- `exercise_ids` : Liste des IDs des exercices supprimés
- `execution_details` : Détails de l'exécution (période de rétention, date de coupure, etc.)

**RLS** :
- Seul le rôle `service_role` peut lire et écrire dans cette table

## Fonction PostgreSQL

### `cleanup_old_archived_exercises(retention_days INTEGER)`

Cette fonction supprime les exercices archivés depuis plus de `retention_days` jours (par défaut 90 jours).

```sql
CREATE OR REPLACE FUNCTION public.cleanup_old_archived_exercises(retention_days INTEGER DEFAULT 90)
RETURNS TABLE (
    deleted_count INTEGER,
    exercise_ids UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
    v_exercise_ids UUID[];
    v_cutoff_date TIMESTAMPTZ;
BEGIN
    -- Calculate cutoff date
    v_cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
    
    -- Get IDs of exercises to delete
    SELECT ARRAY_AGG(id) INTO v_exercise_ids
    FROM public.exercise_archives
    WHERE archived_at < v_cutoff_date;
    
    -- Delete old archived exercises
    DELETE FROM public.exercise_archives
    WHERE archived_at < v_cutoff_date;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    IF v_deleted_count > 0 THEN
        INSERT INTO public.archive_cleanup_logs (deleted_count, exercise_ids, execution_details)
        VALUES (
            v_deleted_count,
            v_exercise_ids,
            jsonb_build_object(
                'retention_days', retention_days,
                'cutoff_date', v_cutoff_date,
                'executed_at', NOW()
            )
        );
    END IF;
    
    -- Return results
    RETURN QUERY SELECT v_deleted_count, v_exercise_ids;
END;
$$;
```

**Permissions** :
- Seul le rôle `service_role` peut exécuter cette fonction

## Service d'Archivage (`exerciseArchiveService.ts`)

### Fonctions Principales

#### `archiveExercise(exerciseId: string, userId: string)`
Archive un seul exercice en :
1. Récupérant les données de l'exercice depuis la table `exercises`
2. Créant une entrée dans `exercise_archives`
3. Supprimant l'exercice de la table `exercises`

#### `archiveMultipleExercises(exerciseIds: string[], userId: string)`
Archive plusieurs exercices en appelant `archiveExercise()` pour chaque ID.

Retourne :
- `success` : Booléen indiquant si toutes les opérations ont réussi
- `archivedCount` : Nombre d'exercices archivés avec succès
- `errors` : Liste des erreurs rencontrées

#### `restoreExercise(archiveId: string)`
Restaure un exercice archivé en :
1. Récupérant l'archive depuis `exercise_archives`
2. Réinsérant l'exercice dans la table `exercises`
3. Supprimant l'archive

#### `deleteArchivedExercise(archiveId: string)`
Supprime définitivement un exercice archivé.

#### `getArchivedExercises(userId: string)`
Récupère tous les exercices archivés d'un utilisateur.

#### `markForDeletion(archiveId: string)`
Marque un exercice archivé pour suppression en définissant `marked_for_deletion_at`.

## Interface Utilisateur (`WorkoutDatabase.tsx`)

### État de Sélection

```typescript
const [selectionMode, setSelectionMode] = useState(false);
const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
```

### Fonctions de Gestion

#### `toggleSelectionMode()`
Active/désactive le mode de sélection et réinitialise les sélections.

#### `toggleExerciseSelection(exerciseId: string)`
Ajoute ou retire un exercice de la liste des sélections.

#### `selectAllExercises()`
Sélectionne tous les exercices créés par l'utilisateur.

#### `deselectAllExercises()`
Désélectionne tous les exercices.

#### `handleBulkArchive()`
Archive tous les exercices sélectionnés en :
1. Demandant confirmation à l'utilisateur
2. Appelant `archiveMultipleExercises()` du service
3. Mettant à jour la liste locale des exercices
4. Affichant un message de succès ou d'erreur

#### `handleBulkDelete()`
Supprime définitivement tous les exercices sélectionnés (sans archivage).

### Composants Visuels

#### Barre d'Actions
```tsx
{selectionMode && (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
                {selectedExerciseIds.length} exercice(s) sélectionné(s)
            </span>
            <div className="flex gap-2">
                <button onClick={selectAllExercises}>Tout sélectionner</button>
                <button onClick={deselectAllExercises}>Tout désélectionner</button>
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={handleBulkArchive}>
                <ArchiveIcon className="w-5 h-5 mr-2" />
                Archiver
            </Button>
            <Button variant="danger" onClick={handleBulkDelete}>
                <TrashIcon className="w-5 h-5 mr-2" />
                Supprimer
            </Button>
        </div>
    </div>
)}
```

#### Cases à Cocher
```tsx
{selectionMode && user?.id === exercise.coachId && (
    <div className="absolute top-2 left-2 z-10">
        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            selectedExerciseIds.includes(exercise.id)
                ? 'bg-primary border-primary'
                : 'bg-white border-gray-300'
        }`}>
            {selectedExerciseIds.includes(exercise.id) && (
                <CheckIcon className="w-4 h-4 text-white" />
            )}
        </div>
    </div>
)}
```

## Fonction Edge Supabase

### Fichier : `cleanup-archived-exercises/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Vérification de la clé API
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== Deno.env.get('CLEANUP_API_KEY')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Création du client Supabase avec le service role
  const supabase = createClient(
    Deno.env.get('VIRTUS_SUPABASE_URL')!,
    Deno.env.get('VIRTUS_SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Appel de la fonction de nettoyage
  const { data, error } = await supabase.rpc('cleanup_old_archived_exercises', {
    retention_days: 90
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    deleted_count: data[0]?.deleted_count || 0,
    exercise_ids: data[0]?.exercise_ids || []
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Variables d'Environnement (Supabase)
- `VIRTUS_SUPABASE_URL` : URL du projet Supabase
- `VIRTUS_SUPABASE_SERVICE_ROLE_KEY` : Clé de rôle de service
- `CLEANUP_API_KEY` : Clé API secrète pour sécuriser l'appel

## Workflow GitHub Actions

### Fichier : `.github/workflows/cleanup-archived-exercises.yml`

```yaml
name: Cleanup Archived Exercises

on:
  schedule:
    - cron: '0 2 * * *'  # Tous les jours à 2h du matin (UTC)
  workflow_dispatch:  # Permet l'exécution manuelle

jobs:
  cleanup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/cleanup-archived-exercises" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "x-api-key: ${{ secrets.CLEANUP_API_KEY }}" \
            -H "Content-Type: application/json" \
            --fail-with-body \
            --show-error \
            --silent \
            --output response.json
          
          echo "Response from Edge Function:"
          cat response.json
          
          if [ $? -eq 0 ]; then
            echo "✅ Cleanup completed successfully"
          else
            echo "❌ Cleanup failed"
            exit 1
          fi
      
      - name: Upload response as artifact
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: cleanup-response
          path: response.json
          retention-days: 7
```

### Secrets GitHub
- `SUPABASE_URL` : URL du projet Supabase
- `SUPABASE_ANON_KEY` : Clé anonyme Supabase
- `CLEANUP_API_KEY` : Clé API secrète pour l'authentification

## Flux de Données

### Archivage d'un Exercice

```
1. Utilisateur sélectionne des exercices
2. Utilisateur clique sur "Archiver"
3. WorkoutDatabase.tsx appelle handleBulkArchive()
4. handleBulkArchive() appelle archiveMultipleExercises()
5. archiveMultipleExercises() pour chaque exercice :
   a. Récupère les données de l'exercice
   b. Crée une entrée dans exercise_archives
   c. Supprime l'exercice de la table exercises
6. Mise à jour de l'interface utilisateur
7. Affichage du message de succès
```

### Nettoyage Automatique

```
1. GitHub Actions déclenche le workflow (quotidien ou manuel)
2. Workflow appelle la fonction Edge cleanup-archived-exercises
3. Fonction Edge vérifie la clé API
4. Fonction Edge crée un client Supabase avec service_role
5. Fonction Edge appelle cleanup_old_archived_exercises(90)
6. Fonction PostgreSQL :
   a. Calcule la date de coupure (NOW() - 90 jours)
   b. Récupère les IDs des exercices à supprimer
   c. Supprime les exercices archivés
   d. Enregistre l'opération dans archive_cleanup_logs
7. Fonction Edge retourne les résultats
8. Workflow affiche les résultats dans les logs
```

## Sécurité

### Row Level Security (RLS)

Toutes les tables sont protégées par RLS :

**exercise_archives** :
- Les utilisateurs ne peuvent accéder qu'à leurs propres archives
- Basé sur `auth.uid() = archived_by`

**archive_cleanup_logs** :
- Seul le rôle `service_role` peut accéder à cette table

### Authentification de la Fonction Edge

La fonction Edge utilise une clé API secrète (`CLEANUP_API_KEY`) pour empêcher les appels non autorisés.

### Permissions PostgreSQL

La fonction `cleanup_old_archived_exercises()` est marquée `SECURITY DEFINER` et n'est exécutable que par le rôle `service_role`.

## Maintenance

### Vérifier les Archives

```sql
SELECT 
    ea.id,
    ea.exercise_name,
    ea.archived_at,
    u.email as archived_by_email,
    EXTRACT(DAY FROM NOW() - ea.archived_at) as days_archived
FROM exercise_archives ea
JOIN auth.users u ON ea.archived_by = u.id
ORDER BY ea.archived_at DESC;
```

### Vérifier les Logs de Nettoyage

```sql
SELECT 
    id,
    deleted_at,
    deleted_count,
    execution_details
FROM archive_cleanup_logs
ORDER BY deleted_at DESC
LIMIT 10;
```

### Restaurer Manuellement un Exercice

```sql
-- 1. Récupérer les données de l'exercice
SELECT exercise_data FROM exercise_archives WHERE id = '<archive_id>';

-- 2. Réinsérer l'exercice (remplacer <exercise_data> par le résultat de la requête précédente)
INSERT INTO exercises SELECT * FROM jsonb_populate_record(null::exercises, '<exercise_data>');

-- 3. Supprimer l'archive
DELETE FROM exercise_archives WHERE id = '<archive_id>';
```

## Évolutions Futures

### Fonctionnalités Potentielles

1. **Page de Gestion des Archives**
   - Visualiser tous les exercices archivés
   - Restaurer des exercices archivés
   - Supprimer définitivement des exercices archivés

2. **Notifications**
   - Notifier l'utilisateur avant la suppression définitive d'un exercice
   - Envoyer un rapport mensuel des exercices archivés

3. **Période de Rétention Configurable**
   - Permettre à chaque utilisateur de définir sa propre période de rétention
   - Stocker cette préférence dans le profil utilisateur

4. **Export des Archives**
   - Exporter les exercices archivés au format JSON ou CSV
   - Permettre la réimportation ultérieure

5. **Statistiques**
   - Tableau de bord avec statistiques sur les exercices archivés
   - Graphiques de tendances d'archivage

## Références

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation GitHub Actions](https://docs.github.com/en/actions)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Documentation Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

