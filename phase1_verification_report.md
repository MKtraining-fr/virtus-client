# Phase 1 : Rapport de Vérification de l'Architecture

## ✅ TABLES EXISTANTES ET FONCTIONNELLES

### 1. Table `exercises` (Base de données partagée)
**Statut** : ✅ Complète et correcte

**Colonnes vérifiées** :
- `id`, `name`, `description`, `category`
- `muscle_group`, `equipment`, `difficulty`
- `video_url`, `image_url` ⚠️ (PAS `illustration_url`)
- `type`, `secondary_muscle_groups`
- `alternative_1_id`, `alternative_2_id`
- `created_by` (uuid, nullable) → Identifie le coach créateur
- `is_public` (boolean, default true) → Visibilité
- `is_archived`, `archived_at`
- `created_at`, `updated_at`

**Contraintes** : 
- ✅ `created_by` est nullable (OK pour exercices système)
- ✅ `is_public` permet de gérer la visibilité

---

### 2. Tables `client_created_*` (Programmes des clients)
**Statut** : ✅ Utilisées activement (3 programmes, 3 séances, 6 exercices)

#### `client_created_programs`
**Colonnes** :
- `id`, `client_id` (NOT NULL)
- `coach_id` (NULLABLE) ✅ → Supporte les pratiquants indépendants
- `name`, `objective`, `week_count`
- `created_at`, `updated_at`

**⚠️ MANQUE** : 
- `source_type` → Pour distinguer 'client_created' vs 'coach_assigned'
- `program_template_id` → Pour référencer le template original (si attribué par coach)

#### `client_created_sessions`
**Colonnes** :
- `id`, `session_id`
- `program_id` (NULLABLE) → ⚠️ Devrait être NOT NULL
- `client_id` (NOT NULL)
- `coach_id` (NULLABLE) ✅
- `name`, `week_number`, `session_order`
- `created_at`, `updated_at`

#### `client_created_session_exercises`
**Colonnes** :
- `id`, `session_id`, `exercise_id` (référence `exercises`)
- `client_id` (NOT NULL)
- `coach_id` (NULLABLE) ✅
- `exercise_order`, `sets`, `reps`, `load`, `tempo`, `rest_time`
- `intensification` (jsonb), `notes`
- `created_at`, `updated_at`

**Contraintes FK vérifiées** :
- ✅ `exercise_id` → `exercises.id`
- ✅ `session_id` → `client_created_sessions.id`
- ✅ `program_id` → `client_created_programs.id`

---

### 3. Tables `programs`, `sessions`, `session_exercises` (Templates des coachs)
**Statut** : ✅ Existantes

#### `programs`
**Colonnes** :
- `id`, `coach_id`, `name`, `objective`, `week_count`
- `created_at`, `updated_at`

#### `sessions`
**Colonnes** :
- `id`, `program_id` (NULLABLE)
- `coach_id` (NULLABLE)
- `name`, `week_number`, `session_order`
- `created_at`, `updated_at`

#### `session_exercises`
**Colonnes** :
- `id`, `session_id`, `exercise_id`, `coach_id`
- `exercise_order`, `sets`, `reps`, `load`, `tempo`, `rest_time`
- `intensification` (text, pas jsonb), `notes`
- `created_at`, `updated_at`

**⚠️ DIFFÉRENCE** : `intensification` est `text` ici vs `jsonb` dans `client_created_session_exercises`

---

### 4. Table `program_assignments`
**Statut** : ⚠️ Incomplète pour le système hybride

**Colonnes actuelles** :
- `id`, `program_id`, `client_id`, `coach_id`
- `start_date`, `end_date`
- `current_week`, `current_session`
- `status`, `customizations` (jsonb)
- `created_at`, `updated_at`

**Contraintes FK actuelles** :
- ✅ `client_id` → `clients.id`
- ✅ `coach_id` → `clients.id`
- ⚠️ `program_id` → Référence `programs` (templates) mais pas de FK explicite trouvée

**⚠️ MANQUE** :
- `client_program_id` → Référence vers `client_created_programs.id` (la copie)

---

### 5. Tables `client_programs`, `client_sessions`, `client_session_exercises`
**Statut** : ⚠️ VIDES (0 lignes) - Tables redondantes ?

