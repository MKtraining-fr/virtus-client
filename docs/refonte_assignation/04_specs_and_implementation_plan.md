# 4. Spécifications, API et Plan d'Implémentation

Ce document finalise le plan de refonte en traduisant l'analyse et l'architecture en un cahier des charges technique et fonctionnel, prêt à être implémenté par une équipe de développement.

## Spécification Fonctionnelle Structurée (style Marty Cagan)

### Objectifs Business & Valeur

L'objectif principal est de **livrer la fonctionnalité la plus fondamentale et la plus attendue de l'application** : permettre aux coachs d'entraîner leurs clients à distance. Sans un système d'assignation fonctionnel, l'application n'a pas de valeur fondamentale.

- **Pour le Coach** : Augmenter l'efficacité en gérant plus de clients, monétiser son expertise en créant et vendant des programmes, et améliorer la qualité du suivi.
- **Pour le Client** : Bénéficier d'un suivi structuré, visualiser sa progression, et rester engagé grâce à un parcours clair.
- **Pour le Produit** : Activer le cœur de la proposition de valeur, augmenter la rétention des utilisateurs et justifier la monétisation du service.

### User Stories

| Rôle | User Story | Bénéfice | Priorité MVP |
| :--- | :--- | :--- | :--- |
| Coach | En tant que coach, je veux **assigner un programme** de ma bibliothèque à plusieurs clients en une seule fois | afin de gagner du temps et de standardiser le suivi de mes nouveaux clients. | **Haute** |
| Coach | En tant que coach, je veux **voir la liste des programmes assignés** à un client et sa progression | afin de préparer rapidement son prochain bilan et d'ajuster son plan si nécessaire. | **Haute** |
| Coach | En tant que coach, je veux **modifier un programme assigné** à un client sans changer le modèle original | afin de personnaliser l'entraînement en fonction de ses besoins spécifiques. | Moyenne |
| Client | En tant que client, je veux **voir le programme qui m'a été assigné** et savoir quelle est ma séance du jour | afin de pouvoir m'entraîner en toute autonomie et sans confusion. | **Haute** |
| Client | En tant que client, je veux **enregistrer mes performances** (charges, reps) pour chaque exercice | afin de suivre mes progrès et de partager des données précises avec mon coach. | **Haute** |
| Client | En tant que client, je veux **voir l'historique de mes performances** sur un exercice | afin de constater ma progression et de rester motivé. | Moyenne |

### Règles de Gestion & Cas Limites

- **Assignation Multiple** : Un même programme *template* peut être assigné plusieurs fois au même client (ex: recommencer un cycle). Chaque assignation est une nouvelle entrée dans `program_assignments` et génère une nouvelle copie dans `client_programs`.
- **Modification de Template** : Si un coach modifie un `program_template`, cela **ne doit pas** impacter les programmes déjà assignés et copiés (`client_programs`). C'est le principe clé de la duplication.
- **Modification d'Instance** : Un coach doit pouvoir modifier un `client_program` (ex: changer un exercice pour un client blessé). Cette action ne modifie que cette instance.
- **Suppression de Client** : Si un client est supprimé, toutes ses données (assignations, programmes, logs) doivent être supprimées en cascade (`ON DELETE CASCADE`).
- **Séance Isolée** : L'assignation d'une séance unique (non rattachée à un programme) est un cas d'usage valide mais **hors du périmètre MVP**. Pour le MVP, une séance doit toujours appartenir à un programme.

## Design des API / Services (Niveau Pseudo-Technique)

L'interaction avec la base de données se fera principalement via des fonctions RPC (Remote Procedure Call) pour les opérations complexes et transactionnelles, et des vues/requêtes standards pour la lecture.

### Fonction RPC Principale (PostgreSQL)

**`rpc('assign_program_atomic', {p_template_id, p_client_id, p_coach_id, p_start_date})`**

