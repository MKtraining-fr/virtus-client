# Guide : Exécuter la Migration SQL dans Supabase

**Objectif** : Ajouter la colonne `status` à la table `clients` dans Supabase

**Temps estimé** : 2 minutes

---

## 📋 Étapes à Suivre

### Étape 1 : Ouvrir le SQL Editor

1. Aller sur : https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/sql
2. Vous verrez l'interface SQL Editor

### Étape 2 : Créer une Nouvelle Requête

1. Cliquer sur le bouton **"New query"** (en haut à droite)
2. Une nouvelle fenêtre d'édition s'ouvre

### Étape 3 : Copier le SQL

1. Ouvrir le fichier `MIGRATION_STATUS_SIMPLE.sql` (dans ce même dossier)
2. Sélectionner **tout le contenu** du fichier
3. Copier (Ctrl+C ou Cmd+C)

### Étape 4 : Coller dans le SQL Editor

1. Retourner dans le SQL Editor de Supabase
2. Coller le SQL dans la zone d'édition (Ctrl+V ou Cmd+V)

### Étape 5 : Exécuter la Migration

1. Cliquer sur le bouton **"Run"** (en bas à droite) ou appuyer sur **Ctrl+Enter**
2. Attendre quelques secondes

### Étape 6 : Vérifier le Résultat

Vous devriez voir un résultat comme :

```
column_name | data_type | column_default | is_nullable
status      | text      | 'active'       | NO
```

✅ Si vous voyez ce résultat, la migration est **réussie** !

---

## 🎉 Après la Migration

Une fois la migration réussie :

1. ✅ La colonne `status` est ajoutée à la table `clients`
2. ✅ Tous les clients existants ont `status = 'active'` par défaut
3. ✅ Les index sont créés pour améliorer les performances
4. ✅ Le trigger `updated_at` est configuré

Vous pouvez maintenant :
- Redéployer l'application sur Netlify (déjà fait automatiquement)
- Tester la création de prospects
- Tester la validation de bilans

---

## ❓ En Cas de Problème

### Erreur : "column already exists"

✅ **C'est normal !** Cela signifie que la colonne existe déjà. Vous pouvez ignorer cette erreur.

### Erreur : "permission denied"

❌ Vous n'avez pas les droits d'administration. Vérifiez que vous êtes connecté avec le bon compte Supabase.

### Erreur : "syntax error"

❌ Vérifiez que vous avez bien copié **tout le contenu** du fichier SQL, y compris les commentaires.

---

## 📞 Besoin d'Aide ?

Si vous rencontrez un problème, envoyez-moi :
1. Une capture d'écran de l'erreur
2. Le message d'erreur exact

Je vous aiderai à résoudre le problème immédiatement.

---

**Préparé par** : Manus AI  
**Date** : 5 octobre 2025
