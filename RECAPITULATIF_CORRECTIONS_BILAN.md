# Récapitulatif des Corrections du Bilan Initial

**Date :** 5 octobre 2025  
**Commits :** `b5f131e`, `744b67f`, `b88093b`, `0102fef`  
**Statut :** ✅ Code déployé, ⚠️ Script SQL à exécuter

---

## 🎯 Problèmes Identifiés et Corrigés

### 1. ❌ Nom et Prénom Incorrects dans le Tableau de Bord

**Cause :** Mapping incorrect des IDs de champs
- Le code utilisait `answers.firstName` au lieu de `answers.prenom`
- Le code utilisait `answers.lastName` au lieu de `answers.nom`

**Solution :** ✅ Correction du mapping dans `NewBilan.tsx`

---

### 2. ❌ Aucune Information du Bilan dans le Profil Client

**Cause :** La table `clients` de Supabase ne contenait que les champs de base (email, nom, prénom, téléphone)

**Solution :** 
- ✅ Ajout de colonnes à la table `clients` (script SQL fourni)
- ✅ Mise à jour des fonctions de mapping dans `typeMappers.ts`
- ✅ Mise à jour de la structure dans `database.ts`

---

### 3. ❌ Le Bilan Initial N'Apparaît Pas dans "Mes Bilans"

**Cause :** Les bilans n'étaient pas enregistrés dans la base de données

**Solution :** ✅ Les bilans sont maintenant stockés dans la colonne `bilans` (JSONB) de la table `clients`

---

### 4. ❌ Section "Notes et Médical" Manquante

**Cause :** Cette section n'existait pas dans le template du bilan initial

**Solution :** ✅ Ajout de la section avec 2 champs :
- Antécédents médicaux
- Notes du coach

---

### 5. ❌ Champ "Poids Souhaité" Non Désiré

**Solution :** ✅ Suppression du champ de la section "Objectif"

---

### 6. ❌ Thème Sombre par Défaut

**Solution :** ✅ Changement du thème par défaut en mode clair

---

## 📋 Modifications Détaillées

### Fichier 1 : `src/pages/NewBilan.tsx`

**Corrections apportées :**

1. **Mapping des IDs de champs corrigé :**
   - `answers.prenom` au lieu de `answers.firstName`
   - `answers.nom` au lieu de `answers.lastName`
   - `answers.date_naissance` au lieu de `answers.dob`
   - `answers.sexe` au lieu de `answers.sex`
   - `answers.taille` au lieu de `answers.height`
   - `answers.poids` au lieu de `answers.weight`
   - `answers.telephone` au lieu de `answers.phone`
   - `answers.activite_physique` au lieu de `answers.energyExpenditureLevel`
   - `answers.objectif_principal` au lieu de `answers.objective`
   - `answers.profession` au lieu de `answers.lifestyle.profession`
   - `answers.allergies` (checkbox array)
   - `answers.allergies_autre` (champ conditionnel)
   - `answers.aversions` au lieu de `answers.foodAversions`
   - `answers.habitudes` au lieu de `answers.generalHabits`
   - `answers.antecedents_medicaux` (nouveau)
   - `answers.notes_coach` (nouveau)

2. **Mapping du niveau d'activité physique :**
   ```typescript
   const activityLevelMap: Record<string, Client['energyExpenditureLevel']> = {
     'Sédentaire': 'sedentary',
     'Légèrement actif': 'lightly_active',
     'Modérément actif': 'moderately_active',
     'Très actif': 'very_active',
     'Extrêmement actif': 'extremely_active'
   };
   ```

3. **Combinaison des allergies et aversions :**
   ```typescript
   let combinedAllergiesAndAversions = '';
   if (allergiesList.length > 0) {
     combinedAllergiesAndAversions += 'Allergies: ' + allergiesList.join(', ');
     if (allergiesAutre) {
       combinedAllergiesAndAversions += ', ' + allergiesAutre;
     }
   }
   if (aversions) {
     if (combinedAllergiesAndAversions) combinedAllergiesAndAversions += '\n';
     combinedAllergiesAndAversions += 'Aversions: ' + aversions;
   }
   ```

