# Diagnostic et Plan de Refonte Complet : Système d'Assignation de Programmes

**Application** : Virtus - SaaS de Coaching Sportif  
**Date** : 19 novembre 2025  
**Auteur** : Manus AI  
**Version** : 1.0

---

## Table des Matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Diagnostic Initial](#2-diagnostic-initial)
3. [Cartographie du Domaine Fonctionnel (DDD)](#3-cartographie-du-domaine-fonctionnel-ddd)
4. [User Flows Critiques (UX)](#4-user-flows-critiques-ux)
5. [Proposition de Modèle de Données et Architecture](#5-proposition-de-modèle-de-données-et-architecture)
6. [Spécifications Fonctionnelles](#6-spécifications-fonctionnelles)
7. [Design des API et Services](#7-design-des-api-et-services)
8. [Plan d'Implémentation et Refacto](#8-plan-dimplémentation-et-refacto)
9. [Check-list QA et Suivi Produit](#9-check-list-qa-et-suivi-produit)
10. [Conclusion et Prochaines Étapes](#10-conclusion-et-prochaines-étapes)

---

## 1. Résumé Exécutif

### Reformulation de la Situation et de l'Objectif

Tu as développé **Virtus**, une application SaaS de coaching sportif qui permet à des coachs de gérer leurs clients, de créer des programmes d'entraînement et de suivre leurs performances. Le cœur de la proposition de valeur de ton produit repose sur la capacité d'un coach à **assigner un programme ou une séance à un ou plusieurs clients**, et sur la capacité du client à **accéder à ce programme et à remplir ses séances**.

Actuellement, cette fonctionnalité centrale **ne fonctionne pas** : les assignations ne sont ni correctement créées, ni visibles, ni utilisables dans les interfaces coach et client. Ce blocage rend l'application inutilisable pour son cas d'usage principal.

L'objectif de ce diagnostic est de **comprendre pourquoi le système actuel échoue**, de **proposer une refonte complète** basée sur les meilleures pratiques (Marty Cagan pour le produit, Alan Cooper pour l'UX, Eric Evans pour le DDD, Robert C. Martin pour l'architecture), et de fournir un **plan d'action concret et actionnable** pour ton équipe technique.

### Diagnostic en 5 Points

1.  **Modèle de Données Complexe et Incohérent** : Le schéma actuel mélange des concepts de "templates" et d'"instances" sans les distinguer clairement. Les noms de tables (`programs`, `client_created_programs`, `program_assignments`) créent de la confusion. Les relations entre ces tables ne sont pas correctement exploitées par le code.

2.  **Faille de Sécurité Critique (RLS)** : La table `program_assignments`, qui est le registre central de toutes les assignations, **n'a aucune politique de sécurité au niveau des lignes (Row Level Security)**. Cela signifie que n'importe quel utilisateur authentifié pourrait potentiellement lire toutes les assignations de la plateforme. C'est une violation grave de la confidentialité.

3.  **Logique d'Assignation Déconnectée** : Une fonction PostgreSQL `assign_program_to_client_atomic` a été créée pour gérer la duplication des programmes, mais elle n'est pas correctement appelée ou son résultat n'est pas exploité par l'interface. Les services TypeScript (`programAssignmentService.ts`, `clientProgramService.ts`) existent mais ne sont pas synchronisés avec la réalité de la base de données.

4.  **Interfaces Utilisateur Non Fonctionnelles** : Les composants React (`WorkoutLibrary`, `ClientProfile`, `ClientWorkout`) tentent de lire et d'afficher des données qui ne sont pas présentes ou qui ne sont pas accessibles à cause des problèmes de RLS et de logique métier. Le résultat est que ni le coach ni le client ne voient les programmes assignés.

5.  **Absence de Source de Vérité Unique** : Il n'est pas clair, dans le code actuel, quelle table est la "source de vérité" pour répondre à la question : "Quels programmes sont actuellement assignés au client X ?". Cette ambiguïté se propage dans toute l'application.

### Objectif Cible

Passer d'un système **non fonctionnel** à un système **robuste, sécurisé et maintenable** qui permet :

- **Au Coach** : D'assigner un programme à un ou plusieurs clients en quelques clics depuis sa bibliothèque ou depuis le créateur de programme, et de voir la progression de chaque client dans son profil.
- **Au Client** : De voir instantanément le programme qui lui a été assigné, d'accéder à sa séance du jour, de la remplir et d'enregistrer ses performances de manière simple et intuitive.
- **Au Produit** : De garantir la sécurité des données (RLS), la cohérence du modèle de données et la scalabilité de l'architecture pour supporter la croissance du nombre de coachs et de clients.

---

## 2. Diagnostic Initial

### Architecture Actuelle : Un Système Hybride Incomplet

L'application Virtus utilise une **stack technique moderne** :

- **Frontend** : React 19.1.0 avec TypeScript, React Router pour la navigation, Zustand pour la gestion d'état.
- **Backend** : Supabase (PostgreSQL avec API REST auto-générée, authentification, et Row Level Security).
- **Déploiement** : Netlify.

Le modèle de données actuel est basé sur une **architecture hybride de duplication** :

1.  Un coach crée un **programme modèle** (stocké dans les tables `programs`, `sessions`, `session_exercises`).
2.  Lorsqu'il assigne ce programme à un client, une **fonction PostgreSQL** (`assign_program_to_client_atomic`) est censée **dupliquer** ce modèle dans des tables dédiées au client (`client_created_programs`, `client_created_sessions`, `client_created_session_exercises`).
3.  Une table `program_assignments` sert de **registre** pour lier le client, le coach, le modèle original et l'instance dupliquée.

**Ce modèle est conceptuellement correct** pour le domaine du coaching, car il permet :

- Au coach de réutiliser ses programmes (bibliothèque de templates).
- Au client d'avoir une copie personnelle et modifiable de son programme.
- De suivre la progression de chaque client indépendamment.

**Le problème n'est pas le concept, mais son implémentation.**

### Problèmes Identifiés

| Problème | Description | Impact | Criticité |
| :--- | :--- | :--- | :--- |
| **RLS Non Configuré** | La table `program_assignments` n'a **aucune politique de sécurité** activée (`rowsecurity = false`). | **Faille de sécurité critique**. Toutes les assignations sont potentiellement lisibles par tous les utilisateurs. | **Critique** |
| **Nommage Ambigu** | Les tables `programs` et `client_created_programs` coexistent sans distinction claire dans le code. Le terme "program" est utilisé partout, créant de la confusion. | Les développeurs (et toi-même) ne savent pas quelle table interroger dans quel contexte. Les requêtes sont souvent incorrectes. | **Élevée** |
| **Fonction RPC Non Exploitée** | La fonction `assign_program_to_client_atomic` existe et semble fonctionnelle, mais son appel depuis le frontend (`WorkoutLibrary.tsx`) ne gère pas correctement les erreurs ou les cas limites. | Les assignations échouent silencieusement ou ne sont pas créées. | **Élevée** |
| **Services Désynchronisés** | Les services TypeScript (`getClientAssignedPrograms`, `getClientAssignedProgramsForCoach`) tentent de faire des jointures complexes entre `program_assignments` et `client_created_programs`, mais ces données ne sont pas toujours cohérentes. | Les interfaces affichent des listes vides ou des erreurs. | **Élevée** |
| **État Global Mal Peuplé** | Le store Zustand (`useAuthStore`) est censé charger les `assignedPrograms` d'un client au moment de la connexion, mais cette logique échoue à cause des problèmes de RLS et de requêtes. | Le client ne voit jamais ses programmes. | **Élevée** |

### Conclusion du Diagnostic

Le système actuel est un **prototype non finalisé**. Les fondations (tables SQL, fonction RPC) ont été posées, mais les connexions entre la base de données, la logique métier et l'interface utilisateur sont **cassées ou manquantes**. La correction de ces problèmes nécessite une approche méthodique et structurée, qui commence par une clarification du domaine métier.

---

## 3. Cartographie du Domaine Fonctionnel (DDD)

Pour restructurer le système sur des bases saines, il est essentiel de définir un **langage ubiquitaire** (Ubiquitous Language) partagé par toute l'équipe. Voici la cartographie du **Bounded Context : "Gestion des Programmes Clients"**.

### Entités Métier Clés

- **Coach** : Utilisateur qui crée et assigne les programmes. Identifié par `profiles.id` avec `role = 'coach'`.
- **Client** : Utilisateur qui reçoit et exécute les programmes. Identifié par `profiles.id` avec `role = 'client'`.
- **ProgrammeTemplate** : Le **modèle réutilisable** d'un programme créé par un coach. Contient la structure (nombre de semaines, objectif) mais n'est pas lié à un client. C'est un actif de la bibliothèque du coach.
- **SéanceTemplate** : Le **modèle** d'une séance au sein d'un `ProgrammeTemplate`. Définit le nom, la semaine et l'ordre de la séance.
- **ExerciceTemplate** : La configuration d'un exercice au sein d'une `SéanceTemplate` (séries, reps, charge, etc.).
- **Exercice** : Une entrée de la bibliothèque générale d'exercices (ex: "Développé couché", "Squat"). Réutilisable par tous les coachs.
- **AssignationProgramme** : L'**acte** de lier un `ProgrammeTemplate` à un `Client` à une date donnée. C'est l'enregistrement central qui matérialise la décision du coach. C'est la **source de vérité unique** pour savoir "qui a assigné quoi à qui".
- **ProgrammeClient** : L'**instance dupliquée et personnalisée** du `ProgrammeTemplate`, appartenant au client. C'est sur cet objet que le client travaille et que sa progression est suivie.
- **SéanceClient** : L'instance d'une séance au sein d'un `ProgrammeClient`.
- **ExerciceClient** : L'instance d'un exercice au sein d'une `SéanceClient`.
- **LogPerformance** : L'enregistrement des données d'une série d'exercice réalisée par le client (répétitions effectuées, charge soulevée, RPE, etc.).
- **Statut** : L'état d'une `AssignationProgramme` ou d'une `SéanceClient`. Valeurs possibles : `upcoming` (à venir), `active` (en cours), `completed` (terminé), `paused` (en pause), `archived` (archivé).

### Relations et Flux de Données

1.  Un **Coach** crée des **ProgrammeTemplates** dans sa bibliothèque.
2.  Un **ProgrammeTemplate** est composé de plusieurs **SéanceTemplates**.
3.  Une **SéanceTemplate** est composée de plusieurs **ExerciceTemplates**, chacun référençant un **Exercice** de la bibliothèque générale.
4.  Le **Coach** crée une **AssignationProgramme** pour lier un **ProgrammeTemplate** à un **Client** à une date de début donnée.
5.  Cette action déclenche automatiquement la création d'un **ProgrammeClient** (copie complète du template) et de toutes ses **SéanceClients** et **ExerciceClients**.
6.  Le **Client** interagit uniquement avec son **ProgrammeClient** et ses **SéanceClients**. Il ne voit jamais les templates.
7.  Lorsqu'un client complète une séance, il crée des **LogsPerformance** pour chaque série d'exercice.
8.  Le **Statut** de l'assignation et des séances est mis à jour en fonction de la progression du client et des dates.

### Règles Métier Fondamentales

- **Duplication Immuable** : Une fois qu'un `ProgrammeTemplate` est assigné et dupliqué en `ProgrammeClient`, toute modification ultérieure du template **ne doit pas** impacter le programme du client. Ce sont deux entités indépendantes.
- **Personnalisation** : Un coach doit pouvoir modifier un `ProgrammeClient` (ex: remplacer un exercice pour un client blessé) sans impacter le template ou les programmes des autres clients.
- **Unicité de l'Assignation** : Une `AssignationProgramme` est unique par combinaison `(program_template_id, client_id, start_date)`. Un client peut avoir plusieurs assignations du même template, mais à des dates différentes (ex: recommencer un cycle).

---

## 4. User Flows Critiques (UX)

En s'inspirant de l'approche centrée utilisateur d'**Alan Cooper**, voici la description détaillée des parcours utilisateurs pour la fonctionnalité d'assignation. Chaque flow est décomposé en étapes, avec une attention particulière portée aux états, aux erreurs et aux feedbacks.

### Flow 1 – Coach : Assignation via le Créateur de Programme

**Objectif utilisateur :** "Je viens de finir de travailler un programme, je veux l'envoyer immédiatement à un ou plusieurs de mes clients."

| Étape | Action de l'Utilisateur (Coach) | Réponse du Système (UI) | États & Erreurs | Micro-feedback |
| :--- | :--- | :--- | :--- | :--- |
| 1. **Contexte** | Le coach est sur la page du `WorkoutBuilder`. Le programme est affiché. | Le bouton "Assigner" est visible en haut de la page. | **Avant** : Le programme n'est assigné à personne. | - |
| 2. **Déclenchement** | Le coach clique sur **"Assigner"**. | Une modale s'ouvre par-dessus l'interface. | - | L'arrière-plan se floute. |
| 3. **Sélection** | Le coach voit la liste de ses clients actifs. Il peut rechercher et sélectionner un ou plusieurs clients via des cases à cocher. | La modale affiche une barre de recherche et la liste des clients. | **Erreur** : Si le coach n'a aucun client actif, un message l'informe. | La liste se filtre en temps réel. |
| 4. **Paramétrage** | Le coach définit la **date de début** (par défaut à aujourd'hui). | Un sélecteur de date est affiché. | - | - |
| 5. **Confirmation** | Le coach clique sur **"Confirmer l'assignation"**. | Le bouton affiche un spinner. La modale est non-interactive. | **Après** : Appel de `assignProgramToClient` pour chaque client. | Le bouton passe à "Assignation en cours...". |
| 6. **Résultat** | L'opération se termine. | La modale se ferme. Un toast de confirmation apparaît. | **Succès** : Assignation créée. **Erreur** : Message d'erreur affiché. | **Toast Succès** : "Programme assigné à X client(s)." (vert). **Toast Erreur** : "Échec pour Y client(s)." (rouge). |

### Flow 2 – Coach : Assignation depuis la Bibliothèque

**Objectif utilisateur :** "Je veux réutiliser un de mes programmes existants et l'assigner rapidement."

| Étape | Action | Réponse | États & Erreurs | Feedback |
| :--- | :--- | :--- | :--- | :--- |
| 1. **Contexte** | Le coach est sur `WorkoutLibrary`. Ses programmes s'affichent. | Chaque carte a un bouton "Assigner". | **Avant** : Visualisation de la bibliothèque. | - |
| 2. **Déclenchement** | Le coach clique sur **"Assigner"** sur une carte. | Modale identique au Flow 1. | - | Arrière-plan flouté. |
| 3-6. **Sélection, Paramétrage, Confirmation, Résultat** | Identique au Flow 1. | Identique au Flow 1. | - | Le compteur d'assignations sur la carte s'incrémente après succès. |

### Flow 3 – Coach : Vue "Programmes Assignés" dans le Profil Client

**Objectif utilisateur :** "Je veux voir tous les programmes que j'ai assignés à ce client et suivre sa progression."

| Étape | Action | Réponse | États & Erreurs | Feedback |
| :--- | :--- | :--- | :--- | :--- |
| 1. **Contexte** | Le coach est sur `ClientProfile`. | Plusieurs sections, dont "Programmes Assignés". | - | - |
| 2. **Visualisation** | Le coach ouvre l'accordéon "Programmes Assignés". | Liste des programmes assignés, triés par date. | **État vide** : "Aucun programme assigné." | Spinner pendant le chargement. |
| 3. **Informations Clés** | Le coach voit : nom, statut, date de début, progression (ex: "Semaine 2/8"). | Informations claires sur chaque item. | - | Statut avec puce de couleur (vert = En cours, gris = Terminé). |
| 4. **Interaction** | Le coach clique sur un programme. | Modale ou page avec vue détaillée (`ProgramPerformanceDetail`). | **Erreur** : Message si les détails ne chargent pas. | - |
| 5. **Action** | Le coach peut archiver, suspendre ou supprimer une assignation. | Menu d'options ("...") sur chaque item. | **Confirmation** : Boîte de dialogue avant action destructive. | Toast après l'action (ex: "Assignation archivée."). |

### Flow 4 – Client : Vue "Programme en Cours"

**Objectif utilisateur :** "Je veux savoir quelle est ma séance du jour, la réaliser et enregistrer mes performances."

| Étape | Action | Réponse | États & Erreurs | Feedback |
| :--- | :--- | :--- | :--- | :--- |
| 1. **Contexte** | Le client se connecte et va sur son tableau de bord ou dans `Workout`. | Encart "Programme en cours" affiché. | **État vide** : Invitation à contacter le coach. | - |
| 2. **Accès Séance** | Le client clique sur **"Commencer la séance"**. | Redirection vers la page de la séance (`/app/workout/session/:sessionId`). | **Erreur** : Page d'erreur si la séance n'existe pas. | - |
| 3. **Réalisation** | Le client consulte les consignes et remplit les champs (charge, reps, RPE). | Champs de saisie pour chaque série. | **Validation** : Nombres uniquement. | Sauvegarde automatique (`autosave`). |
| 4. **Validation** | Le client clique sur **"Terminer la séance"**. | Enregistrement des `LogPerformance`. Statut de la séance → `Terminé`. | **Après** : Progression incrémentée. | Message de félicitations. Redirection vers le tableau de bord. |
| 5. **Feedback** | Le client voit sa progression mise à jour. | Encart "Programme en cours" affiche la prochaine séance. | - | Jauge de progression mise à jour. |

---

## 5. Proposition de Modèle de Données et Architecture

En s'appuyant sur les principes de **Domain-Driven Design (DDD)** et de **Clean Architecture**, voici une proposition pour un modèle de données restructuré et une architecture technique claire.

### Architecture : Le Modèle Hybride Clarifié

Nous conservons le principe d'une architecture hybride, car il est conceptuellement juste :

1.  **Les Modèles (Templates)** : Bibliothèque réutilisable du coach.
2.  **Les Instances (Client Data)** : Copies personnelles et indépendantes pour chaque client.

Le problème actuel vient d'une mauvaise implémentation. La refonte se concentrera sur une **séparation stricte et claire** de ces deux contextes.

### Modèle de Données Cible (Pseudo-Schéma SQL)

#### 1. Tables des Modèles (Bibliothèque du Coach)

```sql
-- Table des modèles de programmes
CREATE TABLE program_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    objective TEXT,
    week_count INT NOT NULL DEFAULT 1,
    is_public BOOLEAN DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table des modèles de séances
CREATE TABLE session_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_template_id uuid NOT NULL REFERENCES program_templates(id) ON DELETE CASCADE,
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    week_number INT NOT NULL DEFAULT 1,
    session_order INT NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table de jonction pour les exercices dans un modèle de séance
CREATE TABLE session_exercise_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_template_id uuid NOT NULL REFERENCES session_templates(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_order INT NOT NULL DEFAULT 1,
    sets INT,
    reps TEXT,
    load TEXT,
    rest_time TEXT,
    notes TEXT
);
```

#### 2. Table d'Assignation (Le Registre Central)

```sql
-- Table des assignations de programmes
CREATE TABLE program_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_template_id uuid NOT NULL REFERENCES program_templates(id) ON DELETE RESTRICT,
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming, active, completed, paused, archived
    
    -- Suivi de la progression
    current_week INT DEFAULT 1,
    current_session_order INT DEFAULT 1,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

**Correction critique :** Cette table **DOIT** avoir des politiques RLS strictes.

#### 3. Tables des Instances (Données du Client)

```sql
-- Table des programmes "vivants" des clients
CREATE TABLE client_programs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id uuid NOT NULL REFERENCES program_assignments(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    objective TEXT,
    week_count INT NOT NULL
);

-- Table des séances "vivantes" des clients
CREATE TABLE client_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_program_id uuid NOT NULL REFERENCES client_programs(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    week_number INT NOT NULL,
    session_order INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, skipped
    completed_at timestamptz
);

-- Table des exercices dans une séance client
CREATE TABLE client_session_exercises (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_session_id uuid NOT NULL REFERENCES client_sessions(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id),
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_order INT,
    sets INT, reps TEXT, load TEXT, rest_time TEXT, notes TEXT
);
```

#### 4. Table de Suivi des Performances

```sql
-- Table des logs de performance
CREATE TABLE performance_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_session_exercise_id uuid NOT NULL REFERENCES client_session_exercises(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    reps_achieved INT,
    load_achieved TEXT,
    rpe INT,
    notes TEXT,
    performed_at timestamptz DEFAULT now(),
    UNIQUE (client_session_exercise_id, set_number)
);
```

### Logique d'Implémentation (Clean Architecture)

1.  **Domaine (Domain Layer)** : Entités et logique métier pure (ex: calcul du statut d'un programme).
2.  **Application (Application Layer)** : Orchestration des cas d'usage (User Flows). Ex: le service `AssignProgram` qui crée une entrée dans `program_assignments` et déclenche la duplication.
3.  **Infrastructure (Infrastructure Layer)** : Implémentation concrète. Services Supabase (`programAssignmentService.ts`) et fonction RPC PostgreSQL (`assign_program_atomic`).
4.  **Présentation (UI Layer)** : Composants React. Ils appellent les services et affichent les données. Aucune logique métier.

---

## 6. Spécifications Fonctionnelles

### Objectifs Business & Valeur

L'objectif principal est de **livrer la fonctionnalité la plus fondamentale** de l'application : permettre aux coachs d'entraîner leurs clients à distance.

- **Pour le Coach** : Augmenter l'efficacité, monétiser son expertise, améliorer le suivi.
- **Pour le Client** : Bénéficier d'un suivi structuré, visualiser sa progression, rester engagé.
- **Pour le Produit** : Activer le cœur de la proposition de valeur, augmenter la rétention, justifier la monétisation.

### User Stories

| Rôle | User Story | Bénéfice | Priorité MVP |
| :--- | :--- | :--- | :--- |
| Coach | Je veux **assigner un programme** à plusieurs clients en une fois | afin de gagner du temps. | **Haute** |
| Coach | Je veux **voir la liste des programmes assignés** à un client et sa progression | afin de préparer son prochain bilan. | **Haute** |
| Coach | Je veux **modifier un programme assigné** sans changer le template | afin de personnaliser l'entraînement. | Moyenne |
| Client | Je veux **voir le programme qui m'a été assigné** et ma séance du jour | afin de m'entraîner en autonomie. | **Haute** |
| Client | Je veux **enregistrer mes performances** (charges, reps) | afin de suivre mes progrès. | **Haute** |
| Client | Je veux **voir l'historique de mes performances** | afin de constater ma progression. | Moyenne |

### Règles de Gestion & Cas Limites

- **Assignation Multiple** : Un même template peut être assigné plusieurs fois au même client à des dates différentes.
- **Modification de Template** : Modifier un template **ne doit pas** impacter les programmes déjà assignés.
- **Modification d'Instance** : Un coach peut modifier un `client_program` sans impacter le template.
- **Suppression de Client** : Suppression en cascade de toutes ses données.
- **Séance Isolée** : Hors du périmètre MVP.

---

## 7. Design des API et Services

### Fonction RPC Principale (PostgreSQL)

**`rpc('assign_program_atomic', {p_template_id, p_client_id, p_coach_id, p_start_date})`**

- **Rôle** : Coach
- **Action** : Crée une entrée dans `program_assignments` et duplique le template dans les tables `client_*`.
- **Transaction** : Atomique. Si une étape échoue, rollback complet.
- **Retour Succès** : `{ success: true, assignment_id: '...' }`
- **Retour Erreur** : `{ success: false, error: '...' }`

### Endpoints Principaux (Supabase API)

| Endpoint | Méthode | Rôle | Description | Données Clés |
| :--- | :--- | :--- | :--- | :--- |
| `/program_assignments` | `GET` | Coach, Client | Récupérer les assignations. RLS garantit la sécurité. | `?client_id=eq.{id}`, `?coach_id=eq.{id}` |
| `/program_assignments` | `PATCH` | Coach, Client | Mettre à jour le statut ou la progression. | `id=eq.{id}`, `body: { status, current_week }` |
| `/client_programs` | `GET` | Coach, Client | Récupérer les détails d'un programme client. | `?assignment_id=eq.{id}` |
| `/performance_logs` | `POST` | Client | Enregistrer les performances. | `body: { client_session_exercise_id, ... }` |
| `/performance_logs` | `GET` | Coach, Client | Consulter l'historique. | `?exercise_id=eq.{id}&client_id=eq.{id}` |

---

## 8. Plan d'Implémentation et Refacto

**Priorité #1 : Ne pas casser l'existant.** Déploiement par étapes.

### Étape 1 : Base de Données (Le Socle)

1.  **Migration SQL - Création des nouvelles tables** : Créer `program_templates`, `session_templates`, `session_exercise_templates`, `program_assignments`, `client_programs`, `client_sessions`, `client_session_exercises`, `performance_logs`.
2.  **Migration SQL - RLS** : Appliquer des politiques de sécurité **strictes** sur **toutes** ces tables.
    - Un coach ne voit que ses données ou celles de ses clients.
    - Un client ne voit que ses propres données.
3.  **Création de la fonction RPC `assign_program_atomic`** : Logique de duplication transactionnelle en PL/pgSQL.

### Étape 2 : Couche de Services (Le Cerveau)

1.  **Refactoriser `programAssignmentService.ts`** :
    - `assignProgram(templateId, clientId, startDate)` : Appelle la nouvelle fonction RPC.
    - `getAssignmentsForClient(clientId)` : Appelle `GET /program_assignments?client_id=...`
    - `getAssignmentsForCoach(coachId)` : Appelle `GET /program_assignments?coach_id=...`
2.  **Créer `performanceLogService.ts`** : Gestion des logs de performance.

### Étape 3 : Couche de Présentation (L'Interface) - MVP

1.  **Refactoriser `WorkoutLibrary.tsx`** :
    - Bouton "Assigner" appelle `assignProgram`.
    - Nombre d'assignations basé sur `count` de `program_assignments`.
2.  **Refactoriser `ClientProfile.tsx` (Vue Coach)** :
    - Section "Programmes Assignés" lit depuis `getAssignmentsForClient`.
3.  **Refactoriser `ClientWorkout.tsx` (Vue Client)** :
    - Récupération du programme en cours basée sur `getAssignmentsForClient` avec filtre `status=eq.active`.
4.  **Créer la page `PerformWorkout.tsx`** :
    - Page où le client remplit sa séance. Lit `client_session_exercises` et écrit dans `performance_logs`.

### Étape 4 : Nettoyage

Une fois le nouveau système validé, déprécier et supprimer l'ancien code.

---

## 9. Check-list QA et Suivi Produit

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
- **Qualité** : Nombre de rapports d'erreur liés à l'assignation (doit tendre vers 0).
- **Rétention** : Corrélation entre le nombre de programmes complétés et la rétention des clients à 3 mois.

---

## 10. Conclusion et Prochaines Étapes

### Synthèse

Le système d'assignation de programmes de Virtus est actuellement **non fonctionnel** en raison d'une **implémentation incomplète** d'une architecture hybride conceptuellement correcte. Les problèmes principaux sont :

1.  **Faille de sécurité critique** : Absence de RLS sur `program_assignments`.
2.  **Modèle de données ambigu** : Confusion entre templates et instances.
3.  **Logique métier déconnectée** : Services TypeScript et fonction RPC non synchronisés.
4.  **Interfaces utilisateur cassées** : Composants React ne reçoivent pas les bonnes données.

### Plan d'Action Recommandé

1.  **Urgence (Semaine 1)** : Corriger la faille de sécurité RLS sur `program_assignments` et les tables `client_*`.
2.  **Court terme (Semaines 2-4)** : Implémenter le nouveau modèle de données (Étape 1) et refactoriser les services (Étape 2).
3.  **Moyen terme (Semaines 5-8)** : Refactoriser les interfaces utilisateur (Étape 3) et tester le MVP.
4.  **Long terme (Semaines 9+)** : Nettoyage de l'ancien code (Étape 4) et ajout de fonctionnalités avancées (modification de programmes, historique de performances).

### Prochaines Étapes Immédiates

1.  **Valider ce diagnostic** avec ton équipe technique.
2.  **Prioriser les tâches** selon le plan d'implémentation.
3.  **Créer les migrations SQL** pour les nouvelles tables et les politiques RLS.
4.  **Tester la fonction RPC** `assign_program_atomic` en isolation avant de l'intégrer au frontend.
5.  **Mettre en place des tests automatisés** pour les parcours critiques (assignation, visualisation, enregistrement de performances).

Ce plan te fournit une feuille de route claire et actionnable pour passer d'un système cassé à un système robuste, sécurisé et prêt à scaler. N'hésite pas à me solliciter pour approfondir un point spécifique ou pour m'impliquer dans l'implémentation technique.
