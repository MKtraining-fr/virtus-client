# Exemples de Fichiers CSV pour Import

Ce dossier contient des exemples de fichiers CSV pour tester la fonctionnalité d'import de données dans l'application Virtus.

---

## 📋 Fichiers Disponibles

### 1. `users_example.csv` - Utilisateurs

**Champs requis** : `firstName`, `lastName`, `email`

**Champs optionnels** : `phone`, `role`, `status`, `sex`, `dob`, `height`, `weight`, `objective`, `notes`, `medicalHistory`, `allergies`, `foodAversions`, `generalHabits`

**Valeurs possibles** :
- `role` : `client`, `coach`, `admin`
- `status` : `active`, `prospect`, `archived`
- `sex` : `Homme`, `Femme`

**Notes importantes** :
- Les utilisateurs avec `status=active` auront un compte Auth créé automatiquement
- Les utilisateurs avec `status=prospect` seront créés sans compte Auth (peuvent être validés plus tard)
- Un email d'invitation sera envoyé aux utilisateurs actifs

**Exemple** :
```csv
firstName,lastName,email,phone,role,status
Jean,Dupont,jean.dupont@example.com,0612345678,client,active
Marie,Martin,marie.martin@example.com,0687654321,client,prospect
```

---

### 2. `exercises_example.csv` - Exercices

**Champs requis** : `name`, `category`

**Champs optionnels** : `description`, `equipment`, `muscleGroups`, `videoUrl`, `illustrationUrl`

**Valeurs possibles pour `category`** :
- `Musculation`
- `Mobilité`
- `Échauffement`
- `Cardio`
- `Gainage`

**Format spécial** :
- `muscleGroups` : Séparer les groupes musculaires par `|` (ex: `Pectoraux|Triceps|Épaules`)
- `equipment` : Séparer les équipements par `|` (ex: `Barre|Banc`)

**Exemple** :
```csv
name,category,description,equipment,muscleGroups
Développé couché,Musculation,Exercice pour les pectoraux,Barre|Banc,Pectoraux|Triceps|Épaules
Squat,Musculation,Exercice pour les jambes,Barre,Quadriceps|Fessiers|Ischio-jambiers
```

---

### 3. `ciqual_example.csv` - Aliments (Base Ciqual)

**Champs requis** : `name`, `category`, `calories`, `protein`, `carbs`, `fat`

**Valeurs possibles pour `category`** :
- `Viandes`
- `Poissons`
- `Féculents`
- `Fruits`
- `Légumes`
- `Œufs`
- `Produits laitiers`
- `Fruits secs`
- `Matières grasses`
- `Céréales`
- `Légumineuses`

**Format des valeurs nutritionnelles** :
- `calories` : kcal pour 100g
- `protein` : grammes pour 100g
- `carbs` : grammes pour 100g
- `fat` : grammes pour 100g

**Exemple** :
```csv
name,category,calories,protein,carbs,fat
Poulet grillé,Viandes,165,31,0,3.6
Riz blanc cuit,Féculents,130,2.7,28,0.3
```

---

## 🚀 Comment Utiliser

### Étape 1 : Préparer votre fichier CSV

1. Téléchargez un des exemples ci-dessus
2. Ouvrez-le avec Excel, Google Sheets ou un éditeur de texte
3. Modifiez les données selon vos besoins
4. Sauvegardez au format CSV (UTF-8)

### Étape 2 : Importer dans l'application

1. Connectez-vous en tant qu'**Admin**
2. Allez dans **"Import de données CSV"**
3. Sélectionnez le type de données à importer
4. Cliquez sur **"📥 Télécharger le template CSV"** pour obtenir un fichier vierge
5. Sélectionnez votre fichier CSV
6. Cliquez sur **"Importer"**

### Étape 3 : Vérifier le résultat

- ✅ **Succès** : Message vert avec le nombre de lignes importées
- ⚠️ **Avertissement** : Message jaune avec les erreurs détaillées
- ❌ **Erreur** : Message rouge avec les raisons de l'échec

---

## ⚠️ Erreurs Courantes

### 1. "En-têtes manquants"

**Cause** : Les colonnes requises ne sont pas présentes dans le CSV

**Solution** : Vérifiez que votre fichier contient toutes les colonnes requises (voir ci-dessus)

### 2. "Format email invalide"

**Cause** : L'email n'est pas au bon format

**Solution** : Utilisez un format valide comme `nom@domaine.com`

### 3. "Email déjà existant"

**Cause** : Un utilisateur avec cet email existe déjà

**Solution** : Utilisez un email unique ou supprimez l'utilisateur existant

### 4. "Exercice déjà existant"

**Cause** : Un exercice avec ce nom existe déjà pour ce coach

**Solution** : Utilisez un nom différent ou supprimez l'exercice existant

### 5. "Aliment déjà existant"

**Cause** : Un aliment avec ce nom existe déjà

**Solution** : Utilisez un nom différent ou supprimez l'aliment existant

---

## 💡 Conseils

### Pour les Utilisateurs

- Utilisez `status=prospect` pour créer des profils sans compte Auth (idéal pour les bilans archivés)
- Utilisez `status=active` pour créer des comptes complets avec accès à l'application
- Laissez les champs optionnels vides si vous n'avez pas l'information

### Pour les Exercices

- Soyez précis dans les descriptions pour aider les clients
- Ajoutez des liens YouTube pour les vidéos de démonstration
- Utilisez des catégories cohérentes pour faciliter la recherche

### Pour les Aliments

- Utilisez les valeurs nutritionnelles pour 100g (standard Ciqual)
- Soyez précis dans les noms pour éviter les doublons
- Utilisez des catégories cohérentes

---

## 📊 Formats Avancés

### Virgules dans les valeurs

Si une valeur contient une virgule, entourez-la de guillemets :

```csv
name,description
"Produit A, Premium","Description avec virgule"
```

### Sauts de ligne dans les valeurs

Si une valeur contient un saut de ligne, entourez-la de guillemets :

```csv
name,description
Produit B,"Description avec
saut de ligne"
```

### Caractères spéciaux

Utilisez l'encodage UTF-8 pour supporter les accents et caractères spéciaux.

---

## 🔧 Dépannage

### Le fichier ne s'importe pas

1. Vérifiez que le fichier est bien au format CSV (pas Excel .xlsx)
2. Vérifiez l'encodage (doit être UTF-8)
3. Vérifiez que les en-têtes correspondent exactement (sensible à la casse)
4. Vérifiez qu'il n'y a pas de lignes vides au début du fichier

### Certaines lignes échouent

- L'import continue même si certaines lignes échouent
- Les 5 premières erreurs sont affichées dans le message
- Consultez les logs pour plus de détails

### Les données n'apparaissent pas

- Rechargez la page (les données sont automatiquement rechargées après import)
- Vérifiez que vous êtes connecté avec le bon compte
- Vérifiez les filtres de recherche

---

## 📞 Support

Pour toute question ou problème, consultez la documentation complète dans `ANALYSE_IMPORT_CSV.md`.

---

**Créé le** : 8 octobre 2025  
**Application** : Virtus
