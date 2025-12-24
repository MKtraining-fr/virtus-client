# Base de Connaissance Technique - Projet Virtus

**Auteur:** Manus AI  
**Dernière mise à jour:** 24 décembre 2025  
**Version:** 1.9

---

## 📋 Objectif de ce Document

Ce document constitue le **journal technique central** du projet Virtus. Il sert de référence exhaustive pour comprendre l'architecture, l'historique des interventions, et l'état actuel du système. À chaque nouvelle intervention significative, une nouvelle section sera ajoutée en haut de la partie "Historique des Interventions", permettant de maintenir un contexte complet et à jour pour toutes les futures collaborations.

---

# HISTORIQUE DES INTERVENTIONS

## Intervention #10 - Base de Données Alimentaire Ciqual & Filtres Avancés

**Date:** 24 décembre 2025  
**Type:** Base de Données / Interface / Performance  
**Statut:** ✅ Résolu et déployé

### Contexte

L'objectif était d'intégrer la base de données alimentaire Ciqual pour permettre aux utilisateurs de rechercher des aliments et de suivre leur nutrition. Il fallait également mettre en place un système de filtres avancés pour faciliter la recherche.

### Problèmes Identifiés

| Problème | Cause | Impact |
| :--- | :--- | :--- |
| **Import CSV échoué** | Format du fichier Ciqual incompatible (séparateur, virgules) | Impossible d'importer les aliments |
| **Limite de 1000 aliments** | Limite par défaut de l'API REST de Supabase | Seuls 1000 aliments sur 3484 étaient affichés |
| **Filtres non visibles** | Problème de déploiement/cache | Les filtres n'apparaissaient pas côté client |
| **Tri non pertinent** | Les plats composés apparaissaient avant les aliments bruts | Expérience utilisateur dégradée |

### Pull Requests Réalisées

| PR | Titre | Description |
| :--- | :--- | :--- |
| **#306** | ✨ Enrichissement de la table food_items pour Ciqual | Ajout de 14 colonnes, index optimisés, support Open Food Facts |
| **#307** | ⚡️ Amélioration du tri des résultats de recherche | Priorisation des aliments simples (légumes, fruits) |
| **#308** | ✨ Filtres par catégorie et famille d'aliments | Ajout de filtres dropdown côté coach et client |
| **#309** | 🐛 Correction de la limite de 1000 aliments (tentative 1) | Ajout de `.range(0, 9999)` |
| **#310** | ✨ Classification aliments bruts/autres | Ajout de la colonne `food_type` et filtres associés |
| **#311** | ♻️ Restructuration des filtres | Simplification des filtres (2 niveaux) |
| **#312** | ✨ 3 niveaux de filtres (Type, Catégorie, Famille) | Structure de filtres en cascade |
| **#313** | 🐛 **Correction définitive de la limite de 1000 aliments** | Implémentation d'une pagination côté client |

### Solutions Appliquées

#### 1. Import de la Base Ciqual (PR #306)

- **Migration SQL :** Enrichissement de la table `food_items` avec 14 nouvelles colonnes (sugar, fiber, salt, barcode, nutri_score, etc.).
- **Service d'import CSV :** Auto-détection du format (Ciqual vs Virtus), gestion des virgules françaises, import par lots de 100.
- **Import direct via SQL :** Contournement de l'interface admin pour importer les 3484 aliments.

#### 2. Correction de la Limite de 1000 Aliments (PR #313)

**Fichier:** `src/stores/useDataStore.ts`

- **Cause :** Supabase applique une limite de 1000 lignes par défaut côté serveur, même avec `.range(0, 9999)`.
- **Solution :** Implémentation d'une **pagination côté client** qui charge tous les aliments en plusieurs requêtes de 1000 éléments chacune.

```typescript
// src/stores/useDataStore.ts
const allFoodItems: FoodItem[] = [];
const PAGE_SIZE = 1000;
let page = 0;
let hasMore = true;

while (hasMore) {
  const { data: foodPage } = await supabase
    .from('food_items')
    .select('*')
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  
  if (foodPage && foodPage.length > 0) {
    allFoodItems.push(...(foodPage as FoodItem[]));
    page++;
    hasMore = foodPage.length === PAGE_SIZE;
  } else {
    hasMore = false;
  }
}

set({ foodItems: allFoodItems });
```

