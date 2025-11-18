# Commandes rapides pour appliquer la correction

## 🚀 Application rapide (pour utilisateurs expérimentés)

### 1. Sauvegarde (OBLIGATOIRE)

```bash
# Via Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# Ou via Dashboard : Database → Backups → Create backup
```

### 2. Vérification de l'état actuel

```sql
-- Vérifier les tables existantes
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'client_%' 
ORDER BY table_name;

-- Compter les données
SELECT 
  (SELECT COUNT(*) FROM client_programs) as programs,
  (SELECT COUNT(*) FROM client_sessions) as sessions,
  (SELECT COUNT(*) FROM client_session_exercises) as exercises;
```

### 3. Application de la migration

```bash
# Option 1 : Via CLI (recommandé)
cd /path/to/virtus
supabase db push

# Option 2 : Manuellement
supabase db execute -f supabase/migrations/20251118_rename_client_tables.sql
```

Ou via Dashboard :
1. SQL Editor
2. Copier le contenu de `supabase/migrations/20251118_rename_client_tables.sql`
3. Exécuter

### 4. Validation

```bash
# Exécuter les tests
supabase db execute -f test_migration.sql
```

Ou via Dashboard :
1. SQL Editor
2. Copier le contenu de `test_migration.sql`
3. Exécuter
4. Vérifier que tous les tests passent (✓)

### 5. Test fonctionnel

1. Se connecter en tant que coach
2. Bibliothèque → Sélectionner un programme → Assigner
3. Sélectionner un client → Valider
4. Vérifier que l'assignation réussit

### 6. En cas de problème : Rollback

```sql
SELECT rollback_rename_client_tables();
```

## 📋 Checklist rapide

- [ ] Sauvegarde effectuée
- [ ] Migration appliquée
- [ ] Tests de validation OK
- [ ] Test fonctionnel OK
- [ ] Pas d'erreur dans les logs

## 🔍 Vérifications post-migration

```sql
-- Vérifier les tables renommées
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('client_created_programs', 'client_created_sessions', 'client_created_session_exercises');

-- Vérifier les politiques RLS
SELECT tablename, policyname FROM pg_policies 
WHERE tablename LIKE 'client_created_%';

-- Vérifier les contraintes FK
SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name LIKE 'client_created_%';

-- Tester la fonction RPC
SELECT assign_program_to_client_atomic(
  '<program_id>'::uuid,
  '<client_id>'::uuid,
  '<coach_id>'::uuid,
  CURRENT_DATE
);
```

## ⚠️ Commandes d'urgence

### Rollback complet

```sql
-- Annuler le renommage
SELECT rollback_rename_client_tables();

-- Vérifier le rollback
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('client_programs', 'client_sessions', 'client_session_exercises');
```

### Restaurer depuis la sauvegarde

```bash
# Via CLI
supabase db restore backup_YYYYMMDD_HHMMSS.sql

# Ou via Dashboard : Database → Backups → Restore
```

## 📊 Monitoring

```sql
-- Surveiller les assignations
SELECT COUNT(*) as total_assignments,
       COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
       COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour
FROM program_assignments;

-- Surveiller les programmes créés
SELECT source_type, COUNT(*) as count
FROM client_created_programs
GROUP BY source_type;

-- Dernières assignations
SELECT pa.id, ccp.name, pa.status, pa.created_at
FROM program_assignments pa
JOIN client_created_programs ccp ON pa.client_program_id = ccp.id
ORDER BY pa.created_at DESC
LIMIT 10;
```

## 🎯 Résultat attendu

Après l'application de la correction :

✅ Les tables sont renommées :
- `client_programs` → `client_created_programs`
- `client_sessions` → `client_created_sessions`
- `client_session_exercises` → `client_created_session_exercises`

✅ L'assignation de programmes fonctionne :
- Le coach peut assigner un programme depuis la bibliothèque
- Le programme est dupliqué dans les tables `client_created_*`
- Un enregistrement est créé dans `program_assignments`
- Le client voit le programme dans son interface

✅ Les données sont préservées :
- Tous les programmes existants sont conservés
- Toutes les séances existantes sont conservées
- Tous les exercices existants sont conservés

✅ Les politiques RLS fonctionnent :
- Les coachs voient uniquement leurs programmes et ceux de leurs clients
- Les clients voient uniquement leurs propres programmes
- Les permissions d'insertion/modification/suppression sont correctes

## 📞 Support

En cas de problème :
1. Consulter `guide_correction.md` pour les détails
2. Consulter `diagnostic_probleme.md` pour l'analyse
3. Exécuter le rollback si nécessaire
4. Contacter l'équipe avec les logs d'erreur
