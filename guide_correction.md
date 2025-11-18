# Guide d'application de la correction

## Résumé du problème

Le système d'assignation de programmes/séances ne fonctionne pas car il existe une **incohérence entre les noms de tables dans la base de données et les références dans le code**.

### Tables existantes dans la base de données
- `client_programs`
- `client_sessions`
- `client_session_exercises`

### Tables référencées dans le code
- `client_created_programs`
- `client_created_sessions`
- `client_created_session_exercises`

## Solution proposée

**Renommer les tables de la base de données** pour correspondre aux références dans le code.

Cette solution est préférable à la modification du code car :
1. ✅ Moins de modifications à effectuer
2. ✅ Préserve toutes les données existantes
3. ✅ Cohérent avec l'architecture actuelle du code
4. ✅ Les migrations futures utilisent déjà les nouveaux noms

## Étapes d'application

### Étape 1 : Sauvegarde de la base de données

**CRITIQUE : Effectuer une sauvegarde complète avant toute modification**

Dans Supabase Dashboard :
1. Aller dans `Database` → `Backups`
2. Créer une sauvegarde manuelle
3. Télécharger la sauvegarde localement

Ou via CLI :
```bash
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql
```

### Étape 2 : Vérifier l'état actuel de la base de données

Exécuter ces requêtes pour vérifier l'état actuel :

```sql
-- Vérifier l'existence des tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('client_programs', 'client_sessions', 'client_session_exercises',
                     'client_created_programs', 'client_created_sessions', 'client_created_session_exercises')
ORDER BY table_name;

-- Compter les enregistrements
SELECT 
  (SELECT COUNT(*) FROM client_programs) as programs_count,
  (SELECT COUNT(*) FROM client_sessions) as sessions_count,
  (SELECT COUNT(*) FROM client_session_exercises) as exercises_count;
```

### Étape 3 : Appliquer la migration de renommage

#### Option A : Via Supabase Dashboard

1. Aller dans `SQL Editor`
2. Copier le contenu du fichier `supabase/migrations/20251118_rename_client_tables.sql`
3. Exécuter le script
4. Vérifier les messages de succès dans les logs

#### Option B : Via Supabase CLI

```bash
cd /path/to/virtus
supabase db push
```

Ou manuellement :
```bash
supabase db execute -f supabase/migrations/20251118_rename_client_tables.sql
```

### Étape 4 : Vérifier la migration

Exécuter le script de test :

```bash
supabase db execute -f test_migration.sql
```

Ou dans le SQL Editor du Dashboard, copier et exécuter le contenu de `test_migration.sql`.

**Vérifier que tous les tests passent (✓)**

### Étape 5 : Tester l'assignation depuis l'application

1. Se connecter en tant que coach
2. Aller dans la bibliothèque de programmes
3. Sélectionner un programme
4. Cliquer sur "Assigner"
5. Sélectionner un ou plusieurs clients
6. Valider l'assignation

**Résultat attendu** :
- ✅ Message de succès affiché
- ✅ Le programme apparaît dans le profil du client (côté coach)
- ✅ Le programme apparaît comme "programme en cours" (côté client)
- ✅ Le client peut modifier son instance du programme

### Étape 6 : Vérifier les données dans la base

```sql
-- Vérifier les assignations créées
SELECT 
  pa.id,
  pa.client_id,
  pa.coach_id,
  pa.status,
  ccp.name as program_name,
  pa.created_at
FROM program_assignments pa
JOIN client_created_programs ccp ON pa.client_program_id = ccp.id
ORDER BY pa.created_at DESC
LIMIT 10;

-- Vérifier les programmes dupliqués
SELECT 
  id,
  name,
  source_type,
  program_template_id,
  client_id,
  coach_id,
  created_at
FROM client_created_programs
WHERE source_type = 'coach_assigned'
ORDER BY created_at DESC
LIMIT 10;
```

## En cas de problème

### Rollback de la migration

Si un problème survient après la migration, exécuter :

```sql
SELECT rollback_rename_client_tables();
```

