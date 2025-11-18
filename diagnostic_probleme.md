# Diagnostic du problème d'assignation

## Problème identifié

### ❌ Incohérence majeure dans le schéma de la base de données

Le code et les migrations font référence à des tables qui **n'existent pas** dans la base de données.

### Tables existantes (créées dans les migrations)

```sql
CREATE TABLE public.programs
CREATE TABLE public.sessions  
CREATE TABLE public.session_exercises
CREATE TABLE public.client_programs
CREATE TABLE public.client_sessions
CREATE TABLE public.client_session_exercises
CREATE TABLE public.client_coach_relationships
CREATE TABLE public.client_exercise_performance
```

### Tables référencées dans le code mais NON créées

```
client_created_programs
client_created_sessions
client_created_session_exercises
```

## Analyse détaillée

### 1. La fonction RPC échoue silencieusement

La fonction `assign_program_to_client_atomic` dans `20251110_atomic_assignment_function.sql` tente d'insérer dans `client_created_programs` :

```sql
INSERT INTO client_created_programs (
  client_id,
  coach_id,
  name,
  objective,
  week_count,
  source_type,
  program_template_id,
  created_at,
  updated_at
)
```

**Cette table n'existe pas**, donc la fonction échoue systématiquement.

### 2. Les migrations modifient des tables inexistantes

La migration `20251104_add_hybrid_system_columns.sql` tente de modifier `client_created_programs` :

```sql
ALTER TABLE client_created_programs 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'client_created'
```

Cette migration **échoue silencieusement** car la table n'existe pas.

### 3. Le code frontend utilise les mauvaises tables

Tous les services utilisent `client_created_*` :

- `clientCreatedProgramServiceV2.ts`
- `clientCreatedProgramServiceV3.ts`
- `clientCreatedProgramServiceV4.ts`
- `clientProgramService.ts`
- `programModificationService.ts`
- `coachProgramViewService.ts`

## Cause racine

Il y a eu une **refactorisation incomplète** du schéma de la base de données :

1. **Initialement** : Les tables étaient nommées `client_programs`, `client_sessions`, etc.
2. **Refactorisation** : Quelqu'un a décidé de renommer en `client_created_programs`, `client_created_sessions`, etc.
3. **Problème** : La migration de renommage n'a jamais été créée ou appliquée

## Solutions possibles

### Option 1 : Renommer les tables existantes (RECOMMANDÉ)

Créer une migration pour renommer les tables :

```sql
ALTER TABLE client_programs RENAME TO client_created_programs;
ALTER TABLE client_sessions RENAME TO client_created_sessions;
ALTER TABLE client_session_exercises RENAME TO client_created_session_exercises;
```

**Avantages** :
- Conserve les données existantes
- Aligne la base de données avec le code
- Minimal impact

**Inconvénients** :
- Nécessite de mettre à jour les contraintes de clés étrangères

### Option 2 : Modifier le code pour utiliser les tables existantes

Remplacer toutes les références à `client_created_*` par `client_*` dans :
- Les services TypeScript
- La fonction RPC
- Les migrations

**Avantages** :
- Pas de modification de la base de données
- Fonctionne avec le schéma existant

**Inconvénients** :
- Beaucoup de modifications de code
- Risque d'oublier des références

### Option 3 : Créer les tables manquantes et migrer les données

Créer les nouvelles tables et migrer les données :

```sql
CREATE TABLE client_created_programs AS SELECT * FROM client_programs;
-- etc.
```

**Avantages** :
- Permet de garder les deux systèmes temporairement

**Inconvénients** :
- Duplication des données
- Complexité accrue
- Risque de désynchronisation

## Recommandation

**Option 1 : Renommer les tables existantes**

C'est la solution la plus propre et la plus cohérente avec l'architecture actuelle du code.

## Vérifications nécessaires avant correction

1. Vérifier qu'il n'y a pas de données importantes dans les tables actuelles
2. Vérifier toutes les contraintes de clés étrangères
3. Vérifier les politiques RLS associées
4. Créer une sauvegarde de la base de données

## Impact de la correction

### Tables à renommer

```
client_programs → client_created_programs
client_sessions → client_created_sessions
client_session_exercises → client_created_session_exercises
```

### Contraintes à mettre à jour

Toutes les clés étrangères référençant ces tables devront être mises à jour :
- `program_assignments.client_program_id` → référence `client_created_programs`
- `client_created_sessions.program_id` → référence `client_created_programs`
- `client_created_session_exercises.session_id` → référence `client_created_sessions`

### Politiques RLS à vérifier

Les politiques RLS sur les anciennes tables devront être recréées sur les nouvelles tables.
