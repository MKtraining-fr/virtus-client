# 3. Proposition de Modèle de Données et Architecture

En s'appuyant sur les principes de Domain-Driven Design (DDD) et de Clean Architecture, voici une proposition pour un modèle de données restructuré et une architecture technique claire. L'objectif est de corriger les défauts du modèle actuel, de garantir la cohérence des données et de fournir une base solide pour l'implémentation.

## Architecture : Le Modèle Hybride Clarifié

Nous conservons le principe d'une architecture hybride, car il est conceptuellement juste pour le domaine du coaching :

1.  **Les Modèles (Templates)** : Le coach possède une bibliothèque de programmes et de séances qui sont ses actifs intellectuels. Ce sont des modèles réutilisables.
2.  **Les Instances (Client Data)** : Lorsqu'un programme est assigné, le client doit recevoir une **copie personnelle et indépendante**. Cela est crucial pour qu'il puisse suivre sa progression et pour que le coach puisse, si nécessaire, modifier le programme d'un client sans impacter le modèle original ou les programmes des autres clients.

Le problème actuel vient d'une mauvaise implémentation de ce modèle. La refonte se concentrera sur une séparation stricte et claire de ces deux contextes.

## Modèle de Données Cible (Pseudo-Schéma SQL)

Voici le schéma de base de données recommandé. Il clarifie le nom des tables pour refléter leur rôle (template vs. instance) et établit des relations logiques et sécurisées.

### 1. Tables des Modèles (Bibliothèque du Coach)

Ces tables contiennent les programmes et séances tels que créés par les coachs. Elles sont la source de vérité pour la bibliothèque.

```sql
-- Table des modèles de programmes
CREATE TABLE program_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    objective TEXT,
    week_count INT NOT NULL DEFAULT 1,
    is_public BOOLEAN DEFAULT false, -- Si le coach veut le partager avec d'autres coachs
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
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT, -- Empêche la suppression d'un exercice utilisé
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_order INT NOT NULL DEFAULT 1,
    sets INT,
    reps TEXT, -- ex: '8-12', 'AMRAP'
    load TEXT, -- ex: '70%', 'RPE 8'
    rest_time TEXT, -- ex: '60s', '2min'
    notes TEXT
);
```

### 2. Table d'Assignation (Le Registre Central)

C'est la table la plus importante. Elle est la **source de vérité unique** qui répond à la question : "Quel coach a assigné quel programme à quel client, et quand ?".

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

**Correction critique :** Cette table **DOIT** avoir des politiques RLS strictes. J'ai noté que la table `program_assignments` actuelle n'en avait aucune.

### 3. Tables des Instances (Données du Client)

Ces tables sont des copies des modèles, créées au moment de l'assignation. Elles appartiennent au client et c'est sur elles qu'il travaille.

```sql
-- Table des programmes "vivants" des clients
CREATE TABLE client_programs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id uuid NOT NULL REFERENCES program_assignments(id) ON DELETE CASCADE, -- Lien direct vers l'assignation
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Copié depuis le template
    objective TEXT, -- Copié
    week_count INT NOT NULL -- Copié
);

-- Table des séances "vivantes" des clients
CREATE TABLE client_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_program_id uuid NOT NULL REFERENCES client_programs(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Copié
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
    sets INT, reps TEXT, load TEXT, rest_time TEXT, notes TEXT -- Copié et modifiable
);
```

### 4. Table de Suivi des Performances

Cette table enregistre les performances réelles du client pour chaque série d'un exercice.

```sql
-- Table des logs de performance
CREATE TABLE performance_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_session_exercise_id uuid NOT NULL REFERENCES client_session_exercises(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    reps_achieved INT,
    load_achieved TEXT,
    rpe INT, -- Rating of Perceived Exertion
    notes TEXT,
    performed_at timestamptz DEFAULT now(),
    PRIMARY KEY (id), 
    UNIQUE (client_session_exercise_id, set_number) -- Empêche les doublons
);
```

## Logique d'Implémentation (Clean Architecture)

1.  **Domaine (Domain Layer)** : Le cœur de la logique. Contient les entités (définies ci-dessus) et la logique métier pure (ex: comment calculer le statut d'un programme).

2.  **Application (Application Layer)** : Orchestre les cas d'usage (User Flows). Par exemple, le service `AssignProgram` qui :
    *   Prend en entrée `coach_id`, `client_id`, `template_id`, `start_date`.
    *   Crée une entrée dans `program_assignments`.
    *   Déclenche la duplication du `program_template` vers les tables `client_*`.
    *   Envoie une notification.

3.  **Infrastructure (Infrastructure Layer)** : L'implémentation concrète. C'est ici que se trouvent :
    *   Les services Supabase (ex: `programAssignmentService.ts`) qui communiquent avec la base de données.
    *   La fonction RPC PostgreSQL `assign_program_atomic` qui gère la duplication de manière transactionnelle pour garantir qu'une assignation ne peut pas être à moitié créée.

4.  **Présentation (UI Layer)** : Les composants React (`WorkoutLibrary`, `ClientProfile`, etc.). Ils appellent les services de la couche Application et affichent les données. Ils ne contiennent aucune logique métier.

Cette séparation claire des responsabilités rendra le système plus facile à tester, à maintenir et à faire évoluer. La prochaine étape est de traduire cette architecture en spécifications fonctionnelles et API détaillées.