Ces tables existent mais sont vides. Elles semblent être une tentative antérieure de duplication.

**Décision** : À supprimer ou réaffecter selon la stratégie choisie.

---

## 📋 RÉSUMÉ DES MODIFICATIONS NÉCESSAIRES

### Modifications de la base de données (Phase 2)

#### 1. Ajouter des colonnes à `client_created_programs`
```sql
ALTER TABLE client_created_programs 
ADD COLUMN source_type TEXT DEFAULT 'client_created' 
CHECK (source_type IN ('client_created', 'coach_assigned'));

ALTER TABLE client_created_programs 
ADD COLUMN program_template_id UUID REFERENCES programs(id) ON DELETE SET NULL;

COMMENT ON COLUMN client_created_programs.source_type IS 
'Origine du programme: client_created (créé par le client/pratiquant) ou coach_assigned (attribué par le coach)';

COMMENT ON COLUMN client_created_programs.program_template_id IS 
'Référence au template original si le programme a été attribué par un coach';
```

#### 2. Ajouter une colonne à `program_assignments`
```sql
ALTER TABLE program_assignments 
ADD COLUMN client_program_id UUID REFERENCES client_created_programs(id) ON DELETE CASCADE;

COMMENT ON COLUMN program_assignments.client_program_id IS 
'Référence vers la copie du programme dans client_created_programs';
```

#### 3. Rendre `program_id` nullable dans `client_created_sessions`
```sql
-- Déjà nullable, rien à faire
```

#### 4. Harmoniser `intensification` dans `session_exercises`
```sql
-- Option A : Changer text → jsonb
ALTER TABLE session_exercises 
ALTER COLUMN intensification TYPE jsonb USING intensification::jsonb;

-- Option B : Garder text et parser en JSON dans le code
-- (Plus simple si des données existent déjà)
```

#### 5. Supprimer les tables redondantes (si confirmé)
```sql
-- À exécuter APRÈS migration complète du code
DROP TABLE IF EXISTS client_session_exercises CASCADE;
DROP TABLE IF EXISTS client_sessions CASCADE;
DROP TABLE IF EXISTS client_programs CASCADE;
```

---

## 🔍 VÉRIFICATIONS SUPPLÉMENTAIRES NÉCESSAIRES

### 1. Vérifier les RLS (Row Level Security) Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN (
  'client_created_programs', 
  'client_created_sessions', 
  'client_created_session_exercises',
  'programs',
  'sessions',
  'session_exercises',
  'exercises'
);
```

### 2. Vérifier les index pour les performances
```sql
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN (
  'client_created_programs', 
  'client_created_sessions', 
  'client_created_session_exercises'
) 
ORDER BY tablename, indexname;
```

### 3. Vérifier les triggers existants
```sql
SELECT trigger_name, event_manipulation, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE event_object_table IN (
  'client_created_programs', 
  'client_created_sessions', 
  'client_created_session_exercises'
);
```

---

## ✅ POINTS POSITIFS

1. ✅ `coach_id` est déjà nullable dans toutes les tables `client_created_*` → Supporte les pratiquants indépendants
2. ✅ Les contraintes FK sont bien configurées
3. ✅ Les tables `client_created_*` sont déjà utilisées (3 programmes existants)
4. ✅ La table `exercises` a bien `image_url` (pas `illustration_url`)
5. ✅ Structure cohérente entre templates coach et programmes clients

---

## ⚠️ POINTS D'ATTENTION

1. ⚠️ Manque `source_type` dans `client_created_programs`
2. ⚠️ Manque `program_template_id` dans `client_created_programs`
3. ⚠️ Manque `client_program_id` dans `program_assignments`
4. ⚠️ Tables `client_programs`, `client_sessions`, `client_session_exercises` sont vides (redondance)
5. ⚠️ `intensification` est `text` dans `session_exercises` vs `jsonb` dans `client_created_session_exercises`
6. ⚠️ Besoin de vérifier les RLS policies pour la sécurité

---

## 🎯 PROCHAINES ÉTAPES (Phase 2)

1. Créer les migrations SQL pour ajouter les colonnes manquantes
2. Vérifier et ajuster les RLS policies
3. Créer les index nécessaires pour les performances
4. Tester les migrations sur un environnement de développement
5. Valider avec l'utilisateur avant d'exécuter en production