#### 3. Filtres Avancés (PR #308, #310, #312)

- **Classification des aliments :** Ajout d'une colonne `food_type` ('brut' ou 'autre') dans la BDD.
- **3 niveaux de filtres en cascade :**
  1. **Type d'aliment :** Tous, Recettes, Repas, 🥬 Aliments bruts, 🍰 Autres aliments
  2. **Catégorie :** Les catégories Ciqual (fruits/légumes, viandes, etc.)
  3. **Famille :** Les sous-catégories dynamiques
- **Interface :** Filtres dropdown côté coach et client, avec mise à jour dynamique des options.

#### 4. Amélioration du Tri (PR #307)

- **Logique de tri :** Les aliments simples (légumes, fruits) sont maintenant affichés avant les plats composés.
- **Pertinence :** Les aliments dont le nom commence par le terme recherché apparaissent en premier.

---

## Intervention #9 - Implémentation des Profils Utilisateurs (Client & Coach)

**Date:** 23 décembre 2025  
**Type:** Profils Utilisateurs / Base de Données / Interface  
**Statut:** ✅ Résolu et déployé

### Contexte

Le projet ne disposait pas de fonctionnalités permettant aux utilisateurs de modifier leurs informations personnelles ou de créer une fiche de présentation. L'objectif était de créer une page "Mon Compte" pour tous les utilisateurs et une fiche de présentation détaillée pour les coachs.

### Problèmes Identifiés

| Problème | Cause | Impact |
| :--- | :--- | :--- |
| **Absence de gestion de profil** | Fonctionnalité non implémentée | Les utilisateurs ne pouvaient pas modifier leurs informations |
| **Fiche coach inexistante** | Fonctionnalité non implémentée | Les coachs ne pouvaient pas se présenter |
| **Erreurs de build** | Imports incorrects dans les nouveaux composants | Déploiement impossible |
| **Remplacement de page** | La page "Mon Compte" remplaçait tout le profil client | Perte de contexte pour l'utilisateur |

### Pull Requests Réalisées

| PR | Titre | Description |
| :--- | :--- | :--- |
| **#305** | ✨ Ajout des profils utilisateurs avec gestion avatar et fiche coach | Implémentation complète des profils, correction des erreurs de build et transformation en modale |

### Solutions Appliquées

#### 1. Création de la table `coach_profiles` (Migration SQL)

**Fichier:** `supabase/migrations/20251223_create_coach_profiles.sql`

- Création de la table `coach_profiles` avec des champs pour la biographie, les spécialités, l'expérience, les certifications, les réseaux sociaux, etc.
- Ajout d'une clé étrangère vers `clients.id`.
- Mise en place de politiques RLS pour que les coachs ne puissent modifier que leur propre profil.
- Création d'un trigger pour mettre à jour `updated_at` automatiquement.

#### 2. Page "Mon Compte" (Modale pour les clients, Onglet pour les coachs)

**Fichiers:** `src/components/AccountSettingsModal.tsx`, `src/pages/coach/Settings.tsx`

- **Pour les clients :**
  - Création d'une modale `AccountSettingsModal` qui s'ouvre depuis la page de profil existante.
  - Permet de modifier nom, prénom, téléphone.
  - Intégration de l'upload d'avatar via Cloudinary (preset `virtus_avatars`).
  - Accès à la modale de changement de mot de passe.
  - Bouton de déconnexion.

- **Pour les coachs :**
  - Création d'une page `Settings.tsx` avec deux onglets :
    - **Mon Compte :** Réutilise le composant `AccountSettings` pour la gestion des informations personnelles et de l'avatar.
    - **Ma Fiche Coach :** Utilise le nouveau composant `CoachProfileEditor.tsx`.

#### 3. Fiche de Présentation Coach

**Fichier:** `src/pages/coach/CoachProfileEditor.tsx`

- Formulaire complet pour que les coachs puissent créer et modifier leur fiche de présentation.
- Gestion des spécialités sous forme de tags.
- Champs pour la biographie, l'expérience, les certifications, et les réseaux sociaux.
- Sauvegarde des informations dans la nouvelle table `coach_profiles`.