- **Rôle** : Coach
- **Action** : Crée une entrée dans `program_assignments` et duplique le `program_template` et ses enfants (`session_templates`, `session_exercise_templates`) dans les tables `client_*`.
- **Transaction** : L'ensemble de l'opération doit être atomique. Si une étape échoue (ex: la copie d'un exercice), toute l'opération est annulée (rollback).
- **Retour Succès** : `{ success: true, assignment_id: '...' }`
- **Retour Erreur** : `{ success: false, error: '...' }` (ex: 'Client non trouvé', 'Template déjà assigné avec une date de début active')

### Endpoints Principaux (Supabase API)

| Endpoint | Méthode | Rôle | Description | Données Clés |
| :--- | :--- | :--- | :--- | :--- |
| `/program_assignments` | `GET` | Coach, Client | Récupérer les assignations. Le RLS garantit que chacun ne voit que ses données. | `?client_id=eq.{id}`, `?coach_id=eq.{id}` |
| `/program_assignments` | `PATCH` | Coach, Client | Mettre à jour le statut ou la progression d'une assignation. | `id=eq.{id}`, `body: { status, current_week }` |
| `/client_programs` | `GET` | Coach, Client | Récupérer les détails d'un programme client (avec ses séances et exercices). | `?assignment_id=eq.{id}` |
| `/performance_logs` | `POST` | Client | Enregistrer les performances d'un client pour un exercice d'une séance. | `body: { client_session_exercise_id, ... }` |
| `/performance_logs` | `GET` | Coach, Client | Consulter l'historique des performances pour un exercice. | `?exercise_id=eq.{id}&client_id=eq.{id}` |

## Plan d'Implémentation & Refacto (Style Clean Architecture)

**Priorité #1 : Ne pas casser l'existant.** Le plan est conçu pour être déployé par étapes, en parallèle de l'ancien système si nécessaire.

### Étape 1 : Base de Données (Le Socle)

1.  **Migration SQL - Création des nouvelles tables** : Créer les tables `program_templates`, `session_templates`, `session_exercise_templates`, `program_assignments`, `client_programs`, `client_sessions`, `client_session_exercises`, `performance_logs` comme définies dans la section 3.
2.  **Migration SQL - RLS** : Appliquer des politiques de sécurité **strictes** sur **toutes** ces nouvelles tables. C'est non négociable.
    - Un coach ne peut voir/modifier que les données liées à lui-même ou à ses clients.
    - Un client ne peut voir/modifier que ses propres données.
3.  **Création de la fonction RPC `assign_program_atomic`** : Implémenter la logique de duplication transactionnelle en PL/pgSQL.

### Étape 2 : Couche de Services (Le Cerveau)

1.  **Refactoriser `programAssignmentService.ts`** : Créer des fonctions claires qui appellent la nouvelle API.
    - `assignProgram(templateId, clientId, startDate)` : Appelle la nouvelle fonction RPC.
    - `getAssignmentsForClient(clientId)` : Appelle `GET /program_assignments?client_id=...`
    - `getAssignmentsForCoach(coachId)` : Appelle `GET /program_assignments?coach_id=...`
2.  **Créer `performanceLogService.ts`** : Service pour gérer la création et la lecture des logs de performance.

### Étape 3 : Couche de Présentation (L'Interface) - MVP

1.  **Refactoriser `WorkoutLibrary.tsx`** :
    - Le bouton "Assigner" doit appeler la nouvelle fonction `assignProgram`.
    - L'affichage du nombre d'assignations doit se baser sur une requête simple (`count`) sur la table `program_assignments`.
2.  **Refactoriser `ClientProfile.tsx` (Vue Coach)** :
    - La section "Programmes Assignés" doit maintenant lire ses données depuis `getAssignmentsForClient`.
    - L'affichage doit être simplifié pour ne montrer que les informations de la table `program_assignments`.
3.  **Refactoriser `ClientWorkout.tsx` (Vue Client)** :
    - La logique de récupération du programme en cours doit être basée sur `getAssignmentsForClient` avec un filtre `status=eq.active`.
4.  **Créer la page `PerformWorkout.tsx`** :
    - Page où le client remplit sa séance. Elle lit les `client_session_exercises` et écrit dans `performance_logs` via le nouveau service.

### Étape 4 : Nettoyage

Une fois que le nouveau système est validé en production, les anciennes tables (`programs`, `sessions` si elles ne servent plus de templates) et l'ancien code pourront être progressivement dépréciés et supprimés.

## Check-list QA & Suivi Produit

### Tests Fonctionnels (Check-list QA)

- **Parcours Coach** :
    - [ ] Un coach peut-il assigner un programme à 1 client ?
    - [ ] Un coach peut-il assigner un programme à 5 clients en même temps ?
    - [ ] L'assignation apparaît-elle instantanément dans le profil du client ?
    - [ ] Un coach peut-il voir la progression (semaine/séance) d'un client ?
    - [ ] Un coach ne peut **pas** voir les programmes des clients d'un autre coach.
- **Parcours Client** :
    - [ ] Un client reçoit-il une notification quand un programme lui est assigné ?
    - [ ] Le client voit-il son programme actif sur son tableau de bord ?
    - [ ] Le client peut-il ouvrir sa séance du jour ?
    - [ ] Le client peut-il enregistrer ses performances (reps/charge) ?
    - [ ] La séance est-elle marquée comme "Terminée" après validation ?
    - [ ] La progression (séance suivante) est-elle correctement mise à jour ?

### Indicateurs de Suivi (Analytics)

- **Taux d'adoption** : Nombre de programmes assignés par coach par semaine.
- **Engagement Client** : Pourcentage de séances complétées par rapport aux séances assignées.
- **Qualité** : Nombre de rapports d'erreur liés à l'assignation ou à la réalisation de séances (doit tendre vers 0).
- **Rétention** : Corrélation entre le nombre de programmes complétés et la rétention des clients à 3 mois plus tard.
