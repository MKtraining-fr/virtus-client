# Analyse et Plan d'Action - Flux Assignation Programme → Séances Terminées

**Date** : 2 décembre 2025  
**Objectif** : Faire fonctionner parfaitement le flux d'assignation de programmes et le suivi des séances d'entraînement

---

## 1. Compréhension du Problème

### 1.1 Flux à Implémenter

Le système doit gérer trois flux critiques :

#### **Flux 1 : Assignation programme → visibilité élève**
- Quand un coach assigne un programme à un élève depuis la bibliothèque
- L'élève doit retrouver ce programme dans son interface (liste de programmes / séances à faire)
- Cette liste doit être basée sur les données Supabase, pas sur un simple état temporaire en front

#### **Flux 2 : Séance réalisée → compteur d'entraînements +1**
- Quand l'élève lance une séance depuis ce programme
- Il saisit toutes ses infos (charges, reps, RPE, temps, commentaires, etc.)
- Il marque la séance comme terminée
- Le système crée/utilise une table de log de séances (performance_logs / client_exercise_performance)
- À la fin de la séance, une ligne persistante est enregistrée en base avec :
  - l'utilisateur
  - la date/heure
  - le programme / la séance
  - les données détaillées par exercice / série
  - les éventuelles notes globales
- Sur la page "Entraînement" de l'élève, le compteur d'entraînements doit être automatiquement incrémenté de +1 en s'appuyant sur Supabase (compte le nombre de séances effectuées) et non sur un simple compteur local

#### **Flux 3 : Visibilité côté coach**
- Toutes les informations saisies par le client pour une séance doivent être :
  - persistantes en base
  - lisibles par le coach sur son interface
  - correctement filtrées par droits (un coach ne voit que les données de ses clients)
- Les RLS Supabase doivent garantir que :
  - le client voit ses propres données uniquement
  - les coachs voient les données des clients qui leur sont rattachés
  - l'admin garde un accès global si la logique du projet le prévoit

---

## 2. Exploration du Code & de la Base

### 2.1 Schéma de Données Supabase

D'après la migration `20251119_create_program_assignment_system.sql`, le schéma est organisé comme suit :

#### **Tables des Modèles (Templates) - Bibliothèque du Coach**

1. **`program_templates`** : Modèles de programmes créés par les coachs (bibliothèque réutilisable)
   - `id`, `coach_id`, `name`, `objective`, `week_count`, `is_public`, `created_at`, `updated_at`

2. **`session_templates`** : Modèles de séances appartenant aux programmes templates
   - `id`, `program_template_id`, `coach_id`, `name`, `week_number`, `session_order`, `created_at`, `updated_at`

3. **`session_exercise_templates`** : Configuration des exercices dans les séances templates
   - `id`, `session_template_id`, `exercise_id`, `coach_id`, `exercise_order`, `sets`, `reps`, `load`, `tempo`, `rest_time`, `intensification`, `notes`, `created_at`, `updated_at`

#### **Table d'Assignation - Le Registre Central (Source de Vérité)**

4. **`program_assignments`** : Registre central des assignations (source de vérité unique)
   - `id`, `program_template_id`, `client_id`, `coach_id`, `start_date`, `end_date`, `status` (upcoming/active/completed/paused/archived), `current_week`, `current_session_order`, `created_at`, `updated_at`
   - Contrainte d'unicité : un client peut avoir plusieurs assignations du même template, mais pas à la même date

#### **Tables des Instances Client - Données "Vivantes"**

5. **`client_programs`** : Instances de programmes dupliquées pour chaque client
   - `id`, `assignment_id`, `client_id`, `coach_id`, `name`, `objective`, `week_count`, `created_at`, `updated_at`

6. **`client_sessions`** : Instances de séances appartenant aux programmes clients
   - `id`, `client_program_id`, `client_id`, `name`, `week_number`, `session_order`, `status` (pending/completed/skipped), `completed_at`, `created_at`, `updated_at`

7. **`client_session_exercises`** : Exercices dans les séances clients (modifiables)
   - `id`, `client_session_id`, `exercise_id`, `client_id`, `exercise_order`, `sets`, `reps`, `load`, `tempo`, `rest_time`, `intensification`, `notes`, `created_at`, `updated_at`

