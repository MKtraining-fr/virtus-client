# Mapping des Données du Profil Client

**Date** : 7 octobre 2025  
**Application** : Virtus  
**Objectif** : Documenter le mapping complet des données du bilan initial vers le profil client

---

## 📋 Vue d'ensemble

Ce document décrit comment les données collectées lors du **Bilan Initial** sont mappées vers le **Profil Client** dans l'application Virtus. Le mapping est effectué dans le fichier `src/pages/NewBilan.tsx` lors de la validation d'un bilan.

---

## 🗺️ Mapping des Champs

### 1. Informations Générales (Civilité)

| Champ Bilan Initial | ID du champ | Champ Profil Client | Type | Notes |
|---------------------|-------------|---------------------|------|-------|
| Prénom | `prenom` | `firstName` | string | ✅ Requis |
| Nom | `nom` | `lastName` | string | ✅ Requis |
| Date de naissance | `date_naissance` | `dob` | string (ISO) | Format: YYYY-MM-DD |
| Âge | (calculé) | `age` | number | Calculé depuis date_naissance |
| Sexe | `sexe` | `sex` | 'Homme' \| 'Femme' | |
| Email | `email` | `email` | string | ✅ Requis, unique |
| Téléphone | `telephone` | `phone` | string | |

**Code de mapping** :
```typescript
firstName: answers.prenom,
lastName: answers.nom,
dob: answers.date_naissance,
age: answers.date_naissance 
  ? Math.floor((new Date().getTime() - new Date(answers.date_naissance).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) 
  : 0,
sex: answers.sexe as Client['sex'],
email: answers.email,
phone: answers.telephone,
```

---

### 2. Mesures Corporelles

| Champ Bilan Initial | ID du champ | Champ Profil Client | Type | Notes |
|---------------------|-------------|---------------------|------|-------|
| Taille (cm) | `taille` | `height` | number | En centimètres |
| Poids (kg) | `poids` | `weight` | number | En kilogrammes |
| Activité physique | `activite_physique` | `energyExpenditureLevel` | enum | Mappé via activityLevelMap |

**Mapping des niveaux d'activité** :
```typescript
const activityLevelMap: Record<string, Client['energyExpenditureLevel']> = {
  'Sédentaire': 'sedentary',
  'Légèrement actif': 'lightly_active',
  'Modérément actif': 'moderately_active',
  'Très actif': 'very_active',
  'Extrêmement actif': 'extremely_active'
};
```

**Code de mapping** :
```typescript
height: answers.taille ? Number(answers.taille) : undefined,
weight: answers.poids ? Number(answers.poids) : undefined,
energyExpenditureLevel: activityLevelMap[answers.activite_physique as string] || 'moderately_active',
```

---

### 3. Objectifs

| Champ Bilan Initial | ID du champ | Champ Profil Client | Type | Notes |
|---------------------|-------------|---------------------|------|-------|
| Objectif principal | `objectif_principal` | `objective` | string | Texte libre |

**Code de mapping** :
```typescript
objective: answers.objectif_principal || '',
```

---

### 4. Vie Quotidienne

| Champ Bilan Initial | ID du champ | Champ Profil Client | Type | Notes |
|---------------------|-------------|---------------------|------|-------|
| Profession | `profession` | `lifestyle.profession` | string | Stocké dans l'objet lifestyle |

**Code de mapping** :
```typescript
lifestyle: { 
  profession: answers.profession || '' 
},
```

---

### 5. Informations Médicales

| Champ Bilan Initial | ID du champ | Champ Profil Client | Type | Notes |
|---------------------|-------------|---------------------|------|-------|
| Antécédents médicaux | `antecedents_medicaux` | `medicalInfo.history` | string | Texte libre |
| Allergies (liste) | `allergies` | `medicalInfo.allergies` | string | Combiné avec allergies_autre |
| Allergies (autre) | `allergies_autre` | `medicalInfo.allergies` | string | Ajouté à la liste |

**Code de mapping** :
```typescript
const allergiesList = Array.isArray(answers.allergies) ? answers.allergies : [];
const allergiesAutre = answers.allergies_autre || '';

medicalInfo: { 
  history: answers.antecedents_medicaux || '',
  allergies: allergiesList.length > 0 
    ? allergiesList.join(', ') + (allergiesAutre ? ', ' + allergiesAutre : '') 
    : ''
},
```

---

### 6. Nutrition

| Champ Bilan Initial | ID du champ | Champ Profil Client | Type | Notes |
|---------------------|-------------|---------------------|------|-------|
| Allergies | `allergies` | `nutrition.foodAversions` | string | Combiné avec aversions |
| Allergies (autre) | `allergies_autre` | `nutrition.foodAversions` | string | Ajouté aux allergies |
| Aversions | `aversions` | `nutrition.foodAversions` | string | Combiné avec allergies |
| Habitudes alimentaires | `habitudes` | `nutrition.generalHabits` | string | Texte libre |

