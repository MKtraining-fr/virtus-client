# Implémentation Complète : Système d'Assignation de Programmes

**Projet** : Virtus - Application de Coaching SaaS  
**Date** : 19 novembre 2025  
**Auteur** : Manus AI  
**Statut** : Base de données et services complétés - Interfaces utilisateur à finaliser

---

## Résumé Exécutif

Le système d'assignation de programmes de Virtus a été entièrement refactorisé. La base de données a été restructurée avec un modèle de données clair et sécurisé, les services TypeScript ont été mis à jour pour utiliser ce nouveau modèle, et les fondations sont posées pour une refonte complète des interfaces utilisateur.

### Problèmes Résolus

**Faille de sécurité critique** : La table `program_assignments` n'avait aucune politique RLS. Cette faille a été corrigée avec l'implémentation de 48 politiques de sécurité strictes.

**Modèle de données incohérent** : Les tables `programs`, `client_created_programs` et `program_assignments` créaient de la confusion. Le nouveau modèle distingue clairement les **templates** (bibliothèque du coach) des **instances** (données du client).

**Logique d'assignation cassée** : La fonction RPC existante n'était pas correctement exploitée. Une nouvelle fonction `assign_program_atomic` garantit maintenant l'atomicité et la cohérence des données.

---

## Architecture Implémentée

Le système repose sur une **architecture hybride clarifée** avec trois couches distinctes.

### Couche 1 : Templates (Bibliothèque du Coach)

Les coachs créent des modèles réutilisables de programmes, séances et exercices. Ces templates sont stockés dans des tables dédiées et ne sont jamais modifiés par les clients.

| Table | Description | Rôle |
| :--- | :--- | :--- |
| `program_templates` | Modèles de programmes | Bibliothèque réutilisable du coach |
| `session_templates` | Modèles de séances | Structure des séances d'un programme |
| `session_exercise_templates` | Configuration des exercices | Consignes (séries, reps, charge) pour chaque exercice |

### Couche 2 : Assignations (Le Registre Central)

Lorsqu'un coach assigne un programme à un client, une entrée est créée dans `program_assignments`. C'est la **source de vérité unique** qui répond à la question : "Quel coach a assigné quel programme à quel client, et quand ?"

| Table | Description | Rôle |
| :--- | :--- | :--- |
| `program_assignments` | Registre des assignations | Lien entre template, client et coach avec suivi de progression |

### Couche 3 : Instances Client (Données "Vivantes")

Au moment de l'assignation, le template est **dupliqué** dans des tables dédiées au client. Le client travaille sur ces copies, qui peuvent être personnalisées sans impacter le template original.

| Table | Description | Rôle |
| :--- | :--- | :--- |
| `client_programs` | Programmes du client | Copie personnelle et modifiable du template |
| `client_sessions` | Séances du client | Instances de séances avec statut (pending, completed) |
| `client_session_exercises` | Exercices du client | Configuration des exercices (modifiable) |
| `performance_logs` | Logs de performance | Enregistrement des performances réelles (reps, charge, RPE) |

---

## Migrations SQL Appliquées

Trois fichiers de migration ont été créés et appliqués avec succès sur la base de données Supabase.

### Migration 1 : Création des Tables

**Fichier** : `20251119_create_program_assignment_system.sql`

Cette migration crée les 8 nouvelles tables du système avec leurs index et triggers. Les anciennes tables ont été renommées avec le suffixe `_old` pour permettre une migration progressive sans perte de données.

**Tables créées** :
- `program_templates`, `session_templates`, `session_exercise_templates`
- `program_assignments` (nouvelle version)
- `client_programs`, `client_sessions`, `client_session_exercises`
- `performance_logs`

**Anciennes tables renommées** :
- `program_assignments` → `program_assignments_old`
- `client_created_programs` → `client_created_programs_old`
- `client_created_sessions` → `client_created_sessions_old`
- `client_created_session_exercises` → `client_created_session_exercises_old`

### Migration 2 : Politiques RLS

**Fichier** : `20251119_enable_rls_policies.sql`

Cette migration active le Row Level Security sur toutes les tables et crée 48 politiques de sécurité strictes. Chaque table a des politiques pour les opérations SELECT, INSERT, UPDATE et DELETE, garantissant que les coachs ne voient que leurs données et que les clients ne voient que les leurs.

**Politiques clés** :
- Les coachs peuvent voir et gérer uniquement leurs propres templates
- Les coachs peuvent voir les assignations qu'ils ont créées
- Les clients peuvent voir uniquement leurs propres assignations et programmes
- Les clients peuvent mettre à jour leur progression (current_week, current_session_order)
- Les logs de performance sont accessibles uniquement par le client et son coach

### Migration 3 : Fonction RPC

**Fichier** : `20251119_create_assign_program_function.sql`

Cette migration crée la fonction PostgreSQL `assign_program_atomic` qui gère l'assignation de manière transactionnelle. Si une étape échoue (par exemple, la copie d'un exercice), toute l'opération est annulée (rollback).