#### **Table de Suivi des Performances**

8. **`performance_logs`** (ou `client_exercise_performance` selon les fichiers) : Logs des performances réelles enregistrées par les clients
   - `id`, `client_session_exercise_id`, `client_id`, `set_number`, `reps_achieved`, `load_achieved`, `rpe`, `notes`, `performed_at`
   - Contrainte d'unicité : un seul log par série d'exercice

### 2.2 Services Existants

#### **Services d'Assignation**
- **`programAssignmentService.ts`** : Gestion des assignations de programmes
  - `assignProgramToClient()` : Utilise la fonction RPC `assign_program_atomic` pour garantir l'atomicité
  - `getAssignmentsForClient()` : Récupère toutes les assignations d'un client
  - `getActiveAssignmentsForClient()` : Récupère les assignations actives
  - `updateAssignmentProgress()` : Met à jour la progression (current_week, current_session_order)
  - `updateAssignmentStatus()` : Met à jour le statut de l'assignation

#### **Services de Programmes Clients**
- **`clientProgramService.ts`** : Gestion des programmes clients (instances)
  - `getClientAssignedPrograms()` : Récupère tous les programmes assignés à un client avec leurs détails complets
  - Active automatiquement les programmes 'upcoming' dont la date de début est passée

#### **Services de Performance**
- **`performanceLogService.ts`** : Gestion des logs de performance
  - `bulkCreatePerformanceLogs()` : Enregistre les performances pour plusieurs séries d'un exercice
  - `getPerformanceLogs()` : Récupère les performances d'un client pour un exercice donné
  - `savePerformanceLog()` : Fonction de compatibilité (deprecated) pour migration progressive

#### **Services de Séances Clients**
- **`clientSessionService.ts`** : Gestion des séances clients
  - `getClientSessionExerciseId()` : Récupère l'ID d'un exercice dans client_session_exercises
  - `updateSessionStatus()` : Met à jour le statut d'une séance (pending/completed/skipped)

### 2.3 Composants Front-End

#### **Pages Client**
- **`ClientCurrentProgram.tsx`** : Affiche le programme en cours du client
  - Récupère le programme depuis `user?.assignedProgram`
  - Gère l'exécution des séances avec timer, logs de performance
  - Utilise `savePerformanceLog()` pour enregistrer les données de séance

#### **Stores**
- **`useAuthStore.ts`** : Gestion de l'authentification et de l'utilisateur
- **`useDataStore.ts`** : Gestion des données (clients, programmes, exercices, etc.)
  - `loadData()` : Charge toutes les données de l'utilisateur

### 2.4 État Actuel du Système

D'après les documents de documentation :

✅ **Déjà implémenté** :
- Schéma de base de données complet avec tables templates, assignations, et instances clients
- Services d'assignation de programmes (`programAssignmentService`)
- Services de récupération des programmes clients (`clientProgramService`)
- Services de logs de performance (`performanceLogService`)
- Fonction RPC `assign_program_atomic` pour assignation atomique
- RLS (Row Level Security) configurées pour les droits d'accès

❌ **Problèmes identifiés** :
1. **Flux d'assignation incomplet** : Le lien entre l'assignation côté coach et la visibilité côté client n'est pas clair
2. **Compteur d'entraînements** : Le compteur semble être basé sur un état local plutôt que sur le nombre de séances complétées en base
3. **Visibilité coach** : Pas d'interface claire pour que le coach voie les séances effectuées par ses clients avec les détails
4. **Intégration des services** : Les services existent mais ne sont pas tous branchés correctement dans les composants

---

## 3. Plan d'Action Détaillé

### Étape 1 : Vérifier / Corriger le Schéma Supabase

**Objectif** : S'assurer que toutes les tables, foreign keys, et RLS sont en place

**Actions** :
1. Vérifier que toutes les migrations ont été appliquées
2. Vérifier les RLS pour chaque table :
   - `program_templates` : Coach voit ses propres templates + templates publics
   - `program_assignments` : Client voit ses assignations, Coach voit les assignations de ses clients
   - `client_programs` : Client voit ses programmes, Coach voit les programmes de ses clients
   - `client_sessions` : Client voit ses séances, Coach voit les séances de ses clients
   - `client_session_exercises` : Client voit ses exercices, Coach voit les exercices de ses clients
   - `performance_logs` / `client_exercise_performance` : Client voit ses logs, Coach voit les logs de ses clients
