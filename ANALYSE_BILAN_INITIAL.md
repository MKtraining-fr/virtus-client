# Analyse du Bilan Initial - Virtus

## 1. Récapitulatif de votre demande

Vous avez modifié le **bilan initial** pour inclure une section **"Objectif et Conditions d'Entraînement"**. Lors de la création d'un nouveau client (Ludo VIALADE), vous avez rempli cette section. Cependant, les données de cette section ne sont pas enregistrées dans la base de données.

**Comportement attendu :**
- Les données du bilan initial doivent être réparties dans différentes sections du profil client
- Aucun "bilan" ne doit apparaître dans "Mes Bilans" car c'est un bilan de création de client
- Toutes les données doivent être accessibles dans le profil client

---

## 2. Fonctionnement actuel du Bilan Initial

### 2.1 Template du Bilan Initial (`src/data/initialBilanTemplate.ts`)

Le template contient **5 sections** :

| Section ID | Titre | Champs |
|------------|-------|--------|
| `civilite` | Informations Civiles | prenom, nom, email, telephone, date_naissance, sexe |
| `physique` | Informations Physiques et Objectifs | taille, poids, activite_physique, objectif_principal |
| `nutrition` | Nutrition et Habitudes | habitudes, allergies, allergies_autre, aversions |
| `training` | **Objectif et Conditions d'Entraînement** | experience_sportive, pratique_musculation_depuis, seances_par_semaine, duree_seances, entrainement_type, problematique |
| `medical` | Antécédents et Notes Coach | antecedents_medicaux, notes_coach |

### 2.2 Processus de création de client (`src/pages/NewBilan.tsx`)

Lors de la soumission du formulaire, la fonction `handleSubmit` :

1. **Récupère les données de civilité** ✅
2. **Récupère les données physiques** ✅
3. **Récupère les données de nutrition** ✅
4. **Récupère les données médicales** ✅
5. **NE RÉCUPÈRE PAS les données d'entraînement** ❌

**PROBLÈME IDENTIFIÉ :** Les champs de la section "Objectif et Conditions d'Entraînement" ne sont PAS mappés dans la fonction `handleSubmit`.

---

## 3. Mapping des données - État actuel vs État attendu

### 3.1 Données ENREGISTRÉES correctement

| Champ du Bilan | Colonne BDD (table `clients`) | Section Profil Client |
|----------------|-------------------------------|----------------------|
| `prenom` | `first_name` | Informations générales |
| `nom` | `last_name` | Informations générales |
| `email` | `email` | Informations générales |
| `telephone` | `phone` | Informations générales |
| `date_naissance` | `dob` | Informations générales |
| `sexe` | `sex` | Informations générales |
| `taille` | `height` | Informations générales |
| `poids` | `weight` | Informations générales |
| `activite_physique` | `energy_expenditure_level` | Informations générales |
| `objectif_principal` | `objective` | Objectif |
| `profession` | `lifestyle.profession` | Vie quotidienne |
| `antecedents_medicaux` | `medical_info.history` | Informations médicales |
| `allergies` | `medical_info.allergies` | Informations médicales |
| `notes_coach` | `notes` | Notes |
| `habitudes` | `nutrition.generalHabits` | Nutrition |
| `aversions` | `nutrition.foodAversions` | Nutrition |

### 3.2 Données NON ENREGISTRÉES (Section Training)

| Champ du Bilan | Colonne BDD attendue | Section Profil attendue |
|----------------|---------------------|------------------------|
| `experience_sportive` | `client_training_info.experience` | Conditions d'entraînement |
| `pratique_musculation_depuis` | `client_training_info.training_since` | Conditions d'entraînement |
| `seances_par_semaine` | `client_training_info.sessions_per_week` | Conditions d'entraînement |
| `duree_seances` | `client_training_info.session_duration` | Conditions d'entraînement |
| `entrainement_type` | `client_training_info.training_type` | Conditions d'entraînement |
| `problematique` | `client_training_info.issues` | Conditions d'entraînement |

---

## 4. Tables de la base de données concernées

### 4.1 Table `clients`
Stocke les informations principales du client (civilité, physique, objectif, nutrition, médical)

### 4.2 Table `client_training_info`
**Structure de la table :**
- `id` (uuid)
- `client_id` (uuid) - Référence vers clients
- `experience` (text) - Expérience sportive
- `training_since` (text) - Pratique musculation depuis
- `sessions_per_week` (integer) - Séances par semaine
- `session_duration` (integer) - Durée des séances
- `training_type` (text) - Type d'entraînement
- `issues` (text) - Problématiques
- `forbidden_movements` (jsonb) - Mouvements interdits
- `created_at`, `updated_at`, `created_by`, `updated_by`

**Cette table est VIDE** - aucune donnée n'y est enregistrée lors de la création d'un client.

### 4.3 Table `bilan_assignments`
Stocke les bilans assignés aux clients (utilisé pour les bilans récurrents, pas pour le bilan initial de création)

---

## 5. Où les données doivent apparaître dans le Profil Client

| Section du Profil | Données à afficher |
|-------------------|-------------------|
| **Informations générales** | Nom, prénom, email, téléphone, date de naissance, sexe, taille, poids, niveau d'activité |
| **Objectif** | Objectif principal |
| **Conditions d'entraînement** | Expérience sportive, pratique musculation depuis, séances/semaine, durée séances, type d'entraînement, problématiques |
| **Nutrition** | Habitudes alimentaires, allergies, aversions |
| **Informations médicales** | Antécédents médicaux, blessures |
| **Notes** | Notes du coach |

---

## 6. Correction nécessaire

Pour corriger ce problème, il faut modifier le fichier `src/pages/NewBilan.tsx` pour :

1. **Récupérer les données de la section training** depuis le formulaire
2. **Insérer ces données** dans la table `client_training_info` après la création du client

Souhaitez-vous que je procède à cette correction ?
