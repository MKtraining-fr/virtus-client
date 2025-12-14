# Base de Connaissance Technique - Projet Virtus

**Auteur:** Manus AI  
**Dernière mise à jour:** 14 décembre 2025  
**Version:** 1.0

---

## 📋 Objectif de ce Document

Ce document constitue le **journal technique central** du projet Virtus. Il sert de référence exhaustive pour comprendre l'architecture, l'historique des interventions, et l'état actuel du système. À chaque nouvelle intervention significative, une nouvelle section sera ajoutée en haut de la partie "Historique des Interventions", permettant de maintenir un contexte complet et à jour pour toutes les futures collaborations.

---

# HISTORIQUE DES INTERVENTIONS

## Intervention #1 - Refactoring Architectural Majeur (Décembre 2025)

**Date:** 11-14 décembre 2025  
**Pull Requests:**
- [PR #289](https://github.com/MKtraining-fr/virtus/pull/289) - `feat/atomic-session-completion` ✅ Mergée
- [PR #290](https://github.com/MKtraining-fr/virtus/pull/290) - `feat/single-source-of-truth` ✅ Mergée
- [PR #291](https://github.com/MKtraining-fr/virtus/pull/291) - `feat/normalize-session-order` ✅ Mergée
- [PR #292](https://github.com/MKtraining-fr/virtus/pull/292) - `feat/automated-tests` ✅ Mergée
- [PR #293](https://github.com/MKtraining-fr/virtus/pull/293) - `feat: Améliorer l'affichage des programmes avec semaines variables` ✅ Mergée

**Statut:** Déployé en production avec succès.

### Contexte

L'application Virtus souffrait de bugs critiques de désynchronisation des données affectant la fiabilité de la plateforme coach-client. Les indicateurs de progression (œil rouge/vert, pastilles de notification) étaient peu fiables, et les données de séances pouvaient se retrouver dans des états incohérents après validation.

### Problèmes Identifiés

Une analyse approfondie a révélé **sept problèmes architecturaux majeurs** constituant la cause racine des bugs récurrents.

#### Problème 1: Absence de Transaction Atomique

La validation d'une séance client déclenchait **7 appels réseau distincts** et non coordonnés à la base de données. En cas d'échec d'un seul de ces appels, les données se retrouvaient dans un état incohérent, sans possibilité de rollback.

**Impact utilisateur:** Indicateur "œil" rouge/vert non fiable, pastilles de notification incorrectes, données de performance manquantes ou erronées.

#### Problème 2: Multiples Sources de Vérité

La progression du client (semaine et séance actuelles) était calculée et stockée à plusieurs endroits différents, à la fois côté client (front-end) et côté serveur (base de données), sans mécanisme de synchronisation garantie. Cette duplication créait des situations où le coach et le client voyaient des informations différentes.

**Impact utilisateur:** Affichage de la mauvaise séance ou semaine au client, désynchronisation entre la vue coach et la vue client.

#### Problème 3: Logique de Calcul Côté Client

Une partie importante de la logique métier, comme le calcul de la prochaine séance à effectuer, était implémentée directement dans le code front-end (React). Cette approche rendait la logique fragile, difficile à maintenir, et sujette à des incohérences entre différentes versions de l'application.

**Impact utilisateur:** Risque élevé d'incohérences entre les versions de l'application, difficulté à maintenir et à déboguer la logique.

#### Problème 4: `session_order` Non Normalisé

Les valeurs de `session_order` dans la base de données n'étaient pas consécutives (exemples observés: 1, 56, 93, 175). Cette non-normalisation compliquait et fragilisait tous les calculs de progression basés sur l'ordre des séances, notamment pour déterminer la "séance suivante".

**Impact utilisateur:** Bugs dans la navigation entre les séances "précédente" et "suivante", erreurs de calcul pour déterminer la séance actuelle.

#### Problème 5: Duplication des Données

La structure complète des programmes et des séances était dupliquée pour chaque client assigné. Cette architecture rendait les mises à jour de programmes complexes, coûteuses en ressources, et impossibles à propager rétroactivement.

**Impact utilisateur:** Lenteurs lors de l'assignation de programmes, impossibilité pour le coach de mettre à jour un programme pour tous les clients concernés en une seule fois.

#### Problème 6: Absence de Tests Automatisés

Aucune suite de tests automatisés n'existait pour valider la logique de progression, qui constitue pourtant le cœur fonctionnel du système. Chaque modification du code était donc risquée et nécessitait des tests manuels longs et fastidieux.

**Impact utilisateur:** Impossibilité de détecter les régressions avant la mise en production, chaque modification était risquée.

#### Problème 7: Dépendance à `current_week` et `current_session_order`

L'état de la progression était stocké dans les colonnes `current_week` et `current_session_order` de la table `program_assignments`. Cette méthode de stockage direct de l'état s'est avérée peu fiable et était la source principale des désynchronisations de progression.

**Impact utilisateur:** Source principale des désynchronisations de progression entre coach et client.

### Solutions Implémentées

Quatre Pull Requests majeures ont été développées et mergées pour résoudre ces problèmes de manière structurelle.

#### Solution 1: Transaction Atomique (PR #289)

**Création d'une fonction RPC PostgreSQL `complete_client_session_atomic`.**

Cette fonction encapsule les 7 opérations de mise à jour dans une **transaction unique et atomique**. Si une seule opération échoue, toutes les modifications sont annulées automatiquement (rollback), garantissant ainsi que la base de données reste toujours dans un état cohérent.

**Fichiers créés/modifiés:**
- `supabase/migrations/20251213_complete_session_atomic.sql` - Fonction RPC PostgreSQL (V4 déployée)
- `src/hooks/useSessionCompletion.ts` - Hook React custom pour appeler la fonction RPC
- `src/pages/client/workout/ClientCurrentProgram.tsx` - Composant modifié pour utiliser le nouveau hook

**Bénéfices:**
- ✅ Élimination complète des désynchronisations lors de la validation de séance
- ✅ Fiabilité à 100% de l'indicateur "œil" rouge/vert
- ✅ Pastilles de notification toujours correctes
- ✅ Réduction de 7 appels réseau à 1 seul appel

#### Solution 2: Source de Vérité Unique (PR #290)

**Création d'une vue SQL `client_program_progress`.**

Cette vue calcule automatiquement et en temps réel la progression de chaque client (semaine et séance actuelles) directement depuis la base de données, en se basant uniquement sur les séances complétées. La logique n'est plus dupliquée côté client mais centralisée et robuste côté serveur.

**Fichiers créés/modifiés:**
- `supabase/migrations/20251213_client_program_progress_view.sql` - Vue SQL calculée
- `src/services/clientProgramProgressService.ts` - Service TypeScript pour accéder à la vue
- `src/hooks/useClientProgramProgress.ts` - Hook React pour charger la progression

**Bénéfices:**
- ✅ Source de vérité unique et calculée automatiquement
- ✅ Données toujours synchronisées entre coach et client
- ✅ Simplification majeure de la logique front-end
- ✅ Élimination des calculs côté client

#### Solution 3: Normalisation des Données (PR #291)

**Exécution d'un script SQL pour normaliser les valeurs de `session_order`.**

Le script a parcouru toutes les séances de la base de données et a réattribué un `session_order` consécutif (1, 2, 3, 4, ...) pour chaque programme, simplifiant ainsi tous les futurs calculs de progression et éliminant les bugs liés aux valeurs non consécutives.

**Fichiers créés:**
- `supabase/migrations/20251213_normalize_session_order.sql` - Script de normalisation (exécuté sur Supabase)

**Bénéfices:**
- ✅ Valeurs `session_order` consécutives pour tous les programmes
- ✅ Simplification des calculs de "séance suivante"
- ✅ Prévention des bugs de navigation

#### Solution 4: Tests Automatisés (PR #292)

**Implémentation d'une suite de 9 tests automatisés avec Vitest.**

Ces tests couvrent la logique de calcul de la progression (séance suivante, semaine suivante, fin de programme) et s'assurent qu'elle fonctionne correctement dans tous les cas de figure. Ils préviennent les régressions futures et permettent de modifier le code en toute confiance.

**Fichiers créés:**
- `src/test/logic/progressionLogic.test.ts` - 9 tests automatisés (tous passent)
- `src/test/README.md` - Documentation complète des tests

**Bénéfices:**
- ✅ Détection automatique des régressions
- ✅ Sécurisation des futurs changements
- ✅ Documentation vivante de la logique métier

### Nouvelle Fonctionnalité: Navigation Intelligente pour Programmes (PR #293)

En complément des corrections architecturales, une nouvelle fonctionnalité a été implémentée pour améliorer l'expérience utilisateur des coachs lors de la consultation des programmes assignés.

#### Problème

Lorsque les semaines d'un programme étaient différentes, l'interface affichait toutes les semaines simultanément dans la modale de consultation. Pour les programmes longs (10+ semaines), cela rendait l'interface confuse, lente à charger, et difficile à naviguer.

#### Solution

Implémentation d'une navigation "intelligente" qui n'affiche par défaut que la première semaine, avec la possibilité de naviguer entre les semaines via des onglets cliquables.

**Fichiers modifiés:**
- `src/components/ProgramDetailView.tsx` - Composant de modale de consultation des programmes

**Comportement:**

**Scénario 1 - Semaines Identiques (inchangé):**
Un seul tableau est affiché avec la mention "Semaines 1 à X (identiques)".

**Scénario 2 - Semaines Différentes (nouveau):**
- Par défaut, seule la **Semaine 1** est visible
- Un bandeau bleu "Semaines variables" 🔄 indique la présence de variations
- Un bouton "Voir toutes les semaines" déplie une barre d'onglets pour naviguer
- Les onglets des semaines différentes de la Semaine 1 sont marqués d'une **pastille rouge** 🔴
- Un bouton "Masquer" permet de replier la navigation

**Bénéfices:**
- ✅ Interface plus claire et moins chargée
- ✅ Navigation intuitive entre les semaines
- ✅ Identification visuelle immédiate des semaines différentes
- ✅ Meilleure UX pour les programmes longs (10+ semaines)

### Note Importante: Incohérence Temporaire Dashboard

Une incohérence visuelle a été identifiée entre la nouvelle section "Programme Assigné" (qui utilise la nouvelle architecture) et la "modale historique de perf sur le tableau de bord" (qui utilise encore l'ancienne architecture). Cette incohérence est **attendue et normale**. Elle démontre que la nouvelle architecture est plus précise que l'ancienne. Le Dashboard n'a volontairement pas été refactorisé pendant cette phase pour privilégier la stabilisation. Cette incohérence disparaîtra lors de la future refonte du Dashboard.

### Résultats et Impact

- ✅ **Tous les bugs critiques de désynchronisation sont résolus**
- ✅ **L'application est stable et fiable**
- ✅ **Les 5 PRs sont mergées et déployées en production**
- ✅ **9 tests automatisés passent avec succès**
- ✅ **Nouvelle fonctionnalité de navigation déployée**

### Recommandations Post-Intervention

1. **Période d'observation (2-4 semaines):** Surveiller la stabilité en production avant toute nouvelle modification majeure. Ne pas introduire de nouvelles fonctionnalités pendant cette période pour ne pas biaiser l'analyse.

2. **Collecte de retours utilisateurs:** Contacter les coachs et clients pour obtenir leur feedback sur la stabilité et la nouvelle interface de navigation.

3. **Prochaine étape prioritaire (moyen terme):** Refactoriser le Dashboard pour qu'il utilise la nouvelle vue `client_program_progress`. Cela éliminera les incohérences visuelles restantes et harmonisera l'architecture de toute l'application.

---

# ARCHITECTURE TECHNIQUE DU PROJET

Cette section décrit l'état actuel de l'architecture technique après l'intervention de décembre 2025.

## Stack Technique

Le projet Virtus repose sur une stack moderne orientée performance et développement rapide.

| Catégorie | Technologie | Version | Description |
|:---|:---|:---|:---|
| **Front-end** | React | 19.2.0 | Bibliothèque d'interface utilisateur avec architecture à composants. |
| | TypeScript | 5.8.3 | Langage de programmation avec typage statique pour JavaScript. |
| | Vite | 6.4.1 | Outil de build et serveur de développement rapide avec HMR. |
| **Back-end** | Supabase | - | Plateforme BaaS (Backend-as-a-Service) fournissant base de données, authentification, et API REST/RPC. |
| | PostgreSQL | 15+ | Base de données relationnelle utilisée par Supabase. |
| **State Management** | Zustand | 5.0.8 | Gestionnaire d'état simple et performant pour React. |
| **Routing** | React Router | 7.9.6 | Bibliothèque de routage pour applications React. |
| **UI Components** | Heroicons | 2.2.0 | Bibliothèque d'icônes SVG. |
| | Lucide React | 0.552.0 | Bibliothèque d'icônes SVG alternative. |
| **Tests** | Vitest | 3.2.4 | Framework de test rapide compatible avec Vite. |
| | Testing Library | 16.3.0 | Utilitaires de test pour composants React. |
| **Déploiement** | Cloudflare Pages | - | Plateforme de déploiement continu pour applications front-end avec CDN global. |
| **Code Repository** | GitHub | - | Hébergement du code source et gestion des versions. |
| **Validation** | Zod | 4.1.12 | Bibliothèque de validation de schémas TypeScript-first. |

## Architecture de la Base de Données

L'architecture de la base de données suit un modèle relationnel classique avec une séparation claire entre les modèles de programmes (créés par les coachs) et les instances de programmes (assignées aux clients).

### Tables Principales

#### Tables de Modèles de Programmes (Créés par les Coachs)

| Table | Description | Colonnes Clés |
|:---|:---|:---|
| `programs` | Contient les modèles de programmes d'entraînement créés par les coachs. | `id`, `name`, `coach_id`, `description`, `created_at` |
| `program_weeks` | Définit les semaines d'un programme. Un programme peut avoir plusieurs semaines. | `id`, `program_id`, `week_number` |
| `program_sessions` | Définit les séances d'entraînement pour une semaine donnée. | `id`, `week_id`, `session_order`, `title`, `description` |
| `program_exercises` | Définit les exercices au sein d'une séance. | `id`, `session_id`, `exercise_id`, `sets`, `reps`, `rest_time` |

#### Tables d'Assignation et de Suivi (Instances Clients)

| Table | Description | Colonnes Clés |
|:---|:---|:---|
| `program_assignments` | Table de liaison qui assigne un programme à un client. Contient aussi `current_week` et `current_session_order` pour rétrocompatibilité (approche hybride). | `id`, `client_id`, `program_id`, `start_date`, `current_week`, `current_session_order` |
| `client_sessions` | Stocke l'état de chaque séance pour un client (complétée ou non). | `id`, `assignment_id`, `session_id`, `completed_at`, `viewed_at` |
| `client_session_exercises` | Copie des exercices d'une séance pour un client spécifique. | `id`, `client_session_id`, `exercise_id`, `sets`, `reps` |
| `client_exercise_performance` | Enregistre les performances réelles du client pour chaque exercice (poids, reps effectuées). | `id`, `client_session_id`, `exercise_id`, `set_number`, `weight`, `reps_done` |

### Vue Calculée (Source de Vérité)

| Vue | Description | Colonnes Clés |
|:---|:---|:---|
| **`client_program_progress`** | **Source de Vérité Calculée.** Détermine automatiquement la semaine et la séance actuelles pour chaque client en se basant uniquement sur les séances complétées (`client_sessions.completed_at`). | `client_id`, `assignment_id`, `program_id`, `current_week_number`, `current_session_order`, `total_weeks`, `total_sessions`, `completed_sessions` |

Cette vue est interrogée par le front-end via le service `clientProgramProgressService` et le hook `useClientProgramProgress`.

### Fonction RPC PostgreSQL

| Fonction | Description | Paramètres | Retour |
|:---|:---|:---|:---|
| `complete_client_session_atomic` | Valide une séance client de manière atomique (transaction). Marque la séance comme complétée, enregistre les performances, et met à jour la progression. | `p_client_session_id`, `p_performances` (JSON) | `success` (boolean), `message` (text) |

Cette fonction est appelée par le front-end via le hook `useSessionCompletion`.

## Architecture Front-end

L'application front-end est organisée en une architecture à composants avec séparation claire des responsabilités.

### Structure des Répertoires

```
/src
├── /components       # Composants React réutilisables
│   ├── ProgramDetailView.tsx  # Modale de consultation des programmes (modifiée en décembre 2025)
│   └── ...
├── /hooks            # Hooks React custom
│   ├── useSessionCompletion.ts       # Hook pour valider une séance (utilise RPC atomique)
│   ├── useClientProgramProgress.ts   # Hook pour charger la progression (utilise la vue SQL)
│   └── ...
├── /services         # Services TypeScript pour interactions API
│   ├── clientProgramProgressService.ts  # Service pour accéder à la vue client_program_progress
│   └── ...
├── /stores           # Stores Zustand pour gestion d'état global
│   ├── useAuthStore.ts    # Store d'authentification
│   ├── useDataStore.ts    # Store de données
│   └── ...
├── /pages            # Composants de page principaux
│   ├── /client       # Pages de l'interface client
│   │   ├── /workout
│   │   │   └── ClientCurrentProgram.tsx  # Page de séance client (utilise useSessionCompletion)
│   │   └── ...
│   ├── /coach        # Pages de l'interface coach
│   └── /admin        # Pages de l'interface admin
├── /test             # Tests automatisés
│   ├── /logic
│   │   └── progressionLogic.test.ts  # Tests de la logique de progression (9 tests)
│   └── README.md
└── ...
```

### Flux de Données (Post-Refactoring)

#### Validation d'une Séance Client

1. Le client clique sur "Valider la séance" dans `ClientCurrentProgram.tsx`
2. Le composant appelle le hook `useSessionCompletion`
3. Le hook invoque la fonction RPC `complete_client_session_atomic` avec les performances
4. La fonction RPC exécute une transaction atomique qui :
   - Marque la séance comme complétée
   - Enregistre les performances
   - Met à jour les indicateurs (œil, pastilles)
5. En cas de succès, le front-end rafraîchit l'interface
6. En cas d'échec, toutes les modifications sont annulées (rollback)

#### Affichage de la Progression

1. Le composant (Dashboard, ClientCurrentProgram, etc.) appelle le hook `useClientProgramProgress`
2. Le hook interroge le service `clientProgramProgressService`
3. Le service effectue une requête SQL vers la vue `client_program_progress`
4. La vue calcule automatiquement la progression en temps réel
5. Les données sont retournées au composant et affichées

## Fonctionnalités Clés

### Complétion de Séance Client

**Composant principal:** `src/pages/client/workout/ClientCurrentProgram.tsx`

**Ancienne logique (avant décembre 2025):**
- 7 appels API successifs et non coordonnés
- Risque élevé de désynchronisation en cas d'échec partiel
- Indicateurs (œil, pastilles) peu fiables

**Nouvelle logique (après décembre 2025):**
- 1 seul appel au hook `useSessionCompletion`
- Invocation de la fonction RPC `complete_client_session_atomic`
- Transaction atomique garantissant la cohérence
- Indicateurs toujours fiables

### Calcul de la Progression

**Ancienne logique (avant décembre 2025):**
- Calculs complexes et fragiles dans le front-end
- Basés sur les colonnes `current_week` et `current_session_order` de `program_assignments`
- Multiples sources de vérité
- Désynchronisations fréquentes

**Nouvelle logique (après décembre 2025):**
- Le front-end interroge simplement la vue `client_program_progress`
- La vue calcule la progression en temps réel depuis les séances complétées
- Logique entièrement côté serveur, centralisée et robuste
- Source de vérité unique

### Affichage des Programmes Assignés (Interface Coach)

**Composant:** `src/components/ProgramDetailView.tsx`

**Logique:**
1. Le composant récupère toutes les semaines et séances d'un programme assigné
2. Une fonction compare la structure de chaque semaine (exercices, séries, reps, ordre) avec celle de la Semaine 1
3. Si toutes les semaines sont identiques, un seul tableau est affiché avec la mention "Semaines 1 à X (identiques)"
4. Si au moins une semaine est différente :
   - Par défaut, seule la Semaine 1 est affichée
   - Un bandeau bleu "Semaines variables" 🔄 est visible
   - Un bouton "Voir toutes les semaines" déplie une navigation par onglets
   - Les semaines différentes de la Semaine 1 sont marquées d'une pastille rouge 🔴
   - Un bouton "Masquer" permet de replier la navigation

**Critères de différence:** Toute différence dans les exercices, séries, reps, ordre, ou nombre de séances est détectée.

## Tests Automatisés

**Framework:** Vitest 3.2.4

**Fichier principal:** `src/test/logic/progressionLogic.test.ts`

**Couverture actuelle:** 9 tests automatisés couvrant la logique de calcul de progression.

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

**Commande pour lancer les tests:**
```bash
pnpm test
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

**Fin du document - Version 1.0**

*Ce document doit être maintenu à jour à chaque intervention significative sur le projet pour conserver sa valeur de référence.*