**Fonctions créées** :
- `assign_program_atomic(p_template_id, p_client_id, p_coach_id, p_start_date)` - Assignation atomique
- `update_assignment_statuses()` - Mise à jour automatique des statuts en fonction des dates
- `get_assignment_summary(p_assignment_id)` - Résumé complet d'une assignation avec statistiques

---

## Services TypeScript Refactorisés

Trois services principaux ont été refactorisés pour utiliser le nouveau modèle de données.

### Service 1 : programAssignmentService.ts

Ce service gère les assignations de programmes. Il expose des fonctions pour assigner un programme, récupérer les assignations d'un coach ou d'un client, et mettre à jour la progression.

**Fonctions principales** :
- `assignProgramToClient(templateId, clientId, coachId, startDate)` - Assigne un programme via RPC
- `getAssignmentsForClient(clientId)` - Récupère toutes les assignations d'un client
- `getAssignmentsForCoach(coachId)` - Récupère toutes les assignations d'un coach
- `getActiveAssignmentsForClient(clientId)` - Récupère uniquement les assignations actives
- `updateAssignmentProgress(assignmentId, currentWeek, currentSessionOrder)` - Met à jour la progression
- `updateAssignmentStatus(assignmentId, status)` - Change le statut (upcoming, active, completed, paused, archived)
- `deleteAssignment(assignmentId)` - Supprime une assignation (cascade sur les données client)
- `getAssignmentSummary(assignmentId)` - Résumé complet via RPC

**Changements clés** :
- Utilise `program_template_id` au lieu de `program_id`
- Appelle la nouvelle fonction RPC `assign_program_atomic`
- Statuts mis à jour : `upcoming`, `active`, `completed`, `paused`, `archived`
- Retourne un objet `AssignProgramResult` avec `success`, `assignment_id`, `client_program_id`

### Service 2 : clientProgramService.ts

Ce service permet de récupérer les programmes assignés à un client avec tous leurs détails (séances, exercices).

**Fonctions principales** :
- `getClientAssignedPrograms(clientId)` - Récupère tous les programmes assignés (format WorkoutProgram)
- `getAssignedProgramDetails(assignmentId)` - Récupère un programme spécifique avec détails complets
- `updateClientProgress(assignmentId, currentWeek, currentSessionOrder)` - Met à jour la progression
- `markSessionAsCompleted(sessionId)` - Marque une séance comme terminée

**Changements clés** :
- Lit depuis `program_assignments` et `client_programs` au lieu de `client_created_programs`
- Filtre les assignations actives (`status IN ('active', 'upcoming')`)
- Construit la structure `WorkoutProgram` avec `sessionsByWeek`

### Service 3 : performanceLogService.ts

Ce service gère l'enregistrement des performances des clients pour chaque série d'exercice.

**Fonctions principales** :
- `createPerformanceLog(input)` - Enregistre un log pour une série
- `updatePerformanceLog(logId, updates)` - Met à jour un log existant
- `getPerformanceLogsForSession(sessionId)` - Récupère tous les logs d'une séance
- `getPerformanceHistoryForExercise(clientId, exerciseId, limit)` - Historique pour un exercice
- `deletePerformanceLog(logId)` - Supprime un log
- `bulkCreatePerformanceLogs(clientSessionExerciseId, clientId, sets)` - Enregistrement en masse

**Structure d'un log** :
```typescript
{
  client_session_exercise_id: string,
  client_id: string,
  set_number: number,
  reps_achieved: number,
  load_achieved: string,
  rpe: number, // Rating of Perceived Exertion (1-10)
  notes: string
}
```

---

## Prochaines Étapes : Interfaces Utilisateur

Les services sont prêts, mais les interfaces utilisateur doivent être adaptées pour les utiliser. Voici les pages à refactoriser par ordre de priorité.

### Priorité 1 : Pages Coach

**WorkoutLibrary.tsx** - Bibliothèque de programmes avec bouton "Assigner"

Actuellement, cette page affiche les programmes du coach. Le bouton "Assigner" doit appeler `assignProgramToClient` du nouveau service.

**Modifications nécessaires** :
- Remplacer l'appel à l'ancienne fonction RPC par `assignProgramToClient`
- Afficher une modale pour sélectionner les clients et la date de début
- Gérer le retour de la fonction (success/error) et afficher un toast
- Mettre à jour le compteur d'assignations en appelant `getAssignmentCountByTemplate`

**ClientProfile.tsx** - Vue des programmes assignés à un client

Cette page affiche le profil d'un client vu par le coach. La section "Programmes Assignés" doit lire depuis `getAssignmentsForClient`.

**Modifications nécessaires** :
- Remplacer l'appel à l'ancien service par `getAssignmentsForClient`
- Afficher la liste des assignations avec nom du programme, statut, date de début, progression
- Ajouter des actions (Archiver, Suspendre, Supprimer) via `updateAssignmentStatus` et `deleteAssignment`
- Afficher un résumé détaillé via `getAssignmentSummary` au clic sur un programme

