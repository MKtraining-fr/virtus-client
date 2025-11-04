# Architecture des Tables - Projet Virtus

## 1. Table EXERCISES (Partagée par tous)
**Colonnes :**
- `id` (uuid)
- `name` (text) - Nom de l'exercice
- `description` (text) - Description
- `category` (text) - Catégorie
- `muscle_group` (text) - Groupe musculaire principal
- `equipment` (text) - Matériel nécessaire
- `difficulty` (text) - Niveau de difficulté
- `video_url` (text) - URL de la vidéo
- `image_url` (text) - **URL de l'illustration** ⚠️
- `type` (text) - Type d'exercice (musculation, mobilité, échauffement)
- `secondary_muscle_groups` (array) - Groupes musculaires secondaires
- `alternative_1_id` (uuid) - Exercice alternatif 1
- `alternative_2_id` (uuid) - Exercice alternatif 2
- `created_by` (uuid) - ID du coach créateur
- `is_public` (boolean) - Visible par tous ou uniquement par le créateur
- `is_archived` (boolean) - Archivé ou non
- `archived_at` (timestamp)
- `created_at`, `updated_at`

**Règles :**
- Seuls les coachs peuvent créer des exercices
- Un exercice créé par un coach n'est visible que par lui et ses clients (via `created_by` et `is_public`)

---

## 2. TEMPLATES DES COACHS (programmes/séances réutilisables)

### Table PROGRAMS (Templates)
**Colonnes :**
- `id` (uuid)
- `coach_id` (uuid) - Propriétaire du template
- `name` (text)
- `objective` (text)
- `week_count` (integer)
- `created_at`, `updated_at`

### Table SESSIONS (Séances du template)
**Colonnes :**
- `id` (uuid)
- `program_id` (uuid) - Référence au programme
- `coach_id` (uuid)
- `name` (text)
- `order` (integer) - Ordre de la séance
- `week_number` (integer)
- `created_at`, `updated_at`

### Table SESSION_EXERCISES (Exercices de la séance)
**Colonnes :**
- `id` (uuid)
- `session_id` (uuid)
- `exercise_id` (uuid) - Référence à la table EXERCISES
- `coach_id` (uuid)
- `exercise_order` (integer)
- `sets` (integer)
- `reps` (text)
- `load` (text)
- `tempo` (text)
- `rest_time` (text)
- `intensification` (text)
- `notes` (text)
- `created_at`, `updated_at`

**Note :** Pas de colonne `illustration_url` ni `image_url` - ces infos viennent de la table EXERCISES via jointure

---

## 3. PROGRAMMES CRÉÉS PAR LES CLIENTS

### Table CLIENT_CREATED_PROGRAMS
**Colonnes :**
- `id` (uuid)
- `client_id` (uuid)
- `coach_id` (uuid) - Coach affilié (peut voir les créations)
- `name` (text)
- `objective` (text)
- `week_count` (integer)
- `created_at`, `updated_at`

### Table CLIENT_CREATED_SESSIONS
**Colonnes :**
- `id` (uuid)
- `program_id` (uuid)
- `client_id` (uuid)
- `coach_id` (uuid)
- `name` (text)
- `week_number` (integer)
- `session_order` (integer)
- `created_at`, `updated_at`

### Table CLIENT_CREATED_SESSION_EXERCISES
**Colonnes :**
- `id` (uuid)
- `session_id` (uuid)
- `exercise_id` (uuid) - Référence à la table EXERCISES
- `client_id` (uuid)
- `coach_id` (uuid)
- `exercise_order` (integer)
- `sets` (integer)
- `reps` (text)
- `load` (text)
- `tempo` (text)
- `rest_time` (text)
- `intensification` (jsonb)
- `notes` (text)
- `created_at`, `updated_at`

**Note :** Pas de colonne `illustration_url` ni `image_url` ici non plus

---

## 4. ATTRIBUTION DES PROGRAMMES AUX CLIENTS

### Option A : Table PROGRAM_ASSIGNMENTS (Référence sans duplication)
**Colonnes :**
- `id` (uuid)
- `program_id` (uuid) - Référence au template
- `client_id` (uuid)
- `coach_id` (uuid)
- `start_date`, `end_date`
- `current_week`, `current_session`
- `status` (text)
- `customizations` (jsonb) - Modifications spécifiques au client
- `created_at`, `updated_at`

### Option B : Table CLIENT_PROGRAMS (Duplication complète)
**Colonnes :**
- `id` (uuid)
- `program_template_id` (uuid) - Référence au template original
- `client_id` (uuid)
- `coach_id` (uuid)
- `name` (text)
- `objective` (text)
- `week_count` (integer)
- `assigned_at`, `start_date`, `end_date`
- `status` (text)
- `current_week`, `current_session_index`
- `created_at`, `updated_at`

**⚠️ REDONDANCE POTENTIELLE** : Il existe deux systèmes d'attribution :
1. `program_assignments` - Référence légère
2. `client_programs` + `client_sessions` + `client_session_exercises` - Duplication complète

**À CLARIFIER :** Quel système est actuellement utilisé ?

---

## 5. RÉSUMÉ DES FLUX

### Flux Coach → Template
1. Coach crée un programme dans `programs`
2. Ajoute des séances dans `sessions`
3. Ajoute des exercices dans `session_exercises` (référence `exercises`)

### Flux Client → Mes Programmes
1. Client crée un programme dans `client_created_programs`
2. Ajoute des séances dans `client_created_sessions`
3. Ajoute des exercices dans `client_created_session_exercises` (référence `exercises`)
4. Le coach affilié peut voir ces créations via `coach_id`

### Flux Attribution Coach → Client
**À CLARIFIER :** 
- Utilise-t-on `program_assignments` (référence) ?
- Ou `client_programs` (duplication) ?
- Ou les deux selon le contexte ?

---

## 6. PROBLÈMES IDENTIFIÉS

1. ✅ **CORRIGÉ** : `clientCreatedProgramServiceV3.ts` et `V4.ts` utilisaient `illustration_url` au lieu de `image_url`
2. ⚠️ **À CORRIGER** : `WorkoutBuilder.tsx` essaie d'insérer des colonnes inexistantes dans `session_exercises`
3. ⚠️ **À VÉRIFIER** : Redondance entre `program_assignments` et `client_programs`
4. ⚠️ **À IMPLÉMENTER** : Fonction `getExercisesByIds` manquante
