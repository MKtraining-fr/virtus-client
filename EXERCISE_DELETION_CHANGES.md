# Système de suppression d'exercices avec permissions différenciées

## Vue d'ensemble

Ce document décrit les modifications apportées au système de suppression d'exercices pour implémenter des permissions différenciées entre les administrateurs et les coachs, tout en préservant le système d'archivage existant.

## Modifications apportées

### 1. Interface utilisateur (WorkoutDatabase.tsx)

Les modifications suivantes ont été apportées au composant `WorkoutDatabase.tsx` pour permettre aux administrateurs de sélectionner et supprimer tous les exercices sans limitation.

#### Fonction `selectAllExercises()`

La fonction a été modifiée pour permettre aux administrateurs de sélectionner tous les exercices filtrés, tandis que les coachs ne peuvent sélectionner que leurs propres exercices.

**Avant:**
```typescript
const selectAllExercises = () => {
  const selectableExercises = filteredExercises.filter((ex) => ex.coachId === user?.id);
  setSelectedExerciseIds(selectableExercises.map((ex) => ex.id));
};
```

**Après:**
```typescript
const selectAllExercises = () => {
  // Admin peut sélectionner tous les exercices, coach seulement les siens
  const selectableExercises = user?.role === 'admin' 
    ? filteredExercises 
    : filteredExercises.filter((ex) => ex.coachId === user?.id);
  setSelectedExerciseIds(selectableExercises.map((ex) => ex.id));
};
```

#### Rendu des cartes d'exercices

Les conditions de sélection et d'affichage des contrôles ont été modifiées pour tenir compte du rôle administrateur.

**Modification 1: Désactivation des cartes non sélectionnables**
```typescript
// Avant
selectionMode && user?.id !== exercise.coachId
  ? 'opacity-50 cursor-not-allowed'
  : 'cursor-pointer'

// Après
selectionMode && user?.role !== 'admin' && user?.id !== exercise.coachId
  ? 'opacity-50 cursor-not-allowed'
  : 'cursor-pointer'
```

**Modification 2: Affichage de la checkbox de sélection**
```typescript
// Avant
{selectionMode && user?.id === exercise.coachId && (

// Après
{selectionMode && (user?.role === 'admin' || user?.id === exercise.coachId) && (
```

**Modification 3: Affichage du bouton de suppression individuelle**
```typescript
// Avant
{!selectionMode && user?.id === exercise.coachId && (

// Après
{!selectionMode && (user?.role === 'admin' || user?.id === exercise.coachId) && (
```

### 2. Politiques RLS Supabase (20251114_add_exercises_rls_policies.sql)

Une nouvelle migration a été créée pour configurer les politiques de sécurité au niveau des lignes (Row Level Security) sur la table `exercises`. Ces politiques garantissent que les permissions sont appliquées au niveau de la base de données.

#### Politiques SELECT

**Administrateurs:** Peuvent voir tous les exercices sans restriction.

**Coachs:** Peuvent voir les exercices système (created_by IS NULL) et leurs propres exercices.

**Clients:** Peuvent voir les exercices système et les exercices créés par leur coach.

#### Politiques INSERT

**Administrateurs:** Peuvent insérer n'importe quel exercice.

**Coachs:** Peuvent insérer uniquement des exercices où ils sont le créateur (created_by = auth.uid()).

#### Politiques UPDATE

**Administrateurs:** Peuvent modifier n'importe quel exercice.

**Coachs:** Peuvent modifier uniquement leurs propres exercices.

#### Politiques DELETE

**Administrateurs:** Peuvent supprimer n'importe quel exercice.

**Coachs:** Peuvent supprimer uniquement leurs propres exercices.

## Système d'archivage préservé

Le système d'archivage existant dans `exerciseArchiveService.ts` reste inchangé et continue de fonctionner comme prévu. Lorsqu'un exercice est supprimé (via archivage), les étapes suivantes sont exécutées:

1. **Récupération des données:** L'exercice complet est récupéré depuis la table `exercises`.

2. **Création de l'archive:** Une copie complète de l'exercice est insérée dans la table `exercise_archives` avec les métadonnées (archived_by, archived_at).

3. **Suppression de l'original:** L'exercice est supprimé de la table `exercises`.

Ce processus garantit que même si un administrateur supprime un exercice utilisé par des coachs ou des clients, une copie archivée reste disponible pour préserver l'intégrité des programmes existants.

## Comportement attendu

### Pour les administrateurs

- Peuvent sélectionner tous les exercices visibles (système, coachs, etc.)
- Peuvent supprimer n'importe quel exercice
- Le bouton "Tout sélectionner" sélectionne tous les exercices filtrés
- Les exercices supprimés sont archivés automatiquement

### Pour les coachs

- Peuvent sélectionner uniquement leurs propres exercices
- Ne peuvent pas sélectionner les exercices système ou d'autres coachs
- Le bouton "Tout sélectionner" sélectionne uniquement leurs exercices
- Les exercices supprimés sont archivés automatiquement

### Pour les clients

- N'ont pas accès à l'interface de suppression (WorkoutDatabase est réservé aux coachs/admins)
- Continuent à voir les exercices système et ceux de leur coach

## Migration de la base de données

Pour appliquer les nouvelles politiques RLS, la migration suivante doit être exécutée:

```bash
# Via Supabase CLI
supabase db push

# Ou via l'interface Supabase
# Coller le contenu de 20251114_add_exercises_rls_policies.sql dans l'éditeur SQL
```

## Tests recommandés

### Test 1: Sélection en tant qu'administrateur
1. Se connecter en tant qu'administrateur
2. Accéder à la base de données d'exercices
3. Activer le mode sélection
4. Vérifier que tous les exercices affichent une checkbox
5. Cliquer sur "Tout sélectionner"
6. Vérifier que tous les exercices sont sélectionnés

### Test 2: Sélection en tant que coach
1. Se connecter en tant que coach
2. Accéder à la base de données d'exercices
3. Activer le mode sélection
4. Vérifier que seuls les exercices du coach affichent une checkbox
5. Vérifier que les exercices système sont grisés
6. Cliquer sur "Tout sélectionner"
7. Vérifier que seuls les exercices du coach sont sélectionnés

### Test 3: Suppression avec archivage (admin)
1. Se connecter en tant qu'administrateur
2. Sélectionner plusieurs exercices (incluant des exercices système et de coachs)
3. Cliquer sur "Archiver"
4. Confirmer l'action
5. Vérifier que les exercices ont été supprimés de la liste
6. Vérifier dans la base de données que les archives ont été créées

### Test 4: Suppression avec archivage (coach)
1. Se connecter en tant que coach
2. Sélectionner ses propres exercices
3. Cliquer sur "Archiver"
4. Confirmer l'action
5. Vérifier que les exercices ont été supprimés de la liste
6. Vérifier dans la base de données que les archives ont été créées

## Notes importantes

- Les politiques RLS sont appliquées au niveau de la base de données, ce qui garantit la sécurité même si l'interface est contournée.
- Le système d'archivage préserve les exercices supprimés pendant 90 jours par défaut (configurable).
- Les exercices archivés peuvent être restaurés via la fonction `restoreExercise()`.
- La fonction de nettoyage automatique `cleanup_old_archived_exercises()` supprime définitivement les archives après la période de rétention.