4. **Enregistrement complet du bilan :**
   ```typescript
   bilans: [{
     id: `bilan-${Date.now()}`,
     templateId: selectedTemplateId,
     templateName: selectedTemplate?.name || 'Bilan Initial',
     status: 'completed',
     assignedAt: new Date().toISOString(),
     completedAt: new Date().toISOString(),
     answers: answers
   }]
   ```

---

### Fichier 2 : `src/types/database.ts`

**Ajout des colonnes à la structure de la table `clients` :**

```typescript
clients: {
  Row: {
    // Champs existants
    id: string
    email: string
    first_name: string
    last_name: string
    phone: string | null
    role: 'admin' | 'coach' | 'client'
    coach_id: string | null
    created_at: string
    updated_at: string
    
    // NOUVEAUX CHAMPS
    dob: string | null
    age: number | null
    sex: string | null
    height: number | null
    weight: number | null
    address: string | null
    energy_expenditure_level: string | null
    objective: string | null
    notes: string | null
    status: string | null
    lifestyle: Json | null
    medical_info: Json | null
    nutrition: Json | null
    bilans: Json | null
    assigned_bilans: Json | null
    nutrition_logs: Json | null
    performance_logs: Json | null
    assigned_nutrition_plans: Json | null
  }
}
```

---

### Fichier 3 : `src/services/typeMappers.ts`

**Mise à jour de `mapSupabaseClientToClient` :**

Maintenant, la fonction mappe TOUS les champs de la base de données vers le type `Client` de l'application, incluant :
- Informations générales (dob, age, sex, height, weight, etc.)
- Données JSON (lifestyle, medicalInfo, nutrition, bilans, etc.)

**Mise à jour de `mapClientToSupabaseClient` :**

Maintenant, la fonction mappe TOUS les champs du type `Client` vers la structure Supabase, permettant l'enregistrement complet du profil.

---

### Fichier 4 : `src/context/AuthContext.tsx`

**Mise à jour de la fonction `addUser` :**

```typescript
// Préparer toutes les données du profil client pour la mise à jour
const updateData = mapClientToSupabaseClient({
  ...userData,
  id: authUser.id,
  coachId: user?.id,
});

// Mettre à jour le profil complet dans la table clients
const { error: updateError } = await supabase
  .from('clients')
  .update(updateData)
  .eq('id', authUser.id);
```

Maintenant, **toutes** les données du bilan sont enregistrées dans la base de données, pas seulement les champs de base.

---

### Fichier 5 : Template Bilan Initial (Supabase)

**Ajout de la section "Notes et Médical" :**

```json
{
  "id": "notes_medical",
  "title": "Notes et Médical",
  "isRemovable": false,
  "fields": [
    {
      "id": "antecedents_medicaux",
      "type": "textarea",
      "label": "Antécédents médicaux",
      "placeholder": "Maladies, opérations, traitements en cours..."
    },
    {
      "id": "notes_coach",
      "type": "textarea",
      "label": "Notes du coach",
      "placeholder": "Observations, remarques particulières..."
    }
  ]
}
```

---

## 🗄️ Structure de la Base de Données

### Colonnes Ajoutées à la Table `clients`

| Colonne | Type | Description |
|---------|------|-------------|
| `dob` | DATE | Date de naissance |
| `age` | INTEGER | Âge calculé |
| `sex` | TEXT | Sexe (Homme, Femme, Autre) |
| `height` | NUMERIC | Taille en cm |
| `weight` | NUMERIC | Poids en kg |
| `address` | TEXT | Adresse |
| `energy_expenditure_level` | TEXT | Niveau d'activité physique |
| `objective` | TEXT | Objectif principal |
| `notes` | TEXT | Notes du coach |
| `status` | TEXT | Statut (active, prospect, inactive) |
| `lifestyle` | JSONB | Mode de vie (profession, etc.) |
| `medical_info` | JSONB | Informations médicales |
| `nutrition` | JSONB | Données nutritionnelles |
| `bilans` | JSONB | Historique des bilans |
| `assigned_bilans` | JSONB | Bilans assignés |
| `nutrition_logs` | JSONB | Logs nutritionnels |
| `performance_logs` | JSONB | Logs de performance |
| `assigned_nutrition_plans` | JSONB | Plans nutritionnels |

---

## 📊 Mapping des Données

### Section "Informations Générales" → Profil Client

