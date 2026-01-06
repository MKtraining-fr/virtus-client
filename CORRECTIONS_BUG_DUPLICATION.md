# Rapport de correction - Bug de duplication des exercices

## Problème initial

Les exercices dans l'éditeur de programmes clients apparaissaient en double ou en triple après sauvegarde et rechargement du programme.

## Diagnostic

L'analyse a révélé plusieurs problèmes :

### 1. Données corrompues dans la base de données

- **Semaine 3** : 4 sessions au lieu de 3 (session dupliquée avec `session_order=1`)
- **Semaine 8** : Exercices dupliqués avec le même `exercise_order` dans la séance 3

### 2. Contrainte unique inadéquate

La contrainte `client_session_exercises_unique` était définie sur `(client_session_id, exercise_id, exercise_order)`, ce qui permettait d'avoir plusieurs exercices différents avec le même `exercise_order` dans la même session.

### 3. Code non synchronisé avec la contrainte

La fonction `createClientSessionExercisesBatch` utilisait `onConflict: 'client_session_id,exercise_id,exercise_order'` qui ne correspondait pas à la nouvelle contrainte.

## Corrections effectuées

### 1. Nettoyage de la base de données

```sql
-- Suppression de la session dupliquée dans la semaine 3
DELETE FROM client_sessions WHERE id = 'ID_SESSION_DUPLIQUEE';

-- Renumérotation des sessions
UPDATE client_sessions SET session_order = session_order - 1 
WHERE client_program_id = '...' AND week_number = 3 AND session_order > 1;

-- Suppression des exercices dupliqués dans la semaine 8
DELETE FROM client_session_exercises WHERE id IN (...);

-- Correction de l'exercise_order
UPDATE client_session_exercises SET exercise_order = 1 WHERE id = '...';
```

### 2. Ajout de contrainte unique sur les sessions

```sql
ALTER TABLE client_sessions 
ADD CONSTRAINT client_sessions_week_session_unique 
UNIQUE (client_program_id, week_number, session_order);
```

Cette contrainte empêche d'avoir plusieurs sessions avec le même `session_order` dans la même semaine d'un programme.

### 3. Modification de la contrainte sur les exercices

```sql
-- Suppression de l'ancienne contrainte
ALTER TABLE client_session_exercises 
DROP CONSTRAINT client_session_exercises_unique;

-- Ajout de la nouvelle contrainte
ALTER TABLE client_session_exercises 
ADD CONSTRAINT client_session_exercises_unique 
UNIQUE (client_session_id, exercise_order);
```

Cette contrainte empêche d'avoir plusieurs exercices avec le même `exercise_order` dans la même session.

### 4. Mise à jour du code

**Fichier modifié** : `src/services/clientProgramService.ts`

```typescript
// Avant
{
  onConflict: 'client_session_id,exercise_id,exercise_order',
  ignoreDuplicates: false
}

// Après
{
  onConflict: 'client_session_id,exercise_order',
  ignoreDuplicates: false
}
```

## Commit

```
38d7076 fix: update upsert constraint to match new unique constraint on client_session_exercises
```

## État final

- **10 semaines** avec **3 sessions** chacune
- Chaque session a le bon nombre d'exercices
- Les contraintes de base de données empêchent les doublons futurs
- Le code est synchronisé avec les nouvelles contraintes

## Recommandations

1. **Surveiller les logs** pour détecter d'éventuelles erreurs de contrainte
2. **Tester l'ajout d'exercices** dans différentes semaines pour confirmer que le bug est résolu
3. **Considérer l'ajout de validation côté client** pour éviter les soumissions de données invalides