#### 4. Corrections et Améliorations

- **Correction des erreurs de build :** Correction de tous les imports incorrects de `supabaseClient`.
- **Transformation en modale :** La page "Mon Compte" a été transformée en modale pour les clients afin de ne pas masquer les autres éléments du profil (bilans, mensurations, etc.).
- **Restauration de `ClientProfile.tsx` :** La page de profil client originale a été restaurée et un bouton a été ajouté pour ouvrir la modale de gestion de compte.

### Schéma de l'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     INTERFACE UTILISATEUR                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CLIENT                          COACH                       │
│  ┌─────────────────┐            ┌──────────────────────┐    │
│  │ Profil          │            │ Paramètres           │    │
│  │ ┌─────────────┐ │            │ ┌──────────────────┐ │    │
│  │ │ Mon Compte  │ │            │ │ Mon Compte       │ │    │
│  │ │ (Modale)    │ │            │ │ (Onglet)         │ │    │
│  │ └─────────────┘ │            │ └──────────────────┘ │    │
│  └─────────────────┘            │ ┌──────────────────┐ │    │
│                                  │ │ Ma Fiche Coach   │ │    │
│                                  │ │ (Onglet)         │ │    │
│                                  │ └──────────────────┘ │    │
│                                  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVICES                             │
├─────────────────────────────────────────────────────────────┤
│  Supabase Client        │  Cloudinary Upload                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BASE DE DONNÉES                         │
├─────────────────────────────────────────────────────────────┤
│  Table: clients                                              │
│  - id, first_name, last_name, phone, avatar, ...            │
│                                                              │
│  Table: coach_profiles                                       │
│  - id (FK → clients.id)                                     │
│  - bio, specialties[], experience_years, certifications[]   │
│  - public_url, instagram_handle, facebook_profile, ...      │
│  - RLS: auth.uid() = id                                     │
└─────────────────────────────────────────────────────────────┘
```

## Intervention #8 - Restauration du Profil Client Côté Coach et Améliorations UX (Décembre 2025)

**Date:** 23 décembre 2025  
**Type:** Interface Coach / Profil Client / UX  
**Statut:** ✅ Résolu et déployé

### Contexte

L'interface du profil client côté coach avait perdu plusieurs sections importantes lors de la connexion au backend Supabase. L'utilisateur a fourni des captures d'écran montrant l'état souhaité (version originale) et demandé la restauration complète des fonctionnalités.

### Problèmes Identifiés

| Problème | Cause | Impact |
| :--- | :--- | :--- |
| **Sections manquantes** | Simplification du code lors de l'intégration backend | Perte de fonctionnalités pour le coach |
| **Permissions non persistantes** | Mapper `mapSupabaseClientToClient` n'extrayait pas les permissions de `lifestyle.access` | Les modifications d'accès ne persistaient pas |
| **Âge statique** | Champ `age` stocké en dur au lieu d'être calculé depuis `dob` | Âge devenant obsolète avec le temps |
| **Notes non affichées** | Créateur de séance utilisait des données statiques | Coach ne voyait pas les vraies notes du client |

### Pull Requests Réalisées

| PR | Titre | Description |
| :--- | :--- | :--- |
| **#301** | Restauration complète du profil client côté coach | Restauration de toutes les sections manquantes + correction persistance permissions |
| **#302** | Calcul automatique de l'âge | Implémentation du calcul dynamique de l'âge à partir de la date de naissance |
| **#303** | Toggle grammes/pourcentages + Améliorations UX | Toggle g/% pour les macros, delta persistant, notes dynamiques dans créateur de séance |

### Solutions Appliquées

#### 1. Restauration des Sections du Profil Client (PR #301)

**Fichier:** `src/pages/ClientProfile.tsx`

Sections restaurées :
- **Données Métaboliques (sidebar)** : BMR, TDEE calculés automatiquement
- **Objectif calorique** : Graphique donut avec répartition P/G/L
- **Ajustement des Macros** : Boutons +/- pour modifier protéines, glucides, lipides
- **Notes et Médical** : Notes du coach + antécédents médicaux
- **Suivi Nutritionnel** : Plans alimentaires, aversions/allergies, historique macros, journal alimentaire
- **Suivi Mensurations & Photos** : Graphique d'évolution, historique des données, photos de suivi
- **Documents** : Liste des documents partagés avec suppression
- **Accès & Permissions** : Toggles Workout Builder, boutiques, formations
- **Suivi du Poids (sidebar)** : Graphique de l'historique du poids

#### 2. Correction de la Persistance des Permissions (PR #301)

**Fichiers:** `src/types.ts`, `src/services/typeMappers.ts`

```typescript
// types.ts - Ajout des propriétés d'accès au type Client
export interface ClientAccessPermissions {
  canUseWorkoutBuilder: boolean;
  shopAccess: { adminShop: boolean; coachShop: boolean };
  grantedFormationIds: string[];
}