3. Créer/vérifier les index pour optimiser les requêtes
4. Vérifier que la fonction RPC `assign_program_atomic` existe et fonctionne

**Fichiers à vérifier** :
- `supabase/migrations/20251119_create_program_assignment_system.sql`
- `supabase/migrations/20251119_enable_rls_policies.sql`
- `supabase/migrations/20251119_create_assign_program_function.sql`

### Étape 2 : Brancher la Liste des Programmes Côté Élève

**Objectif** : L'élève doit voir la liste de ses programmes assignés depuis Supabase

**Actions** :
1. Dans `ClientCurrentProgram.tsx` ou un composant dédié, utiliser `getClientAssignedPrograms(clientId)` pour charger les programmes
2. Afficher la liste des programmes avec leur statut (upcoming/active/completed)
3. Permettre au client de sélectionner un programme actif pour voir ses séances
4. Stocker le programme sélectionné dans l'état local ou dans le store

**Fichiers à modifier** :
- `src/pages/client/workout/ClientCurrentProgram.tsx`
- `src/pages/client/workout/ClientMyPrograms.tsx`
- `src/stores/useDataStore.ts` (ajouter une fonction pour charger les programmes assignés)

### Étape 3 : Implémenter / Corriger le Modèle de "Séance Terminée"

**Objectif** : Quand le client termine une séance, enregistrer toutes les données en base

**Actions** :
1. Dans `ClientCurrentProgram.tsx`, à la fin de la séance :
   - Récupérer toutes les données de performance (exercices, séries, reps, charges, RPE, commentaires)
   - Appeler `savePerformanceLog()` ou `bulkCreatePerformanceLogs()` pour chaque exercice
   - Mettre à jour le statut de la séance dans `client_sessions` (status = 'completed', completed_at = now())
   - Mettre à jour la progression dans `program_assignments` (current_week, current_session_order)
2. Gérer les erreurs et afficher un message de confirmation
3. Rediriger vers la page de récapitulatif ou la liste des programmes

**Fichiers à modifier** :
- `src/pages/client/workout/ClientCurrentProgram.tsx`
- `src/services/performanceLogService.ts` (vérifier que les fonctions sont correctes)
- `src/services/clientSessionService.ts` (ajouter/vérifier `updateSessionStatus()`)
- `src/services/programAssignmentService.ts` (vérifier `updateAssignmentProgress()`)

### Étape 4 : Calculer le Compteur d'Entraînements Depuis la Base

**Objectif** : Le compteur d'entraînements doit refléter le nombre de séances complétées en base

**Actions** :
1. Créer une fonction dans `clientSessionService.ts` : `getCompletedSessionsCount(clientId)`
   - Requête SQL : `SELECT COUNT(*) FROM client_sessions WHERE client_id = ? AND status = 'completed'`
2. Appeler cette fonction dans le composant qui affiche le compteur (Dashboard client)
3. Mettre à jour le compteur après chaque séance terminée
4. Optionnel : Créer une vue matérialisée ou un trigger pour calculer automatiquement le compteur

