# Tables Supabase Actuelles - Projet Virtus

**Date** : 2 décembre 2025

## Tables Identifiées

### Tables Principales

1. **`clients`** (RLS activé) - 6 lignes
   - Stocke les profils utilisateurs (admin, coach, client)
   - Colonnes clés : `id`, `email`, `role`, `coach_id`, `status`
   - Colonnes JSONB : `lifestyle`, `medical_info`, `nutrition`, `bilans`, `performance_logs`

2. **`exercises`** (RLS activé) - 57 lignes
   - Bibliothèque d'exercices
   - Colonnes clés : `id`, `name`, `category`, `muscle_group`, `type`, `created_by`, `is_public`, `is_archived`

3. **`nutrition_plans`** (RLS activé) - 0 lignes
   - Plans nutritionnels
   - Colonnes clés : `id`, `client_id`, `name`, `meals` (JSONB)

4. **`messages`** (RLS activé) - 2 lignes
   - Système de messagerie
   - Colonnes clés : `id`, `sender_id`, `recipient_id`, `content`, `seen_by_recipient`

5. **`notifications`** (RLS désactivé) - 32 lignes
   - Notifications système
   - Colonnes clés : `id`, `user_id`, `title`, `message`, `read`

6. **`food_items`** (RLS activé) - 0 lignes
   - Aliments pour la nutrition
   - Colonnes clés : `id`, `name`, `category`, `food_family`, `created_by`, `is_public`

7. **`bilan_templates`** (RLS activé) - 1 ligne
   - Templates de bilans
   - Colonnes clés : `id`, `name`, `coach_id`, `sections` (JSONB)

8. **`intensification_techniques`** (RLS désactivé) - 7 lignes
   - Techniques d'intensification pour les exercices
   - Colonnes clés : `id`, `name`, `description`, `created_by`, `is_public`

### Tables Obsolètes (à migrer)

9. **`program_assignments_old`** (RLS désactivé) - 0 lignes
   - Ancienne table d'assignation de programmes
   - **⚠️ À remplacer par `program_assignments`**

## Tables Manquantes (d'après la migration 20251119)

Les tables suivantes devraient exister d'après la migration `20251119_create_program_assignment_system.sql` mais ne sont pas listées :

### Templates (Bibliothèque Coach)
- ❌ **`program_templates`** : Modèles de programmes créés par les coachs
- ❌ **`session_templates`** : Modèles de séances appartenant aux programmes templates
- ❌ **`session_exercise_templates`** : Configuration des exercices dans les séances templates

### Assignation
- ❌ **`program_assignments`** : Registre central des assignations (source de vérité)

### Instances Client
- ❌ **`client_programs`** : Instances de programmes dupliquées pour chaque client
- ❌ **`client_sessions`** : Instances de séances appartenant aux programmes clients
- ❌ **`client_session_exercises`** : Exercices dans les séances clients (modifiables)

### Performance
- ❌ **`performance_logs`** : Logs des performances réelles (peut-être nommée différemment)
- ❓ **`client_exercise_performance`** : Nom alternatif possible pour les logs de performance

## Analyse

### Problème Identifié

Les tables du nouveau système d'assignation de programmes (migration 20251119) **ne sont pas présentes en base**.

Cela signifie que :
1. La migration n'a pas été appliquée
2. Le système utilise encore l'ancien modèle (colonnes JSONB dans `clients`)
3. Les services TypeScript (`programAssignmentService`, `clientProgramService`) ne peuvent pas fonctionner

### Solution

Il faut appliquer les migrations manquantes :
1. `20251119_create_program_assignment_system.sql`
2. `20251119_enable_rls_policies.sql`
3. `20251119_create_assign_program_function.sql`

---

**Auteur** : Manus AI  
**Date** : 2 décembre 2025