Cette fonction renommera les tables à leur nom original :
- `client_created_programs` → `client_programs`
- `client_created_sessions` → `client_sessions`
- `client_created_session_exercises` → `client_session_exercises`

### Problèmes potentiels et solutions

#### Problème 1 : Les politiques RLS ne fonctionnent pas

**Symptôme** : Erreur "permission denied" lors de l'assignation

**Solution** :
```sql
-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'client_created_programs';

-- Si aucune politique n'existe, les recréer
CREATE POLICY "Clients can view their own programs" 
  ON client_created_programs 
  FOR SELECT 
  USING (client_id = auth.uid());

CREATE POLICY "Coaches can view their clients' programs" 
  ON client_created_programs 
  FOR SELECT 
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert programs for their clients" 
  ON client_created_programs 
  FOR INSERT 
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Clients can insert their own created programs" 
  ON client_created_programs 
  FOR INSERT 
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their own created programs" 
  ON client_created_programs 
  FOR UPDATE 
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Coaches can update their clients' programs" 
  ON client_created_programs 
  FOR UPDATE 
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Clients can delete their own created programs" 
  ON client_created_programs 
  FOR DELETE 
  USING (client_id = auth.uid());

CREATE POLICY "Coaches can delete their clients' programs" 
  ON client_created_programs 
  FOR DELETE 
  USING (coach_id = auth.uid());
```

#### Problème 2 : La fonction RPC échoue toujours

**Symptôme** : L'assignation échoue avec une erreur SQL

**Diagnostic** :
```sql
-- Tester la fonction RPC manuellement
SELECT assign_program_to_client_atomic(
  '<program_id>'::uuid,
  '<client_id>'::uuid,
  '<coach_id>'::uuid,
  CURRENT_DATE
);
```

**Solution** : Vérifier les logs d'erreur et s'assurer que :
- Le programme template existe
- Le client est bien rattaché au coach
- Les permissions sont correctes

#### Problème 3 : Les contraintes FK sont cassées

**Symptôme** : Erreur "foreign key constraint" lors de l'insertion

**Diagnostic** :
```sql
-- Vérifier les contraintes FK
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('client_created_programs', 'client_created_sessions', 'client_created_session_exercises');
```

**Solution** : Recréer les contraintes FK si nécessaire

## Vérifications post-déploiement

### Checklist de validation

- [ ] La sauvegarde de la base de données a été effectuée
- [ ] La migration a été appliquée avec succès
- [ ] Tous les tests de validation sont passés (✓)
- [ ] L'assignation d'un programme fonctionne côté coach
- [ ] Le programme assigné apparaît côté client
- [ ] Le client peut modifier son instance du programme
- [ ] Les données existantes sont préservées
- [ ] Aucune erreur dans les logs de l'application
- [ ] Aucune erreur dans les logs Supabase

### Monitoring post-déploiement

Surveiller pendant 24-48h :
1. Les logs d'erreur de l'application
2. Les logs Supabase (Database → Logs)
3. Les retours utilisateurs
4. Les métriques d'utilisation de la fonctionnalité d'assignation

## Contact et support

En cas de problème non résolu :
1. Consulter les logs détaillés
2. Vérifier le diagnostic dans `diagnostic_probleme.md`
3. Exécuter le rollback si nécessaire
4. Contacter l'équipe de développement avec :
   - Les logs d'erreur
   - Les résultats des tests de validation
   - Les étapes effectuées avant le problème

## Fichiers de référence

- `supabase/migrations/20251118_rename_client_tables.sql` : Migration de renommage
- `test_migration.sql` : Script de validation
- `diagnostic_probleme.md` : Analyse détaillée du problème
- `guide_correction.md` : Ce guide

## Notes importantes

⚠️ **Cette migration est critique** car elle corrige un problème qui empêche complètement l'assignation de programmes.

✅ **La migration est sûre** car :
- Elle préserve toutes les données
- Elle inclut une fonction de rollback
- Elle met à jour automatiquement toutes les références
- Elle a été testée avec un script de validation

🔄 **Après la migration** :
- Le code existant fonctionnera sans modification
- Les migrations futures s'appliqueront correctement
- Le système d'assignation sera pleinement opérationnel
