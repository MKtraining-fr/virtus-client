# Guide : Importer les Templates de Bilans dans Supabase

**Objectif** : Créer la table `bilan_templates` et importer le "Bilan Initial" système

**Temps estimé** : 5 minutes

---

## 📋 Étapes à Suivre

### Étape 1 : Créer la Table `bilan_templates`

1. Aller sur : https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/sql
2. Cliquer sur **"New query"**
3. Ouvrir le fichier `supabase/create_bilan_templates_table.sql`
4. Copier **tout le contenu** du fichier
5. Coller dans le SQL Editor
6. Cliquer sur **"Run"** (ou Ctrl+Enter)

**Résultat attendu** :
```
table_name        | column_name  | data_type
bilan_templates   | id           | uuid
bilan_templates   | name         | text
bilan_templates   | coach_id     | uuid
bilan_templates   | sections     | jsonb
bilan_templates   | created_at   | timestamp with time zone
bilan_templates   | updated_at   | timestamp with time zone
```

✅ Si vous voyez ce résultat, la table est créée !

---

### Étape 2 : Importer le "Bilan Initial"

1. **Rester dans le SQL Editor**
2. Cliquer sur **"New query"** (pour créer une nouvelle requête)
3. Ouvrir le fichier `supabase/insert_initial_bilan_template.sql`
4. Copier **tout le contenu** du fichier
5. Coller dans le SQL Editor
6. Cliquer sur **"Run"** (ou Ctrl+Enter)

**Résultat attendu** :
```
id             | name          | coach_id | created_at
system-default | Bilan Initial | NULL     | 2025-10-05...
```

✅ Si vous voyez ce résultat, le bilan initial est importé !

---

## 🎉 Après l'Import

Une fois les deux scripts exécutés :

1. ✅ La table `bilan_templates` existe dans Supabase
2. ✅ Le "Bilan Initial" système est importé
3. ✅ L'application charge automatiquement les templates depuis Supabase
4. ✅ Le "Bilan Initial" apparaît dans "Nouveau Bilan"

---

## 🧪 Vérification

Pour vérifier que tout fonctionne :

1. Aller sur votre application Netlify
2. Se connecter en tant que coach
3. Aller sur **"Nouveau Bilan"**
4. Vous devriez voir **"Bilan Initial"** dans la liste des templates

---

## 📊 Structure du Bilan Initial

Le bilan initial contient 4 sections :

1. **Informations générales** (non supprimable)
   - Prénom, Nom, Date de naissance, Sexe
   - Adresse, Email, Téléphone
   - Taille, Poids, Niveau de dépense énergétique

2. **Objectif** (non supprimable)
   - Objectif principal (textarea)

3. **Vie quotidienne** (supprimable)
   - Profession

4. **Alimentation** (supprimable)
   - Allergies
   - Aversions alimentaires
   - Habitudes alimentaires générales

---

## 🔧 Modifications Apportées au Code

### Fichiers Modifiés

1. **src/services/typeMappers.ts**
   - Ajout de `mapSupabaseBilanTemplateToTemplate()`
   - Ajout de `mapBilanTemplateToSupabaseTemplate()`

2. **src/context/AuthContext.tsx**
   - Ajout du chargement des `bilan_templates` depuis Supabase
   - Import du mapper `mapSupabaseBilanTemplateToTemplate`

### Fichiers Créés

1. **supabase/create_bilan_templates_table.sql**
   - Création de la table avec politiques RLS
   - Index pour les performances

2. **supabase/insert_initial_bilan_template.sql**
   - Insertion du template "Bilan Initial" système

---

## ❓ En Cas de Problème

### Erreur : "relation bilan_templates does not exist"

❌ La table n'a pas été créée. Exécutez d'abord `create_bilan_templates_table.sql`.

### Erreur : "duplicate key value violates unique constraint"

✅ Le bilan initial existe déjà. C'est normal si vous exécutez le script plusieurs fois.

### Le bilan initial n'apparaît pas dans l'application

1. Vérifiez que le script SQL a bien été exécuté
2. Rafraîchissez la page de l'application (F5)
3. Déconnectez-vous et reconnectez-vous
4. Vérifiez dans Supabase que la ligne existe : `SELECT * FROM bilan_templates;`

---

## 🚀 Prochaines Étapes

Une fois le bilan initial importé, vous pouvez :

1. **Créer vos propres templates** via l'interface coach
2. **Modifier le bilan initial** si nécessaire (directement dans Supabase)
3. **Ajouter d'autres templates système** en créant de nouveaux scripts SQL

---

**Préparé par** : Manus AI  
**Date** : 5 octobre 2025