| Champ Bilan | ID | Champ Profil | Colonne DB |
|-------------|-----|--------------|------------|
| Prénom | `prenom` | `firstName` | `first_name` |
| Nom | `nom` | `lastName` | `last_name` |
| Date de naissance | `date_naissance` | `dob` | `dob` |
| Sexe | `sexe` | `sex` | `sex` |
| Taille (cm) | `taille` | `height` | `height` |
| Poids actuel (kg) | `poids` | `weight` | `weight` |
| Email | `email` | `email` | `email` |
| Téléphone | `telephone` | `phone` | `phone` |
| Niveau d'activité physique | `activite_physique` | `energyExpenditureLevel` | `energy_expenditure_level` |

### Section "Objectif" → Profil Client

| Champ Bilan | ID | Champ Profil | Colonne DB |
|-------------|-----|--------------|------------|
| Objectif principal | `objectif_principal` | `objective` | `objective` |
| Délai souhaité | `delai` | - | (dans bilans) |

### Section "Vie Quotidienne" → Profil Client

| Champ Bilan | ID | Champ Profil | Colonne DB |
|-------------|-----|--------------|------------|
| Profession | `profession` | `lifestyle.profession` | `lifestyle` (JSON) |

### Section "Alimentation" → Profil Client

| Champ Bilan | ID | Champ Profil | Colonne DB |
|-------------|-----|--------------|------------|
| Allergies alimentaires | `allergies` | `medicalInfo.allergies` | `medical_info` (JSON) |
| Précisez autre allergie | `allergies_autre` | `medicalInfo.allergies` | `medical_info` (JSON) |
| Aliments que vous n'aimez pas | `aversions` | `nutrition.foodAversions` | `nutrition` (JSON) |
| Habitudes alimentaires | `habitudes` | `nutrition.generalHabits` | `nutrition` (JSON) |

**Note :** Les allergies et aversions sont combinées dans `nutrition.foodAversions` :
```
Allergies: Œufs, Lait et produits laitiers, Kiwi
Aversions: Brocoli, Épinards
```

### Section "Notes et Médical" → Profil Client

| Champ Bilan | ID | Champ Profil | Colonne DB |
|-------------|-----|--------------|------------|
| Antécédents médicaux | `antecedents_medicaux` | `medicalInfo.history` | `medical_info` (JSON) |
| Notes du coach | `notes_coach` | `notes` | `notes` |

### Bilan Complet → Profil Client

Le bilan complet (toutes les réponses) est enregistré dans :
- **Champ Profil :** `bilans` (array)
- **Colonne DB :** `bilans` (JSONB)

Structure :
```json
[
  {
    "id": "bilan-1728123456789",
    "templateId": "cefbfd36-aa7f-401d-8231-403a858238ab",
    "templateName": "Bilan Initial",
    "status": "completed",
    "assignedAt": "2025-10-05T20:00:00.000Z",
    "completedAt": "2025-10-05T20:05:00.000Z",
    "answers": {
      "prenom": "Jean",
      "nom": "Dupont",
      "date_naissance": "1990-01-15",
      "sexe": "Homme",
      ...
    }
  }
]
```

---

## ⚠️ ACTION REQUISE AVANT DE TESTER

### Exécuter le Script SQL dans Supabase

**IMPORTANT :** Avant de tester l'application, vous devez **obligatoirement** exécuter le script SQL pour ajouter les colonnes à la table `clients`.

**Étapes :**

1. Connectez-vous à https://supabase.com/dashboard
2. Ouvrez le projet `virtus` (ID: `dqsbfnsicmzovlrhuoif`)
3. Allez dans **"SQL Editor"**
4. Cliquez sur **"New query"**
5. Copiez le contenu du fichier `add-client-profile-columns.sql`
6. Collez-le dans l'éditeur
7. Cliquez sur **"Run"** (ou Ctrl+Enter)
8. Vérifiez le message de confirmation

**Fichier à exécuter :** `add-client-profile-columns.sql`

**Guide détaillé :** Voir `GUIDE_MISE_A_JOUR_SUPABASE.md`

---

## 🧪 Tests à Effectuer

Une fois le script SQL exécuté et le déploiement Netlify terminé :

### Test 1 : Création d'un Nouveau Client via Bilan Initial

