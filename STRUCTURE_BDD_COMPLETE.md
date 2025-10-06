# 📊 Structure Complète de la Base de Données - Application Virtus

**Date :** 5 octobre 2025  
**Version :** 1.0  
**Statut :** Proposition à valider

---

## 🎯 Vue d'Ensemble

Cette structure de base de données est conçue pour supporter une application de coaching sportif et nutritionnel complète, avec :
- Gestion des mouvements (musculation, mobilité, échauffement)
- Création et assignation de séances et programmes d'entraînement
- Suivi des performances des clients
- Gestion nutritionnelle (aliments, recettes, plans alimentaires)
- Système de bilans personnalisables
- Messagerie et notifications

---

## 📋 Tables Existantes (À Conserver et Modifier)

### 1. ✅ `clients`
**Statut :** Existe et déjà mise à jour  
**Usage :** Informations complètes sur les clients

**Colonnes actuelles :**
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `phone` (TEXT)
- `role` (ENUM: 'admin', 'coach', 'client')
- `coach_id` (UUID, FK → clients.id)
- `dob` (DATE)
- `age` (INTEGER)
- `sex` (TEXT)
- `height` (NUMERIC)
- `weight` (NUMERIC)
- `address` (TEXT)
- `energy_expenditure_level` (TEXT)
- `objective` (TEXT)
- `notes` (TEXT)
- `status` (TEXT: 'active', 'prospect', 'inactive')
- `lifestyle` (JSONB)
- `medical_info` (JSONB)
- `nutrition` (JSONB)
- `bilans` (JSONB)
- `assigned_bilans` (JSONB)
- `nutrition_logs` (JSONB)
- `performance_logs` (JSONB)
- `assigned_nutrition_plans` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**✅ Aucune modification nécessaire**

---

### 2. ⚠️ `exercises`
**Statut :** Existe mais nécessite des modifications  
**Usage :** Bibliothèque de mouvements (musculation, mobilité, échauffement)

**Colonnes actuelles :**
- `id` (UUID, PK)
- `name` (TEXT)
- `description` (TEXT)
- `category` (TEXT)
- `muscle_group` (TEXT)
- `equipment` (TEXT)
- `difficulty` (TEXT)
- `video_url` (TEXT)
- `image_url` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**🔧 Modifications nécessaires :**

```sql
-- Ajouter les colonnes manquantes
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('musculation', 'mobilite', 'echauffement'));
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS secondary_muscle_groups TEXT[]; -- Array de groupes musculaires secondaires
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS alternative_1_id UUID REFERENCES exercises(id) ON DELETE SET NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS alternative_2_id UUID REFERENCES exercises(id) ON DELETE SET NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES clients(id) ON DELETE CASCADE; -- NULL = exercice par défaut, sinon = exercice personnalisé du coach
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true; -- false = exercice personnalisé du coach

-- Créer des index
CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(type);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON exercises(created_by);
CREATE INDEX IF NOT EXISTS idx_exercises_is_public ON exercises(is_public);
```

**Explication des ajouts :**
- `type` : Différencie musculation / mobilité / échauffement
- `secondary_muscle_groups` : Groupes musculaires secondaires (array pour en avoir plusieurs)
- `alternative_1_id` et `alternative_2_id` : Liens vers 2 alternatives max
- `created_by` : NULL = exercice par défaut de l'app, sinon = ID du coach qui l'a créé
- `is_public` : true = visible par tous, false = visible uniquement par le coach et ses clients

---

### 3. ⚠️ `programs`
**Statut :** Existe mais nécessite des modifications importantes  
**Usage :** Programmes d'entraînement (templates)

**Colonnes actuelles :**
- `id` (UUID, PK)
- `name` (TEXT)
- `description` (TEXT)
- `client_id` (UUID, FK → clients.id) ❌ **À SUPPRIMER**
- `coach_id` (UUID, FK → clients.id)
- `duration_weeks` (INTEGER)
- `goal` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**🔧 Modifications nécessaires :**

```sql
-- Supprimer la colonne client_id (un programme est un template, pas une assignation)
ALTER TABLE programs DROP COLUMN IF EXISTS client_id;

-- Ajouter les colonnes manquantes
ALTER TABLE programs ADD COLUMN IF NOT EXISTS sessions_per_week INTEGER; -- Nombre de séances par semaine
ALTER TABLE programs ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT true; -- true = template réutilisable
ALTER TABLE programs ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false; -- false = privé au coach
ALTER TABLE programs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES clients(id) ON DELETE CASCADE; -- Coach créateur

-- Renommer duration_weeks en max_weeks pour plus de clarté
ALTER TABLE programs RENAME COLUMN duration_weeks TO max_weeks;

-- Créer des index
CREATE INDEX IF NOT EXISTS idx_programs_coach_id ON programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_programs_created_by ON programs(created_by);
CREATE INDEX IF NOT EXISTS idx_programs_is_template ON programs(is_template);
```