### Priorité 2 : Pages Client

**ClientWorkout.tsx** - Vue du programme en cours

Cette page affiche l'encart "Programme en cours" sur le tableau de bord du client. Elle doit lire depuis `getActiveAssignmentsForClient`.

**Modifications nécessaires** :
- Remplacer l'appel à l'ancien service par `getActiveAssignmentsForClient`
- Afficher le nom du programme, la semaine et la séance actuelles
- Rediriger vers la page de la séance au clic sur "Commencer la séance"

**ClientProgram.tsx** - Détails du programme assigné

Cette page affiche les détails d'un programme assigné au client. Elle doit lire depuis `getAssignedProgramDetails`.

**Modifications nécessaires** :
- Remplacer l'appel à l'ancien service par `getAssignedProgramDetails`
- Afficher la structure complète du programme avec séances et exercices
- Permettre au client de naviguer entre les semaines et les séances

**Nouvelle page : PerformWorkout.tsx** - Réalisation d'une séance

Cette page n'existe pas encore. Elle doit permettre au client de remplir sa séance et d'enregistrer ses performances.

**Fonctionnalités à implémenter** :
- Afficher la liste des exercices de la séance avec consignes (séries, reps, charge)
- Permettre au client de saisir ses performances pour chaque série (reps, charge, RPE)
- Sauvegarder automatiquement les données (autosave) via `createPerformanceLog` ou `bulkCreatePerformanceLogs`
- Marquer la séance comme terminée via `markSessionAsCompleted`
- Mettre à jour la progression via `updateClientProgress`
- Afficher un message de félicitations et rediriger vers le tableau de bord

---

## Fichiers de Sauvegarde

Pour faciliter la migration progressive, les anciens fichiers de services ont été sauvegardés.

**Sauvegardes créées** :
- `programAssignmentService.ts.backup`
- `performanceLogService.ts.backup`

Si un problème survient, tu peux restaurer ces fichiers en les renommant.

---

## Tests Recommandés

Avant de déployer en production, il est essentiel de tester chaque parcours utilisateur.

### Tests Fonctionnels Coach

1. **Assignation depuis la bibliothèque** : Un coach peut-il assigner un programme à 1 client ? À 5 clients en même temps ?
2. **Visualisation des assignations** : L'assignation apparaît-elle instantanément dans le profil du client ?
3. **Suivi de progression** : Le coach peut-il voir la progression (semaine/séance) d'un client ?
4. **Sécurité RLS** : Un coach ne peut **pas** voir les programmes des clients d'un autre coach.

### Tests Fonctionnels Client

1. **Notification** : Le client reçoit-il une notification quand un programme lui est assigné ?
2. **Visualisation** : Le client voit-il son programme actif sur son tableau de bord ?
3. **Accès séance** : Le client peut-il ouvrir sa séance du jour ?
4. **Enregistrement performances** : Le client peut-il enregistrer ses performances (reps/charge) ?
5. **Validation séance** : La séance est-elle marquée comme "Terminée" après validation ?
6. **Progression** : La progression (séance suivante) est-elle correctement mise à jour ?

### Tests de Sécurité

1. **RLS actif** : Vérifier que toutes les tables ont le RLS activé
2. **Isolation des données** : Un client ne peut pas accéder aux données d'un autre client
3. **Permissions coach** : Un coach ne peut pas modifier les templates d'un autre coach

---

## Conclusion

Le système d'assignation de programmes de Virtus a été entièrement refactorisé avec succès. La base de données est maintenant sécurisée, cohérente et scalable. Les services TypeScript sont prêts à être utilisés par les interfaces utilisateur.

**Ce qui a été accompli** :
- ✅ 8 nouvelles tables créées avec index et triggers
- ✅ 48 politiques RLS appliquées (faille de sécurité corrigée)
- ✅ 3 fonctions RPC créées (assignation atomique, mise à jour statuts, résumé)
- ✅ 3 services TypeScript refactorisés (assignation, programmes clients, performances)
- ✅ Anciennes tables renommées (migration progressive sans perte de données)

**Ce qu'il reste à faire** :
- ⏳ Refactoriser les interfaces utilisateur (WorkoutLibrary, ClientProfile, ClientWorkout, ClientProgram)
- ⏳ Créer la page PerformWorkout pour l'enregistrement des performances
- ⏳ Tester le système end-to-end
- ⏳ Migrer les données existantes des anciennes tables vers les nouvelles (si nécessaire)
- ⏳ Supprimer les anciennes tables une fois la migration validée

Le système est maintenant prêt à être finalisé avec les interfaces utilisateur. Une fois cette dernière étape complétée, Virtus disposera d'un système d'assignation robuste, sécurisé et maintenable qui permettra aux coachs de gérer efficacement leurs clients et aux clients de suivre leur progression en toute autonomie.