1. Se connecter en tant que coach
2. Aller dans "Nouveau Bilan"
3. Remplir le bilan initial avec toutes les sections
4. Cocher quelques allergies (incluant "Autre")
5. Remplir les antécédents médicaux et notes du coach
6. Cliquer sur "Valider le Bilan"
7. ✅ **Vérifier** : Le client est créé avec succès
8. ✅ **Vérifier** : Un email d'invitation est envoyé

### Test 2 : Vérifier les Informations dans le Profil Client

1. Aller dans "Mes Clients"
2. Cliquer sur le client nouvellement créé
3. ✅ **Vérifier** : Le nom et prénom sont corrects
4. ✅ **Vérifier** : Toutes les informations générales sont présentes
5. ✅ **Vérifier** : L'objectif est affiché
6. ✅ **Vérifier** : La profession est affichée

### Test 3 : Vérifier la Section "Mes Bilans"

1. Dans le profil client, ouvrir la section "Mes bilans"
2. ✅ **Vérifier** : Le bilan initial apparaît dans la liste
3. ✅ **Vérifier** : Le statut est "Complété"
4. ✅ **Vérifier** : La date est correcte
5. Cliquer sur "Consulter"
6. ✅ **Vérifier** : Toutes les réponses du bilan sont affichées

### Test 4 : Vérifier la Section "Notes et Médical"

1. Dans le profil client, ouvrir la section "Notes et Médical"
2. ✅ **Vérifier** : Les antécédents médicaux sont affichés
3. ✅ **Vérifier** : Les notes du coach sont affichées
4. ✅ **Vérifier** : Les allergies sont listées

### Test 5 : Vérifier la Section "Suivi Nutritionnel"

1. Dans le profil client, ouvrir la section "Suivi Nutritionnel"
2. ✅ **Vérifier** : Le champ "Aversions et allergies" contient :
   - Les allergies cochées
   - Les aliments non aimés
3. ✅ **Vérifier** : Les habitudes alimentaires sont affichées

---

## 📦 Commits et Déploiement

### Commits Effectués

1. **`b5f131e`** - Amélioration du template Bilan Initial avec allergènes structurés
2. **`744b67f`** - Correction du flux de création de compte et suppression du champ "Poids souhaité"
3. **`b88093b`** - Correction du thème par défaut (light au lieu de dark)
4. **`0102fef`** - Correction complète du mapping des données du bilan initial

### Statut du Déploiement

- ✅ Code poussé sur GitHub
- 🔄 Déploiement automatique sur Netlify en cours (2-3 minutes)
- ⚠️ Script SQL à exécuter manuellement dans Supabase

---

## ✅ Résumé des Corrections

| Problème | Statut | Solution |
|----------|--------|----------|
| Nom et prénom incorrects | ✅ Corrigé | Mapping des IDs de champs corrigé |
| Aucune info du bilan dans le profil | ✅ Corrigé | Colonnes ajoutées + mapping complet |
| Bilan n'apparaît pas dans "Mes bilans" | ✅ Corrigé | Bilans enregistrés dans colonne JSONB |
| Section "Notes et Médical" manquante | ✅ Ajoutée | 2 champs ajoutés au template |
| Champ "Poids souhaité" non désiré | ✅ Supprimé | Retiré de la section Objectif |
| Thème sombre par défaut | ✅ Corrigé | Thème clair par défaut |
| Allergies non mappées | ✅ Corrigé | Combinées avec aversions |
| Niveau d'activité non mappé | ✅ Corrigé | Mapping vers energyExpenditureLevel |

---

## 🎉 Conclusion

Toutes les corrections ont été apportées au code. Le système est maintenant capable de :

1. ✅ Créer un client via le bilan initial
2. ✅ Enregistrer toutes les informations du bilan dans le profil
3. ✅ Afficher les informations correctement dans le profil client
4. ✅ Enregistrer et afficher l'historique des bilans
5. ✅ Mapper correctement toutes les données (nom, prénom, allergies, etc.)
6. ✅ Envoyer un email d'invitation au client
7. ✅ Permettre au client de définir son mot de passe

**Prochaine étape :** Exécuter le script SQL dans Supabase, puis tester l'application ! 🚀

---

**Auteur :** Manus AI  
**Date de création :** 5 octobre 2025  
**Version :** 1.0