**Code de mapping** :
```typescript
const allergiesList = Array.isArray(answers.allergies) ? answers.allergies : [];
const allergiesAutre = answers.allergies_autre || '';
const aversions = answers.aversions || '';

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

nutrition: {
  measurements: {}, 
  weightHistory: [], 
  calorieHistory: [], 
  macros: { protein: 0, carbs: 0, fat: 0 },
  foodAversions: combinedAllergiesAndAversions,
  generalHabits: answers.habitudes || '',
  historyLog: [],
},
```

---

### 7. Notes du Coach

| Champ Bilan Initial | ID du champ | Champ Profil Client | Type | Notes |
|---------------------|-------------|---------------------|------|-------|
| Notes du coach | `notes_coach` | `notes` | string | Texte libre |

**Code de mapping** :
```typescript
notes: answers.notes_coach || '',
```

---

### 8. Historique des Bilans

| Champ Bilan Initial | ID du champ | Champ Profil Client | Type | Notes |
|---------------------|-------------|---------------------|------|-------|
| Toutes les réponses | `answers` | `bilans[].answers` | object | Stocké dans l'historique |

**Code de mapping** :
```typescript
bilans: [{
  id: `bilan-${Date.now()}`,
  templateId: selectedTemplateId,
  templateName: selectedTemplate?.name || 'Bilan Initial',
  status: 'completed',
  assignedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  answers: answers
}],
```

---

## 🔄 Flux de Création de Client

### Scénario 1 : Validation Immédiate (Nouveau Bilan → Client Actif)

1. Le coach remplit le bilan initial dans `/app/bilan/new`
2. Le coach clique sur **"Valider le Bilan"**
3. `handleSubmit('active')` est appelé
4. Les données sont mappées selon le schéma ci-dessus
5. `addUser()` est appelé avec `status: 'active'`
6. Un compte Auth est créé dans Supabase
7. Un profil client est créé dans la table `clients`
8. Un email d'invitation est envoyé au client
9. Le client apparaît dans "Mes Clients"

### Scénario 2 : Archivage puis Validation (Nouveau Bilan → Prospect → Client)

1. Le coach remplit le bilan initial dans `/app/bilan/new`
2. Le coach clique sur **"Archiver"**
3. `handleSubmit('prospect')` est appelé
4. Les données sont mappées avec `status: 'prospect'`
5. Un profil est créé dans la table `clients` (sans compte Auth)
6. Le prospect apparaît dans "Bilans Archivés"
7. Plus tard, le coach valide le bilan dans `/app/bilan/archive`
8. `handleValidateBilan()` est appelé
9. Le statut passe de `prospect` à `active`
10. ⚠️ **PROBLÈME** : Aucun compte Auth n'est créé à cette étape

---

## ⚠️ Problèmes Identifiés

### Problème 1 : Validation de Prospect sans Création de Compte Auth

**Symptôme** : Lorsqu'un prospect est validé depuis "Bilans Archivés", son statut passe à `active` mais aucun compte Auth n'est créé.

**Impact** : Le client ne peut pas se connecter à l'application.

**Fichier concerné** : `src/pages/BilanArchive.tsx`

**Code actuel (INCOMPLET)** :
```typescript
const handleValidateBilan = async (bilanId: string) => {
  try {
    // Mettre à jour le statut dans Supabase
    await updateUser(bilanId, { 
      status: 'active',
      coachId: selectedBilan?.coachId || user?.id 
    });
    
    alert(`Bilan de ${selectedBilan?.firstName} validé. Le prospect est maintenant un client.`);
    closeModal();
    navigate(`/app/client/${bilanId}`);
  } catch (error: any) {
    alert(`Erreur lors de la validation: ${error.message}`);
  }
};
```

**Solution recommandée** :

