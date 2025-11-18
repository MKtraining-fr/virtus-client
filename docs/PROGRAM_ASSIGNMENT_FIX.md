# Correction : Fonction d'assignation de programme manquante

## Problème

L'assignation de programmes aux clients échouait avec l'erreur suivante :

```
POST https://dqsbfnsicmzovlrhuoif.supabase.co/rest/v1/rpc/assign_program_to_client_atomic 404 (Not Found)

Error: PGRST202 - Could not find the function public.assign_program_to_client_atomic
```

## Cause

La fonction PostgreSQL `assign_program_to_client_atomic` définie dans la migration `20251110_atomic_assignment_function.sql` n'avait jamais été appliquée à la base de données de production.

## Solution

La fonction a été créée directement dans la base de données Supabase via une migration le 2025-11-18.

### Fonction créée : `assign_program_to_client_atomic`

Cette fonction garantit l'atomicité de l'assignation d'un programme à un client en effectuant les opérations suivantes dans une transaction unique :

1. Vérification de la relation coach-client
2. Vérification de l'existence du template de programme
3. Duplication du programme dans `client_created_programs`
4. Création de l'assignation dans `program_assignments`
5. Duplication de toutes les séances dans `client_created_sessions`
6. Duplication de tous les exercices dans `client_created_session_exercises`

### Paramètres

- `p_template_id` (UUID) : ID du programme template
- `p_client_id` (UUID) : ID du client
- `p_coach_id` (UUID) : ID du coach
- `p_start_date` (DATE) : Date de début du programme

### Retour

JSON avec :
- `success` (boolean)
- `assignment_id` (UUID) : ID de l'assignation créée
- `client_program_id` (UUID) : ID du programme dupliqué
- `message` (string)
- `error` (string, en cas d'échec)

## Migration appliquée

- **Nom** : `create_assign_program_to_client_atomic_function`
- **Date** : 2025-11-18
- **Fichier source** : `supabase/migrations/20251110_atomic_assignment_function.sql`

## Fonctions supplémentaires

Deux fonctions utilitaires ont également été créées :

- `complete_program_assignment(p_assignment_id UUID)` : Marque un programme comme terminé
- `update_client_progression(p_assignment_id UUID, p_current_week INTEGER, p_current_session INTEGER)` : Met à jour la progression

## Vérification

Pour vérifier que la fonction existe :

```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'assign_program_to_client_atomic';
```

## Impact

✅ L'assignation de programmes aux clients fonctionne maintenant correctement  
✅ Toutes les opérations sont atomiques (tout ou rien)  
✅ Les données sont correctement dupliquées pour chaque client
