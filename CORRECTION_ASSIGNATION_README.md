# 🔧 Correction du problème d'assignation de programmes/séances

## 🚨 Problème

Le système d'assignation de programmes/séances par les coachs ne fonctionne pas.

**Cause** : Incohérence entre les noms de tables dans la base de données et le code.

**Impact** : Fonctionnalité critique complètement bloquée.

---

## 📚 Documentation disponible

### Pour commencer rapidement

👉 **[RAPPORT_RESOLUTION_ASSIGNATION.md](./RAPPORT_RESOLUTION_ASSIGNATION.md)**  
📄 Rapport complet avec résumé exécutif, diagnostic et solution

### Pour appliquer la correction

👉 **[commandes_rapides.md](./commandes_rapides.md)**  
⚡ Commandes essentielles pour utilisateurs expérimentés

👉 **[guide_correction.md](./guide_correction.md)**  
📖 Guide détaillé étape par étape avec procédures de rollback

### Pour comprendre le problème

👉 **[diagnostic_probleme.md](./diagnostic_probleme.md)**  
🔍 Analyse technique approfondie du problème

### Fichiers techniques

👉 **[supabase/migrations/20251118_rename_client_tables.sql](./supabase/migrations/20251118_rename_client_tables.sql)**  
🗄️ Migration SQL pour renommer les tables

👉 **[test_migration.sql](./test_migration.sql)**  
✅ Script de validation avec tests automatisés

---

## ⚡ Application rapide

### 1. Sauvegarde (OBLIGATOIRE)

```bash
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Application de la migration

```bash
cd /path/to/virtus
supabase db push
```

Ou via Dashboard : SQL Editor → Exécuter `20251118_rename_client_tables.sql`

### 3. Validation

```bash
supabase db execute -f test_migration.sql
```

### 4. Test fonctionnel

1. Se connecter en tant que coach
2. Bibliothèque → Assigner un programme
3. Vérifier que l'assignation réussit

### 5. En cas de problème

```sql
SELECT rollback_rename_client_tables();
```

---

## 📋 Checklist

- [ ] Lire le rapport de résolution
- [ ] Effectuer une sauvegarde de la base de données
- [ ] Appliquer la migration
- [ ] Exécuter les tests de validation
- [ ] Tester l'assignation d'un programme
- [ ] Vérifier les logs
- [ ] Surveiller pendant 24-48h

---

## 🎯 Résultat attendu

Après la correction :

✅ Les coachs peuvent assigner des programmes depuis la bibliothèque  
✅ Les programmes apparaissent côté client comme "programme en cours"  
✅ Les clients peuvent modifier leur instance sans toucher au template  
✅ Toutes les données existantes sont préservées  

---

## 📞 Support

En cas de problème :

1. Consulter le [guide_correction.md](./guide_correction.md)
2. Exécuter le rollback si nécessaire
3. Restaurer depuis la sauvegarde
4. Contacter l'équipe avec les logs d'erreur

---

## 🔗 Liens rapides

| Document | Usage |
|----------|-------|
| [RAPPORT_RESOLUTION_ASSIGNATION.md](./RAPPORT_RESOLUTION_ASSIGNATION.md) | Vue d'ensemble complète |
| [commandes_rapides.md](./commandes_rapides.md) | Application rapide |
| [guide_correction.md](./guide_correction.md) | Guide détaillé |
| [diagnostic_probleme.md](./diagnostic_probleme.md) | Analyse technique |
| [20251118_rename_client_tables.sql](./supabase/migrations/20251118_rename_client_tables.sql) | Migration SQL |
| [test_migration.sql](./test_migration.sql) | Tests de validation |

---

**Statut** : ✅ Prêt pour déploiement  
**Priorité** : 🔴 CRITIQUE  
**Date** : 18 novembre 2025
