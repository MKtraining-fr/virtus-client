# Guide de Mise à Jour de la Base de Données Supabase

## ⚠️ IMPORTANT - Action Requise

Avant de déployer les modifications du code, vous devez **obligatoirement** exécuter le script SQL dans Supabase pour ajouter les colonnes manquantes à la table `clients`.

---

## 📋 Étapes à Suivre

### Étape 1 : Se Connecter à Supabase

1. Ouvrez votre navigateur
2. Allez sur https://supabase.com/dashboard
3. Connectez-vous avec votre compte
4. Sélectionnez le projet **virtus** (ID: `dqsbfnsicmzovlrhuoif`)

---

### Étape 2 : Ouvrir le SQL Editor

1. Dans le menu de gauche, cliquez sur **"SQL Editor"**
2. Cliquez sur **"New query"** pour créer une nouvelle requête

---

### Étape 3 : Copier et Exécuter le Script SQL

1. Ouvrez le fichier `add-client-profile-columns.sql`
2. **Copiez tout le contenu** du fichier
3. **Collez-le** dans l'éditeur SQL de Supabase
4. Cliquez sur **"Run"** (ou appuyez sur Ctrl+Enter)

---

### Étape 4 : Vérifier le Résultat

Vous devriez voir un message de confirmation :
```
✅ Colonnes ajoutées avec succès à la table clients!
```

Si vous voyez des erreurs, vérifiez :
- Que vous êtes bien connecté au bon projet
- Que vous avez les permissions d'administration
- Que le script a été copié en entier

---

## 📊 Colonnes Ajoutées

Le script ajoute les colonnes suivantes à la table `clients` :

### Informations Générales
- `dob` (DATE) - Date de naissance
- `age` (INTEGER) - Âge calculé
- `sex` (TEXT) - Sexe (Homme, Femme, Autre)
- `height` (NUMERIC) - Taille en cm
- `weight` (NUMERIC) - Poids en kg
- `address` (TEXT) - Adresse
- `energy_expenditure_level` (TEXT) - Niveau d'activité physique

### Objectifs et Notes
- `objective` (TEXT) - Objectif principal
- `notes` (TEXT) - Notes du coach
- `status` (TEXT) - Statut du client (active, prospect, inactive)

### Données Complexes (JSON)
- `lifestyle` (JSONB) - Mode de vie (profession, etc.)
- `medical_info` (JSONB) - Informations médicales
- `nutrition` (JSONB) - Données nutritionnelles
- `bilans` (JSONB) - Historique des bilans complétés
- `assigned_bilans` (JSONB) - Bilans assignés en attente
- `nutrition_logs` (JSONB) - Logs nutritionnels
- `performance_logs` (JSONB) - Logs de performance
- `assigned_nutrition_plans` (JSONB) - Plans nutritionnels assignés

---

## 🔍 Vérification Post-Exécution

Pour vérifier que les colonnes ont bien été ajoutées, exécutez cette requête dans le SQL Editor :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;
```

Vous devriez voir toutes les nouvelles colonnes listées.

---

## 🚀 Après l'Exécution du Script

Une fois le script SQL exécuté avec succès :

1. ✅ Les colonnes sont ajoutées à la table `clients`
2. ✅ Les index sont créés pour améliorer les performances
3. ✅ Les contraintes de validation sont en place
4. ✅ Vous pouvez déployer le code mis à jour

**Le code a déjà été mis à jour et poussé sur GitHub. Le déploiement Netlify se fera automatiquement.**

---

## ⚠️ Que Se Passe-t-il Si Je N'Exécute Pas le Script ?

Si vous ne exécutez pas le script SQL :
- ❌ Les données du bilan initial ne seront pas enregistrées dans le profil client
- ❌ Les informations ne s'afficheront pas dans le profil
- ❌ Les bilans ne seront pas sauvegardés
- ❌ L'application affichera des erreurs dans la console

**C'est pourquoi cette étape est OBLIGATOIRE !**

---

## 📞 Besoin d'Aide ?

Si vous rencontrez des problèmes :

1. Vérifiez que vous avez les droits d'administration sur le projet Supabase
2. Vérifiez que le script SQL est complet (pas de coupure)
3. Regardez les messages d'erreur dans le SQL Editor
4. Contactez le support Supabase si nécessaire

---

## ✅ Checklist

- [ ] Je me suis connecté à Supabase
- [ ] J'ai ouvert le SQL Editor
- [ ] J'ai copié le contenu de `add-client-profile-columns.sql`
- [ ] J'ai exécuté le script
- [ ] J'ai vu le message de confirmation
- [ ] J'ai vérifié que les colonnes sont présentes
- [ ] Je peux maintenant tester l'application

---

**Date de création :** 5 octobre 2025  
**Version :** 1.0
