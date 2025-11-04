# Phase 2 : Plan de Migration SQL

## 📋 RÉSUMÉ DES MODIFICATIONS

La migration va ajouter 3 nouvelles colonnes pour supporter le système hybride :

### 1. Table `client_created_programs`
**Nouvelles colonnes** :
- `source_type` (TEXT) : 'client_created' ou 'coach_assigned'
  - Default: 'client_created'
  - Permet de distinguer l'origine du programme
  
- `program_template_id` (UUID, nullable)
  - Référence vers `programs.id` (template original)
  - NULL pour les programmes créés par les clients
  - Rempli pour les programmes attribués par les coachs

### 2. Table `program_assignments`
**Nouvelle colonne** :
- `client_program_id` (UUID, nullable)
  - Référence vers `client_created_programs.id` (la copie)
  - Permet de lier l'attribution à la copie du programme

### 3. Index créés pour les performances
- `idx_client_created_programs_template_id` : Recherche par template
- `idx_program_assignments_client_program_id` : Recherche par copie client
- `idx_client_created_programs_source_type` : Filtrage par source
- `idx_client_created_programs_coach_client` : Requêtes coach → clients
- `idx_client_created_programs_independent` : Pratiquants indépendants

---

## ✅ IMPACT SUR LES DONNÉES EXISTANTES

### Programmes existants (3 programmes)
- ✅ Tous seront marqués comme `source_type = 'client_created'`
- ✅ `program_template_id` sera NULL (pas de template)
- ✅ Aucune perte de données
- ✅ Fonctionnalité existante préservée

### RLS Policies
- ✅ Aucune modification nécessaire
- ✅ Les policies existantes sont compatibles
- ✅ Sécurité maintenue

---

## 🔒 SÉCURITÉ

### Contraintes ajoutées
1. **CHECK constraint** sur `source_type` : Valeurs limitées à 'client_created' ou 'coach_assigned'
2. **Foreign Key** `program_template_id` → `programs.id` avec ON DELETE SET NULL
3. **Foreign Key** `client_program_id` → `client_created_programs.id` avec ON DELETE CASCADE

### Comportement en cas de suppression
- Si un template est supprimé → `program_template_id` devient NULL (copie préservée)
- Si une copie client est supprimée → `program_assignment` est supprimé (cascade)

---

## 📊 WORKFLOW APRÈS MIGRATION

### Scénario 1 : Client crée un programme
```sql
INSERT INTO client_created_programs (
  client_id, 
  coach_id,  -- NULL si pratiquant indépendant, UUID si client rattaché
  name, 
  objective, 
  week_count,
  source_type  -- 'client_created' (default)
) VALUES (...);
```

### Scénario 2 : Coach attribue un template à un client
```sql
-- 1. Dupliquer le template dans client_created_programs
INSERT INTO client_created_programs (
  client_id,
  coach_id,
  name,
  objective,
  week_count,
  source_type,           -- 'coach_assigned'
  program_template_id    -- UUID du template
) 
SELECT 
  :client_id,
  :coach_id,
  name,
  objective,
  week_count,
  'coach_assigned',
  id
FROM programs WHERE id = :template_id;

-- 2. Créer l'assignment
INSERT INTO program_assignments (
  program_id,           -- Template original
  client_program_id,    -- Copie créée ci-dessus
  client_id,
  coach_id,
  status
) VALUES (...);
```

---

## 🧪 TESTS DE VÉRIFICATION

La migration inclut des vérifications automatiques :

1. ✅ Vérification que toutes les colonnes ont été créées
2. ✅ Vérification des contraintes
3. ✅ Statistiques post-migration (nombre de programmes)
4. ✅ Messages de confirmation

---

## 🔄 ROLLBACK

Un script de rollback est disponible : `20251104_rollback_hybrid_system.sql`

**⚠️ ATTENTION** : Le rollback supprime les colonnes et peut entraîner une perte de données si des programmes ont été attribués après la migration.

---

## 📝 FICHIERS CRÉÉS

1. **Migration principale** : `supabase/migrations/20251104_add_hybrid_system_columns.sql`
   - Ajoute les colonnes
   - Crée les index
   - Vérifie l'intégrité

2. **Rollback** : `supabase/migrations/20251104_rollback_hybrid_system.sql`
   - Supprime les colonnes
   - Supprime les index
   - À utiliser en cas de problème

---

## ⚠️ AVANT D'EXÉCUTER

### Vérifications recommandées

1. **Sauvegarde** : Créer un backup de la base de données
2. **Environnement** : Tester d'abord sur un environnement de développement
3. **Validation** : Vérifier que les 3 programmes existants sont bien préservés
4. **RLS** : Confirmer que les policies fonctionnent toujours

### Commandes de test

```sql
-- Vérifier les programmes existants avant migration
SELECT id, client_id, coach_id, name, created_at 
FROM client_created_programs;

-- Après migration, vérifier les nouvelles colonnes
SELECT id, client_id, coach_id, name, source_type, program_template_id 
FROM client_created_programs;

-- Vérifier les index créés
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'client_created_programs';
```

---

## 🚀 EXÉCUTION

### Option 1 : Via Supabase Dashboard
1. Aller dans SQL Editor
2. Copier le contenu de `20251104_add_hybrid_system_columns.sql`
3. Exécuter
4. Vérifier les messages de confirmation

### Option 2 : Via MCP CLI (recommandé pour ce projet)
```bash
manus-mcp-cli tool call execute_sql --server supabase \
  --input '{"project_id":"dqsbfnsicmzovlrhuoif","query":"<contenu du fichier>"}'
```

---

## ✅ VALIDATION POST-MIGRATION

Après l'exécution, vérifier :

1. ✅ Les 3 programmes existants ont `source_type = 'client_created'`
2. ✅ Les 3 programmes existants ont `program_template_id = NULL`
3. ✅ Les colonnes sont bien créées
4. ✅ Les index sont bien créés
5. ✅ Les contraintes FK fonctionnent
6. ✅ Les RLS policies fonctionnent toujours

---

## 🎯 PROCHAINES ÉTAPES (Phase 3)

Après validation de la migration :
1. Nettoyer le code des anciennes références
2. Supprimer les tables redondantes (`client_programs`, etc.)
3. Mettre à jour les services TypeScript
4. Corriger `WorkoutBuilder.tsx` et `ClientWorkoutBuilder.tsx`