**Explication des modifications :**
- Suppression de `client_id` : Un programme est un **template**, l'assignation se fait dans une table séparée
- `sessions_per_week` : Nombre de séances par semaine (2-12)
- `is_template` : Indique si c'est un template réutilisable
- `is_public` : Partage entre coachs (pour future fonctionnalité d'équipe)
- `created_by` : Coach créateur du programme

---

### 4. ⚠️ `sessions`
**Statut :** Existe mais nécessite des modifications importantes  
**Usage :** Séances d'entraînement (templates)

**Colonnes actuelles :**
- `id` (UUID, PK)
- `program_id` (UUID, FK → programs.id)
- `name` (TEXT)
- `day_of_week` (INTEGER)
- `exercises` (JSONB)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**🔧 Modifications nécessaires :**

```sql
-- Ajouter les colonnes manquantes
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS description TEXT; -- Description de la séance
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS week_number INTEGER; -- Numéro de semaine dans le programme
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_order INTEGER; -- Ordre de la séance (1, 2, 3...)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT true; -- Template réutilisable
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES clients(id) ON DELETE CASCADE; -- Coach créateur

-- Modifier program_id pour le rendre optionnel (une séance peut être standalone)
ALTER TABLE sessions ALTER COLUMN program_id DROP NOT NULL;

-- Créer des index
CREATE INDEX IF NOT EXISTS idx_sessions_program_id ON sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_sessions_week_number ON sessions(week_number);
```

**Structure du JSONB `exercises` :**
```json
[
  {
    "exercise_id": "uuid-de-l-exercice",
    "order": 1,
    "sets": 4,
    "reps": "10-12",
    "weight": null,
    "tempo": "3010",
    "rest_seconds": 90,
    "intensification_technique_id": "uuid-ou-null",
    "notes": "Bien contrôler la descente"
  }
]
```

---

### 5. ✅ `nutrition_plans`
**Statut :** Existe, structure à vérifier  
**Usage :** Plans alimentaires

**À analyser plus en détail** pour s'assurer qu'elle supporte :
- Plans par catégories (macros)
- Plans par aliments précis
- Mix des deux approches

---

### 6. ✅ `messages`
**Statut :** Existe et fonctionnel  
**Usage :** Messagerie entre coach et client

**Colonnes actuelles :**
- `id` (UUID, PK)
- `sender_id` (UUID, FK → clients.id)
- `recipient_id` (UUID, FK → clients.id)
- `subject` (TEXT)
- `content` (TEXT)
- `read` (BOOLEAN)
- `created_at` (TIMESTAMP)

**🔧 Ajout recommandé :**
```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_voice BOOLEAN DEFAULT false; -- true si message vocal
ALTER TABLE messages ADD COLUMN IF NOT EXISTS voice_url TEXT; -- URL du fichier vocal
```

---

### 7. ✅ `notifications`
**Statut :** Existe et fonctionnel  
**Usage :** Notifications push

**Colonnes actuelles :**
- `id` (UUID, PK)
- `user_id` (UUID, FK → clients.id)
- `title` (TEXT)
- `message` (TEXT)
- `type` (TEXT)
- `read` (BOOLEAN)
- `created_at` (TIMESTAMP)

**✅ Aucune modification nécessaire**

---

### 8. ⚠️ `food_items`
**Statut :** Existe mais nécessite des modifications  
**Usage :** Base de données d'aliments bruts

**Colonnes actuelles :**
- `id` (UUID, PK)
- `name` (TEXT)
- `category` (TEXT)
- `calories` (NUMERIC)
- `protein` (NUMERIC)
- `carbs` (NUMERIC)
- `fat` (NUMERIC)
- `serving_size` (TEXT)
- `created_at` (TIMESTAMP)

**🔧 Modifications nécessaires :**

```sql
-- Ajouter les colonnes manquantes
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS food_family TEXT; -- Famille alimentaire (voir Q15)
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS micronutrients JSONB; -- Micronutriments principaux
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES clients(id) ON DELETE CASCADE; -- NULL = aliment par défaut, sinon = coach
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true; -- false = aliment personnalisé du coach

-- Créer des index
CREATE INDEX IF NOT EXISTS idx_food_items_food_family ON food_items(food_family);
CREATE INDEX IF NOT EXISTS idx_food_items_created_by ON food_items(created_by);
CREATE INDEX IF NOT EXISTS idx_food_items_is_public ON food_items(is_public);
```

**Valeurs possibles pour `food_family` (selon Q15) :**
- Poissons
- Fruits frais
- Légumes frais
- Fruits secs
- Féculents cuits (pâtes, riz)
- Légumineuses cuites
- Céréales petit-déj.
- Tubercules (pomme de terre)
- Viande maigre
- Œufs
- Produits de la mer (crustacés)
- Produits laitiers (lait demi-écrémé)
- Fromages (moyenne)
- Matières grasses (végétales/animales)
- Fruits oléagineux / graines
- Produits sucrés
- Produits sucrés et gras (viennoiseries)

---

### 9. ✅ `bilan_templates`
**Statut :** Existe déjà  
**Usage :** Templates de bilans personnalisables (dont questionnaire de fin de séance)

**✅ Déjà fonctionnel** - Utilisé pour le bilan initial et peut être utilisé pour les questionnaires de fin de séance

---

## 🆕 Tables à Créer

### 10. 🆕 `intensification_techniques`
**Usage :** Techniques d'intensification (superset, drop set, rest-pause, etc.)

```sql
CREATE TABLE intensification_techniques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  adds_sub_series BOOLEAN DEFAULT false, -- true si la technique ajoute une sous-série
  sub_series_config JSONB, -- Configuration de la sous-série si applicable
  created_by UUID REFERENCES clients(id) ON DELETE CASCADE, -- NULL = technique par défaut, sinon = coach
  is_public BOOLEAN DEFAULT true, -- false = technique personnalisée du coach
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_intensification_techniques_created_by ON intensification_techniques(created_by);
CREATE INDEX idx_intensification_techniques_is_public ON intensification_techniques(is_public);
```

**Exemples de techniques par défaut :**
- Superset
- Drop set
- Rest-pause
- Pyramidal
- Dégressif
- Pré-fatigue
- Post-fatigue

---

### 11. 🆕 `program_assignments`
**Usage :** Assignation de programmes aux clients (relation many-to-many)

```sql
CREATE TABLE program_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  current_week INTEGER DEFAULT 1,
  current_session INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  customizations JSONB, -- Personnalisations spécifiques pour ce client (ex: charges ajustées)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(program_id, client_id, start_date) -- Un client ne peut pas avoir le même programme assigné 2 fois en même temps
);

CREATE INDEX idx_program_assignments_client_id ON program_assignments(client_id);
CREATE INDEX idx_program_assignments_program_id ON program_assignments(program_id);
CREATE INDEX idx_program_assignments_coach_id ON program_assignments(coach_id);
CREATE INDEX idx_program_assignments_status ON program_assignments(status);
```

**Explication :**
- Un programme peut être assigné à plusieurs clients
- Chaque assignation peut avoir des personnalisations (charges, reps, etc.)
- On garde l'historique (status = 'completed' ou 'cancelled')

---

### 12. 🆕 `performance_logs`
**Usage :** Historique des performances des clients (séance par séance)

```sql
CREATE TABLE performance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  program_assignment_id UUID REFERENCES program_assignments(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  week_number INTEGER,
  session_number INTEGER,
  exercises_performed JSONB NOT NULL, -- Détails de chaque exercice effectué
  session_order_modified JSONB, -- Si le client a changé l'ordre des exercices
  questionnaire_responses JSONB, -- Réponses au questionnaire de fin de séance
  total_duration_minutes INTEGER,
  total_tonnage NUMERIC, -- Tonnage total de la séance
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_performance_logs_client_id ON performance_logs(client_id);
CREATE INDEX idx_performance_logs_program_assignment_id ON performance_logs(program_assignment_id);
CREATE INDEX idx_performance_logs_session_id ON performance_logs(session_id);
CREATE INDEX idx_performance_logs_session_date ON performance_logs(session_date);
```

**Structure du JSONB `exercises_performed` :**
```json
[
  {
    "exercise_id": "uuid",
    "exercise_name": "Développé couché",
    "order_performed": 1,
    "sets_performed": [
      {
        "set_number": 1,
        "reps": 10,
        "weight": 50,
        "rest_seconds": 90,
        "completed": true
      },
      {
        "set_number": 2,
        "reps": 8,
        "weight": 50,
        "rest_seconds": 120,
        "completed": true
      }
    ],
    "notes": "Bonne sensation"
  }
]
```

**Structure du JSONB `questionnaire_responses` :**
```json
{
  "rating": 8,
  "difficulty": "Difficile",
  "fatigue_level": 7,
  "comment": "Très bonne séance, j'ai bien progressé"
}
```

---

### 13. 🆕 `recipes`
**Usage :** Recettes créées par les coachs

```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL, -- Liste des ingrédients avec quantités
  preparation_steps TEXT[],
  total_calories NUMERIC, -- Calculé automatiquement
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  servings INTEGER DEFAULT 1,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  image_url TEXT,
  created_by UUID REFERENCES clients(id) ON DELETE CASCADE, -- Coach créateur
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipes_created_by ON recipes(created_by);
CREATE INDEX idx_recipes_is_public ON recipes(is_public);
```

**Structure du JSONB `ingredients` :**
```json
[
  {
    "food_item_id": "uuid",
    "food_name": "Poulet",
    "quantity": 150,
    "unit": "g"
  },
  {
    "food_item_id": "uuid",
    "food_name": "Riz basmati",
    "quantity": 200,
    "unit": "g"
  }
]
```

---

### 14. 🆕 `nutrition_plan_assignments`
**Usage :** Assignation de plans nutritionnels aux clients

```sql
CREATE TABLE nutrition_plan_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutrition_plan_id UUID NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  customizations JSONB, -- Personnalisations pour ce client
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(nutrition_plan_id, client_id, start_date)
);

CREATE INDEX idx_nutrition_plan_assignments_client_id ON nutrition_plan_assignments(client_id);
CREATE INDEX idx_nutrition_plan_assignments_nutrition_plan_id ON nutrition_plan_assignments(nutrition_plan_id);
CREATE INDEX idx_nutrition_plan_assignments_coach_id ON nutrition_plan_assignments(coach_id);
CREATE INDEX idx_nutrition_plan_assignments_status ON nutrition_plan_assignments(status);
```

---

### 15. 🆕 `nutrition_logs`
**Usage :** Journal alimentaire des clients

```sql
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nutrition_plan_assignment_id UUID REFERENCES nutrition_plan_assignments(id) ON DELETE SET NULL,
  log_date DATE NOT NULL,
  meals JSONB NOT NULL, -- Détails de chaque repas
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  adherence_score NUMERIC, -- Score d'adhérence au plan (0-100)
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_nutrition_logs_client_id ON nutrition_logs(client_id);
CREATE INDEX idx_nutrition_logs_nutrition_plan_assignment_id ON nutrition_logs(nutrition_plan_assignment_id);
CREATE INDEX idx_nutrition_logs_log_date ON nutrition_logs(log_date);
```

**Structure du JSONB `meals` :**
```json
[
  {
    "meal_type": "Petit-déjeuner",
    "time": "08:00",
    "items": [
      {
        "food_item_id": "uuid",
        "food_name": "Flocons d'avoine",
        "quantity": 80,
        "unit": "g",
        "calories": 296,
        "protein": 10.4,
        "carbs": 52,
        "fat": 5.6
      }
    ],
    "was_planned": true,
    "modifications": "Ajouté des fruits rouges"
  }
]
```

---

## 📊 Schéma des Relations

```
clients (coach)
  ├─→ exercises (created_by) [1:N]
  ├─→ programs (created_by) [1:N]
  ├─→ sessions (created_by) [1:N]
  ├─→ intensification_techniques (created_by) [1:N]
  ├─→ food_items (created_by) [1:N]
  ├─→ recipes (created_by) [1:N]
  └─→ clients (coach_id) [1:N] -- Ses clients

clients (client)
  ├─→ program_assignments [1:N]
  ├─→ nutrition_plan_assignments [1:N]
  ├─→ performance_logs [1:N]
  └─→ nutrition_logs [1:N]

programs
  ├─→ sessions (program_id) [1:N]
  └─→ program_assignments [1:N]

sessions
  ├─→ exercises (via JSONB) [N:N]
  └─→ performance_logs [1:N]

nutrition_plans
  └─→ nutrition_plan_assignments [1:N]

program_assignments
  └─→ performance_logs [1:N]

nutrition_plan_assignments
  └─→ nutrition_logs [1:N]
```

---

## 🎯 Prochaines Étapes

1. **Validation** : Vous validez cette structure
2. **Création des scripts SQL** : Je crée tous les scripts de migration
3. **Exécution** : On exécute les scripts dans Supabase
4. **Mise à jour du code** : Je mets à jour `database.ts` et les types TypeScript
5. **Tests** : On teste l'application avec la nouvelle structure

---

**Questions ? Modifications à apporter ?** 🤔