**Fichiers à modifier** :
- `src/services/clientSessionService.ts` (ajouter `getCompletedSessionsCount()`)
- `src/pages/client/ClientDashboard.tsx` (afficher le compteur depuis la base)
- `src/stores/useDataStore.ts` (ajouter le compteur dans l'état global)

### Étape 5 : Exposer les Données Côté Coach

**Objectif** : Le coach doit voir les séances effectuées par ses clients avec tous les détails

**Actions** :
1. Créer un service `coachClientProgramService.ts` (ou utiliser l'existant) :
   - `getClientCompletedSessions(coachId, clientId)` : Récupère les séances complétées d'un client
   - `getSessionPerformanceDetails(sessionId)` : Récupère les détails de performance d'une séance
2. Créer une page ou un composant pour afficher :
   - La liste des clients du coach
   - Pour chaque client : la liste des programmes assignés
   - Pour chaque programme : la liste des séances avec leur statut
   - Pour chaque séance complétée : les détails de performance (exercices, séries, reps, charges, RPE, commentaires)
3. Ajouter des filtres (par client, par programme, par date)
4. Ajouter des graphiques de progression (optionnel)

**Fichiers à créer/modifier** :
- `src/services/coachClientProgramService.ts` (vérifier/compléter)
- `src/pages/coach/ClientProgressView.tsx` (nouvelle page)
- `src/pages/Clients.tsx` (ajouter un lien vers la vue de progression)

### Étape 6 : Vérifier / Corriger les RLS Supabase

**Objectif** : Garantir que les droits d'accès sont corrects

**Actions** :
1. Tester les requêtes avec différents rôles (client, coach, admin)
2. Vérifier que :
   - Un client ne peut voir que ses propres données
   - Un coach ne peut voir que les données de ses clients (via `coach_id` dans les tables)
   - Un admin peut voir toutes les données
3. Corriger les policies RLS si nécessaire

**Fichiers à vérifier** :
- `supabase/migrations/20251119_enable_rls_policies.sql`
- Créer un fichier de test SQL pour vérifier les policies

### Étape 7 : Mettre à Jour / Ajouter des Tests

**Objectif** : Garantir que la fonctionnalité fonctionne sans bug

**Actions** :
1. **Tests automatisés** :
   - Test d'assignation de programme (coach → client)
   - Test de récupération des programmes assignés (client)
   - Test d'enregistrement de séance terminée
   - Test de calcul du compteur d'entraînements
   - Test de visibilité des données (coach)
   - Test des RLS (droits d'accès)

2. **Tests manuels** (checklist) :
   - ☐ En tant que coach, j'assigne le programme X au client Y
   - ☐ En tant que client Y, je vois le programme X dans ma liste
   - ☐ J'ouvre une séance, je renseigne des données, je termine la séance
   - ☐ Je reviens sur la page "Entraînement" : le compteur est passé de N à N+1
   - ☐ En tant que coach, je vois la séance effectuée par Y avec toutes ses données
   - ☐ Je rafraîchis la page : toutes les données sont toujours là

**Fichiers à créer/modifier** :
- `src/test/programAssignment.test.ts` (nouveau fichier)
- `src/test/clientSession.test.ts` (nouveau fichier)
- `GUIDE_TEST_FLUX_COMPLET.md` (nouveau document)

---

## 4. Résultat Attendu Concret

### Ce que voit l'élève étape par étape

1. **Connexion** : L'élève se connecte à son compte
2. **Page "Mes Programmes"** : Il voit la liste de ses programmes assignés par son coach
   - Programme X (Actif) - Semaine 2/4
   - Programme Y (Terminé)
3. **Sélection d'un programme** : Il clique sur "Programme X"
4. **Page "Programme X"** : Il voit les séances de la semaine en cours
   - Séance 1 : Pectoraux / Triceps (Complétée ✅)
   - Séance 2 : Dos / Biceps (En cours ⏳)
   - Séance 3 : Jambes (À faire)
5. **Lancement d'une séance** : Il clique sur "Séance 2 : Dos / Biceps"
6. **Exécution de la séance** : Il voit la liste des exercices
   - Exercice 1 : Tractions (4 séries)
   - Exercice 2 : Rowing barre (4 séries)
   - ...
7. **Saisie des données** : Pour chaque série, il saisit :
   - Nombre de répétitions effectuées
   - Charge utilisée
   - RPE (échelle de difficulté 1-10)
   - Commentaire (optionnel)
8. **Fin de la séance** : Il clique sur "Terminer la séance"
9. **Confirmation** : Un message s'affiche : "Séance terminée ! Bravo 💪"
10. **Retour au Dashboard** : Il revient sur la page "Entraînement"
11. **Compteur mis à jour** : Le compteur affiche "15 entraînements" (au lieu de 14)
12. **Rafraîchissement** : Il rafraîchit la page (F5)
13. **Données persistées** : Le compteur affiche toujours "15 entraînements"

### Ce que voit le coach

1. **Connexion** : Le coach se connecte à son compte
2. **Page "Clients"** : Il voit la liste de ses clients
   - Client Y (15 entraînements)
3. **Sélection d'un client** : Il clique sur "Client Y"
4. **Page "Client Y"** : Il voit les informations du client
   - Onglet "Programmes" : Liste des programmes assignés
   - Onglet "Progression" : Graphiques et statistiques
   - Onglet "Séances" : Liste des séances effectuées
5. **Onglet "Séances"** : Il voit la liste des séances avec les détails
   - Séance du 01/12/2025 : Dos / Biceps (Complétée ✅)
     - Tractions : 4x10 @ 20kg, RPE 8
     - Rowing barre : 4x12 @ 60kg, RPE 7
     - Commentaire : "Bonne séance, j'ai senti mes dorsaux travailler"
6. **Filtres** : Il peut filtrer par programme, par date, par exercice
7. **Export** : Il peut exporter les données en CSV ou PDF

### Comment le compteur d'entraînements évolue

- **Avant la séance** : Compteur = 14 (basé sur `SELECT COUNT(*) FROM client_sessions WHERE client_id = ? AND status = 'completed'`)
- **Pendant la séance** : Compteur = 14 (pas de changement)
- **Après la séance** : Compteur = 15 (la séance est marquée comme 'completed' en base)
- **Après rafraîchissement** : Compteur = 15 (les données sont persistées)

### Comment je sais que les données sont bien persistées et sûres

1. **Test de rafraîchissement** : Après avoir terminé une séance, rafraîchir la page → les données sont toujours là
2. **Test de déconnexion/reconnexion** : Se déconnecter, se reconnecter → les données sont toujours là
3. **Test de changement de navigateur** : Ouvrir un autre navigateur, se connecter → les données sont toujours là
4. **Test de visibilité coach** : Le coach peut voir les données du client
5. **Test de RLS** : Un autre client ne peut pas voir les données du client Y
6. **Test de RLS coach** : Un autre coach ne peut pas voir les données du client Y
7. **Vérification en base** : Ouvrir Supabase, aller dans "Table Editor" → les données sont présentes dans les tables

---

## 5. Rappels Importants

### Architecture Database-Driven Design

- **Toujours partir du schéma de données** : Comprendre les tables, les relations, les contraintes avant de coder
- **Respecter les foreign keys** : Ne jamais créer de données orphelines
- **Utiliser les RLS** : Ne jamais contourner les politiques de sécurité
- **Utiliser les triggers** : Pour automatiser les mises à jour (updated_at, etc.)
- **Utiliser les fonctions RPC** : Pour les opérations complexes qui nécessitent plusieurs requêtes atomiques

### Bonnes Pratiques Front-End

- **Gestion des états** : Utiliser les stores pour les données globales, l'état local pour les données temporaires
- **Gestion des erreurs** : Toujours gérer les erreurs de requêtes Supabase et afficher des messages clairs
- **Loading states** : Afficher des indicateurs de chargement pendant les requêtes
- **Optimistic updates** : Mettre à jour l'UI immédiatement, puis confirmer avec la base
- **Cache** : Utiliser React Query ou un système de cache pour éviter les requêtes inutiles

### Tests

- **Privilégier les tests de comportement** : Tester ce que l'utilisateur voit et fait, pas les détails d'implémentation
- **Tests E2E** : Tester le flux complet (assignation → séance → compteur → visibilité coach)
- **Tests d'intégration** : Tester les services avec la vraie base de données (ou une base de test)
- **Tests unitaires** : Uniquement pour la logique métier complexe

---

## 6. Prochaines Étapes Immédiates

1. ✅ Analyser le code existant (FAIT)
2. ⏳ Vérifier le schéma Supabase et les migrations
3. ⏳ Vérifier les RLS
4. ⏳ Brancher la liste des programmes côté client
5. ⏳ Implémenter l'enregistrement de séance terminée
6. ⏳ Calculer le compteur d'entraînements depuis la base
7. ⏳ Créer l'interface coach pour voir les séances
8. ⏳ Tester le flux complet

---

**Auteur** : Manus AI  
**Date** : 2 décembre 2025  
**Version** : 1.0