// typeMappers.ts - Extraction des permissions depuis lifestyle.access
const lifestyleData = row.lifestyle as { access?: ClientAccessPermissions } | null;
const accessData = lifestyleData?.access;

return {
  // ... autres propriétés
  canUseWorkoutBuilder: accessData?.canUseWorkoutBuilder ?? true,
  shopAccess: accessData?.shopAccess ?? { adminShop: true, coachShop: true },
  grantedFormationIds: accessData?.grantedFormationIds ?? [],
};
```

#### 3. Calcul Automatique de l'Âge (PR #302)

**Fichier:** `src/services/typeMappers.ts`

```typescript
// Fonction de calcul de l'âge à partir de la date de naissance
const calculateAgeFromDob = (dob: string | null | undefined): number | undefined => {
  if (!dob) return undefined;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return undefined;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Utilisation dans le mapper
age: calculateAgeFromDob(row.dob) ?? (row.age as number | undefined),
```

#### 4. Toggle Grammes/Pourcentages pour les Macros (PR #303)

**Fichier:** `src/pages/ClientProfile.tsx`

- Ajout d'un état `macroDisplayMode` ('g' ou '%') pour basculer l'affichage.
- Conservation des macros de référence (TDEE) dans `originMacros` pour calculer les pourcentages.
- Les ajustements +/- modifient les macros en grammes, et les pourcentages sont recalculés dynamiquement.

#### 5. Notes Dynamiques dans le Créateur de Séance (PR #303)

**Fichier:** `src/pages/coach/WorkoutBuilder.tsx`

- La section "Dernière note du coach" affiche maintenant dynamiquement `clientData.notes` via une fonction `getLatestNote()`.
- La section "Informations Médicales" affiche `clientData.medicalInfo.history` et `clientData.medicalInfo.allergies`.

---

## Intervention #7 - Système de Bilans Personnalisés et Récurrents (Décembre 2025)

**Date:** 22 décembre 2025  
**Type:** Nouvelle Fonctionnalité / Base de Données / Interface  
**Statut:** ✅ Résolu et déployé

### Contexte

Le système de bilans était statique et ne permettait pas aux coachs de créer des questionnaires personnalisés ni de les assigner de manière récurrente. L'objectif était de construire un système complet de gestion de bilans.

### Problèmes Identifiés

| Problème | Cause | Impact |
| :--- | :--- | :--- |
| **Bilans statiques** | Pas de système de templates | Coachs ne pouvaient pas personnaliser les questionnaires |
| **Pas de récurrence** | Fonctionnalité non implémentée | Assignations manuelles répétitives |
| **Risque de concurrence** | Opérations non atomiques | Risque de données incohérentes |
| **Perte d'historique** | Modification d'un template affectait les anciens bilans | Pas de traçabilité des questionnaires |

### Pull Requests Réalisées

| PR | Titre | Description |
| :--- | :--- | :--- |
| **#293** | ✨ Système de bilans personnalisés et récurrents | Création des tables, fonctions SQL, et interface complète |
| **#294** | 🧪 Ajout de 13 tests automatisés pour les bilans | Couverture de test pour la logique de création, assignation, complétion, et récurrence |
| **#295** | 🐛 Correction du bilan initial et de la suppression en cascade | Correction de bugs critiques post-déploiement |

### Solutions Appliquées

#### 1. Architecture de la Base de Données (PR #293)

**Tables:**
- `bilan_templates` : Stocke les modèles de questionnaires créés par les coachs (sections, questions, types de champs)
- `bilan_assignments` : Gère les assignations de templates aux clients (statut, récurrence, snapshot du template)

**Fonctions SQL (Transactions Atomiques):**
- `assign_bilan_atomic` : Assigne un bilan à un ou plusieurs clients en une seule transaction
- `complete_bilan_atomic` : Marque un bilan comme complété et crée la prochaine assignation si récurrente
- `validate_initial_bilan` : Valide le bilan initial et met à jour le profil du client

#### 2. Interface de Gestion des Bilans (PR #293)

**Fichiers:**
- `src/pages/coach/BilanTemplates.tsx` - Création/modification des templates
- `src/components/AssignBilanModal.tsx` - Assignation aux clients
- `src/pages/client/BilanList.tsx` - Liste des bilans à remplir côté client
- `src/components/ClientBilanHistory.tsx` - Historique des bilans côté coach

**Logique:**

1. **Création de templates** - Le coach crée des questionnaires personnalisés avec 8 types de champs (texte, nombre, date, liste, checkbox, oui/non, échelle, fichier)
2. **Assignation récurrente** - Le coach assigne un template à un ou plusieurs clients avec une fréquence (once, weekly, biweekly, monthly)
3. **Snapshot du template** - Lors de l'assignation, le template est copié dans `data.template_snapshot` pour préserver l'historique
4. **Complétion côté client** - Le client remplit le formulaire, les réponses sont enregistrées dans `data.answers`
5. **Récurrence automatique** - Si fréquence active, une nouvelle assignation est créée automatiquement après complétion
6. **Visualisation des réponses** - Le coach peut consulter toutes les réponses dans l'historique du client
7. **Badge d'assignation** - Chaque template affiche le nombre de clients avec assignations actives
8. **Suppression en cascade** - La suppression d'un template supprime automatiquement toutes ses assignations

**Transactions atomiques:**
- `assign_bilan_atomic` - Garantit la cohérence lors de l'assignation
- `complete_bilan_atomic` - Garantit la cohérence lors de la complétion et gère la récurrence
- `validate_initial_bilan` - Valide le bilan initial et met à jour le profil client

## Tests Automatisés

**Framework:** Vitest 3.2.4

**Avant (Intervention #1 - PR #292):**

**Fichier:** `src/test/logic/progressionLogic.test.ts`

**Couverture:** 9 tests automatisés couvrant la logique de calcul de progression.

**Tests implémentés:**
1. Calcul de la séance suivante dans la même semaine
2. Calcul de la séance suivante lors du passage à la semaine suivante
3. Détection de la fin d'un programme
4. Gestion des programmes à semaines multiples
5. Gestion des programmes à semaine unique
6. Calcul de la progression en pourcentage
7. Détection des semaines complétées
8. Navigation entre les séances
9. Validation de la cohérence des données

**Après (Intervention #2 - PR #294 - Décembre 2025):**

**Fichiers:**
- `src/test/logic/progressionLogic.test.ts` (9 tests)
- `src/test/logic/bilanLogic.test.ts` (13 tests) ✅ NOUVEAU

**Couverture totale:** 22 tests automatisés

**Nouveaux tests pour les bilans:**
1. Création d'un template de bilan
2. Validation de la structure des sections
3. Assignation d'un bilan à un client
4. Assignation récurrente (weekly, biweekly, monthly)
5. Complétion d'un bilan
6. Validation des réponses
7. Gestion du snapshot de template
8. Création d'assignation récurrente après complétion
9. Archivage de bilans
10. Suppression de template avec cascade
11. Validation du bilan initial
12. Mise à jour du profil client
13. Gestion des erreurs

**Commande pour lancer les tests:**
```bash
pnpm test                                    # Tous les tests
pnpm test src/test/logic/progressionLogic.test.ts  # Tests de progression uniquement
pnpm test src/test/logic/bilanLogic.test.ts        # Tests de bilans uniquement
```

## Déploiement

**Plateforme:** Cloudflare Pages

**Processus:**
1. Push du code sur GitHub (branche `main` ou PR)
2. Cloudflare Pages détecte automatiquement le push
3. Build de l'application avec Vite (`pnpm run build`)
4. Déploiement automatique sur le CDN global Cloudflare
5. Pour les PRs, un environnement de preview est créé automatiquement

**Configuration:**
- Build command: `pnpm run build`
- Build output directory: `dist`
- Node version: 22.16.0
- Package manager: pnpm 10.11.1

## Décisions Architecturales Importantes

### Approche Hybride pour `program_assignments`

**Décision:** Conserver les colonnes `current_week` et `current_session_order` dans la table `program_assignments` même après la création de la vue `client_program_progress`.

**Raison:** Approche pragmatique privilégiant la stabilité. Ces colonnes sont maintenues pour rétrocompatibilité et comme filet de sécurité pendant la période de transition. Elles pourront être supprimées dans une future itération après validation complète de la nouvelle architecture.

### Refonte Progressive

**Décision:** Ne pas refactoriser le Dashboard immédiatement après les corrections architecturales.

**Raison:** Privilégier une période d'observation de 2-4 semaines pour valider la stabilité des corrections avant d'entreprendre de nouvelles modifications majeures. Cette approche réduit les risques et permet d'identifier d'éventuels effets de bord.

### Tests Automatisés Ciblés

**Décision:** Commencer par 9 tests couvrant uniquement la logique de progression.

**Raison:** Approche incrémentale. La logique de progression est le cœur du système et la source des bugs critiques. Une fois cette partie sécurisée, la couverture de tests sera étendue progressivement aux autres fonctionnalités.

---

# RECOMMANDATIONS STRATÉGIQUES

## Court Terme (Immédiat - 1 mois)

**Période d'observation de 2-4 semaines** est la priorité absolue. Pendant cette période, il est crucial de surveiller activement la plateforme en production pour confirmer que les corrections ont résolu tous les problèmes et qu'aucun effet de bord n'apparaît. Il est fortement recommandé de ne pas introduire de nouvelles fonctionnalités majeures pendant cette période pour ne pas biaiser l'analyse de stabilité.

La **collecte de retours utilisateurs** doit être organisée en contactant les coachs et clients pour obtenir leur feedback sur la stabilité, la fiabilité des indicateurs, et la nouvelle interface de navigation des programmes. Ces retours permettront de valider la pertinence des corrections et d'identifier d'éventuels points de friction mineurs.

## Moyen Terme (1-3 mois)

L'**harmonisation de l'architecture** constitue la prochaine étape prioritaire. Le Dashboard doit être refactorisé pour utiliser la nouvelle vue `client_program_progress` et les nouveaux services, éliminant ainsi les incohérences visuelles restantes et harmonisant l'architecture de toute l'application.

L'**extension de la couverture de tests** doit être poursuivie en ajoutant des tests automatisés pour les autres parties critiques de l'application (création de programme, authentification, gestion des clients). L'objectif est de réduire le risque de régressions futures et d'augmenter la confiance lors des déploiements.

La **mise en place d'une CI/CD complète** via GitHub Actions permettra de lancer automatiquement les tests à chaque PR, garantissant que seul du code de qualité est mergé dans la branche principale.

L'implémentation d'un **monitoring et alerting** avec un outil comme Sentry ou LogRocket permettra de capturer les erreurs front-end en temps réel et d'être proactif dans la détection de bugs avant qu'ils ne soient massivement reportés par les utilisateurs.

## Long Terme (3+ mois)

L'**optimisation des performances** devra être envisagée en analysant les requêtes lentes et en optimisant les vues SQL et les index PostgreSQL. L'objectif est d'améliorer la réactivité de l'application à mesure que le volume de données augmente.

Une **refonte de l'architecture de duplication** pourrait être étudiée pour éliminer la duplication des données de programmes pour chaque client, en faveur d'un système de références avec historisation des modifications. Cette évolution majeure nécessitera une analyse approfondie et une planification rigoureuse.

---

**Fin du document - Version 1.1**

*Ce document doit être maintenu à jour à chaque intervention significative sur le projet pour conserver sa valeur de référence.*


# ARCHITECTURE TECHNIQUE DU PROJET

## Base de Données Alimentaire (Mise à jour du 24 décembre 2025 - PR #306, #310, #313)

### Avant (23 décembre 2025)

- **Table `food_items` :** Structure de base avec 13 colonnes (name, category, calories, protein, carbs, fat, etc.)
- **Chargement des données :** `supabase.from('food_items').select('*')` - limité à 1000 lignes par l'API REST de Supabase

### Après (24 décembre 2025)

- **Table `food_items` :**
  - Enrichie avec 15 nouvelles colonnes pour Ciqual et Open Food Facts (sugar, fiber, salt, barcode, nutri_score, etc.)
  - Ajout de la colonne `food_type` ('brut' ou 'autre') pour la classification des aliments

- **Chargement des données :**
  - Implémentation d'une **pagination côté client** dans `useDataStore.ts` pour charger tous les 3484 aliments en plusieurs requêtes de 1000 éléments.

## Interface Profil Client Côté Coach (Mise à jour du 23 décembre 2025 - PR #301, #302, #303)

### Avant (22 décembre 2025)

- **ClientProfile.tsx** : Interface simplifiée avec sections manquantes (Données Métaboliques, Objectif calorique, Notes et Médical, Suivi Nutritionnel, etc.)
- **typeMappers.ts** : Pas d'extraction des permissions depuis `lifestyle.access`, âge statique
- **WorkoutBuilder.tsx** : Notes et infos médicales affichées en dur (placeholder statique)
- **types.ts** : Pas d'interface `ClientAccessPermissions`, pas d'alias `User`

### Après (23 décembre 2025)

- **ClientProfile.tsx** :
  - Restauration complète de toutes les sections (Données Métaboliques, Objectif calorique avec toggle g/%, Notes et Médical, Suivi Nutritionnel, Suivi Mensurations & Photos, Documents, Accès & Permissions, Suivi du Poids)
  - Toggle grammes/pourcentages pour les macros avec delta persistant par rapport aux valeurs TDEE d'origine
  - État `originMacros` pour conserver les macros de référence (TDEE)
  - État `macroDisplayMode` pour basculer entre affichage g et %

- **typeMappers.ts** :
  - Fonction `calculateAgeFromDob()` pour calcul dynamique de l'âge
  - Extraction des permissions depuis `lifestyle.access` (canUseWorkoutBuilder, shopAccess, grantedFormationIds)
  - Valeurs par défaut : tous les accès activés si non définis

- **WorkoutBuilder.tsx** :
  - Section "Dernière note du coach" affiche dynamiquement `clientData.notes` via `getLatestNote()`
  - Section "Informations Médicales" affiche `clientData.medicalInfo.history` et `clientData.medicalInfo.allergies`

- **types.ts** :
  - Interface `ClientAccessPermissions` ajoutée
  - Propriétés `canUseWorkoutBuilder`, `shopAccess`, `grantedFormationIds` ajoutées au type `Client`
  - Alias `export type User = Client` pour compatibilité

---

## Sécurité et Permissions (Mise à jour du 17 décembre 2025)

### Avant (16 décembre 2025)

- **RLS (Row Level Security):** Activé sur `clients`, mais avec des politiques récursives provoquant des erreurs.
- **Vues:** De nombreuses vues utilisaient `SECURITY DEFINER`, contournant les politiques RLS.
- **Fonctions:** La plupart des fonctions avaient un `search_path` mutable, les exposant à des risques d'injection.

### Après (17 décembre 2025)

- **RLS (Row Level Security):**
  - **`clients`:** Politiques corrigées pour éviter la récursion.
  - **`program_templates`, `intensification_techniques`, `nutrition_logs`, `session_feedback`:** RLS activé avec des politiques restrictives.
- **Vues:**
  - Toutes les vues critiques ont été recréées avec **`SECURITY INVOKER = true`** pour forcer l'application des RLS.
  - La vue non sécurisée `unified_users` a été supprimée.
- **Fonctions:**
  - Toutes les fonctions critiques ont été recréées avec **`SET search_path = public`** pour prévenir les attaques par injection de schéma.