```typescript
const handleValidateBilan = async (bilanId: string) => {
  try {
    // 1. Récupérer les infos du prospect
    const prospect = allClients.find(c => c.id === bilanId);
    if (!prospect || !prospect.email) {
      throw new Error('Prospect ou email manquant');
    }
    
    // 2. Créer un compte Auth Supabase
    // Générer un mot de passe temporaire sécurisé
    const tempPassword = generateSecurePassword();
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: prospect.email,
      password: tempPassword,
      options: {
        data: {
          first_name: prospect.firstName,
          last_name: prospect.lastName,
          phone: prospect.phone || '',
          role: 'client',
        },
      },
    });
    
    if (authError) throw authError;
    
    // 3. Mettre à jour le profil avec le nouvel ID Auth
    await updateUser(bilanId, { 
      id: authData.user.id, // Nouveau ID Auth
      status: 'active',
      coachId: prospect.coachId || user?.id 
    });
    
    // 4. Envoyer un email d'invitation
    await supabase.auth.resetPasswordForEmail(prospect.email, {
      redirectTo: `${window.location.origin}/set-password`,
    });
    
    alert(`Bilan validé ! Un email d'invitation a été envoyé à ${prospect.email}`);
    closeModal();
    navigate(`/app/client/${authData.user.id}`);
  } catch (error: any) {
    console.error('Erreur lors de la validation:', error);
    alert(`Erreur lors de la validation: ${error.message}`);
  }
};
```

---

## ✅ Vérifications à Effectuer

### Checklist de Mapping

- [x] **Informations générales** : Prénom, nom, email, téléphone mappés
- [x] **Date de naissance** : Mappée et âge calculé automatiquement
- [x] **Mesures corporelles** : Taille, poids, niveau d'activité mappés
- [x] **Objectifs** : Objectif principal mappé
- [x] **Profession** : Mappée dans lifestyle.profession
- [x] **Antécédents médicaux** : Mappés dans medicalInfo.history
- [x] **Allergies** : Combinées et mappées dans medicalInfo.allergies ET nutrition.foodAversions
- [x] **Aversions alimentaires** : Combinées avec allergies dans nutrition.foodAversions
- [x] **Habitudes alimentaires** : Mappées dans nutrition.generalHabits
- [x] **Notes du coach** : Mappées dans notes
- [x] **Historique des bilans** : Toutes les réponses sauvegardées dans bilans[]
- [ ] **Création de compte Auth** : ⚠️ Manquant lors de la validation d'un prospect

### Tests Recommandés

1. **Test 1 : Création directe de client**
   - Remplir un bilan initial
   - Cliquer sur "Valider le Bilan"
   - Vérifier que toutes les données sont présentes dans le profil client
   - Vérifier que l'email d'invitation est envoyé

2. **Test 2 : Archivage puis validation**
   - Remplir un bilan initial
   - Cliquer sur "Archiver"
   - Vérifier que le prospect apparaît dans "Bilans Archivés"
   - Valider le prospect
   - ⚠️ **Vérifier que le compte Auth est créé** (actuellement non implémenté)
   - Vérifier que l'email d'invitation est envoyé

3. **Test 3 : Affichage du profil**
   - Ouvrir le profil d'un client
   - Vérifier que toutes les sections affichent les bonnes données
   - Vérifier les allergies et aversions
   - Vérifier l'historique des bilans

---

## 📊 Schéma de Données

### Structure du Profil Client

```typescript
interface Client {
  // Identité
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dob?: string; // Date de naissance
  age?: number;
  sex?: 'Homme' | 'Femme';
  
  // Mesures
  height?: number; // cm
  weight?: number; // kg
  energyExpenditureLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  
  // Objectifs
  objective?: string;
  
  // Vie quotidienne
  lifestyle?: {
    profession?: string;
  };
  
  // Médical
  medicalInfo?: {
    history?: string; // Antécédents médicaux
    allergies?: string; // Liste des allergies
  };
  
  // Nutrition
  nutrition?: {
    foodAversions?: string; // Allergies + Aversions
    generalHabits?: string; // Habitudes alimentaires
    measurements?: Record<string, Measurement>;
    weightHistory?: Array<{ date: string; weight: number }>;
    calorieHistory?: Array<{ date: string; calories: number }>;
    macros?: { protein: number; carbs: number; fat: number };
    historyLog?: NutritionLogEntry[];
  };
  
  // Notes
  notes?: string;
  
  // Historique des bilans
  bilans?: BilanResult[];
  
  // Métadonnées
  role: 'admin' | 'coach' | 'client';
  status: 'active' | 'archived' | 'prospect';
  coachId?: string;
  registrationDate?: string;
}
```

---

## 🎯 Recommandations

### Court Terme (Urgent)

1. **Corriger la validation de prospect** : Implémenter la création de compte Auth lors de la validation
2. **Tester le mapping complet** : Vérifier que toutes les données sont correctement transférées
3. **Ajouter des logs** : Logger chaque étape du mapping pour faciliter le débogage

### Moyen Terme (Améliorations)

1. **Validation des données** : Ajouter des validations avant le mapping (format email, numéros, etc.)
2. **Gestion des erreurs** : Améliorer les messages d'erreur pour l'utilisateur
3. **Historique des modifications** : Tracer les modifications du profil client
4. **Export des données** : Permettre l'export du profil complet en PDF

### Long Terme (Optimisations)

1. **Mapping automatique** : Créer un système de mapping configurable par template
2. **Validation personnalisée** : Permettre au coach de définir des règles de validation
3. **Synchronisation bidirectionnelle** : Permettre la mise à jour du bilan depuis le profil
4. **Versioning des bilans** : Garder un historique des modifications de chaque bilan

---

## 📝 Conclusion

Le mapping des données du bilan initial vers le profil client est **globalement fonctionnel** mais présente un **problème critique** lors de la validation d'un prospect archivé : aucun compte Auth n'est créé, empêchant le client de se connecter.

**Actions prioritaires** :
1. ✅ Corriger la validation de prospect (ajouter création de compte Auth)
2. ✅ Tester le flux complet de création de client
3. ✅ Vérifier l'envoi des emails d'invitation
4. ✅ Configurer Brevo SMTP dans Supabase

---

**Préparé par** : Manus AI  
**Date** : 7 octobre 2025
