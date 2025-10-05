

'''
# Guide de Migration : de Firebase à Supabase

**Auteur**: Manus AI
**Date**: 5 Octobre 2025
**Version**: 1.0

## 1. Introduction

Ce document détaille la migration de l'application **Virtus** de la plateforme Google Firebase vers Supabase. La décision de migrer a été motivée par des défis persistants rencontrés avec Firebase, notamment des problèmes de permissions complexes et des limitations d'authentification. Supabase a été choisi comme alternative pour sa nature open-source, son utilisation de PostgreSQL, et son système de sécurité RLS (Row Level Security) qui offre un contrôle plus granulaire et prévisible sur l'accès aux données.

L'objectif de cette migration était de recréer l'ensemble des fonctionnalités existantes sur une base technique plus stable, sécurisée et évolutive, tout en résolvant les problèmes qui entravaient le développement.

## 2. Résumé des Changements

La migration a impacté plusieurs aspects fondamentaux de l'application. Le tableau ci-dessous résume les changements clés entre l'ancienne et la nouvelle architecture.

| Composant | Ancienne Technologie (Firebase) | Nouvelle Technologie (Supabase) |
| :--- | :--- | :--- |
| **Authentification** | Firebase Authentication | Supabase Auth |
| **Base de Données** | Firestore (NoSQL) | Supabase (PostgreSQL) |
| **Accès aux Données** | Règles de sécurité Firestore | Politiques RLS (Row Level Security) |
| **SDK Client** | `firebase/app`, `firebase/auth`, `firebase/firestore` | `@supabase/supabase-js` |
| **Configuration** | Fichier de configuration Firebase | Variables d'environnement (`.env`) |
| **Types de Données** | Interfaces TypeScript personnalisées | Types générés depuis le schéma SQL |

'''


## 3. Configuration de l'Environnement

La configuration du projet a été simplifiée pour utiliser des variables d'environnement standards. Les anciennes clés Firebase ont été conservées pour référence mais ne sont plus utilisées. Les nouvelles clés Supabase doivent être présentes dans un fichier `.env` à la racine du projet.

**Fichier `.env`**

```
# Supabase
VITE_SUPABASE_URL=https://dqsbfnsicmzovlrhuoif.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MzY1MTcsImV4cCI6MjA3NTIxMjUxN30.fkhw3Uw7aJzgf_wPypd50_5ypNi4xGrINPXuBHAjuPg
```

Le client Supabase est initialisé dans `src/services/supabase.ts` et utilise ces variables pour se connecter au projet.

## 4. Schéma de la Base de Données

La base de données a été migrée de Firestore (NoSQL) vers PostgreSQL. Le nouveau schéma est défini dans le fichier `supabase/schema.sql`. Ce schéma inclut :

- La définition de toutes les tables (`clients`, `exercises`, `programs`, etc.).
- Les relations entre les tables (clés étrangères).
- Les types de données pour chaque colonne.
- Des index pour optimiser les performances des requêtes.
- Des triggers pour mettre à jour automatiquement les timestamps (`updated_at`).

De plus, des types TypeScript correspondants ont été générés dans `src/types/database.ts` pour assurer la sécurité des types dans l'ensemble de l'application.

## 5. Services

De nouveaux services ont été créés pour interagir avec Supabase :

- **`src/services/authService.ts`**: Gère l'inscription, la connexion, la déconnexion et la gestion des sessions utilisateur avec Supabase Auth.
- **`src/services/dataService.ts`**: Un service générique pour les opérations CRUD (Create, Read, Update, Delete) sur toutes les tables de la base de données. Il simplifie les appels à la base de données et centralise la logique de gestion des données.
- **`src/services/typeMappers.ts`**: Contient des fonctions pour mapper les données entre le format `snake_case` de Supabase et le format `camelCase` utilisé dans l'application React. Cela permet de garder le code de l'application cohérent sans avoir à se soucier du format de la base de données.

## 6. Contexte d'Authentification (`AuthContext.tsx`)

Le fichier `src/context/AuthContext.tsx` a été entièrement mis à jour pour utiliser les nouveaux services Supabase. Les principaux changements sont :

- **Remplacement de `onAuthStateChanged` de Firebase** par `onAuthStateChange` de Supabase pour écouter les changements de session.
- **Utilisation de `dataService`** pour charger toutes les données de l'application (clients, exercices, programmes, etc.) de manière centralisée.
- **Intégration des `typeMappers`** pour convertir les données Supabase au format attendu par l'application.
- **Simplification de la logique de chargement des données** grâce à la puissance des requêtes SQL de Supabase.



## 7. Politiques de Sécurité (Row Level Security)

L'un des changements les plus importants de cette migration est le passage des règles de sécurité Firestore aux politiques RLS de PostgreSQL. Les politiques RLS offrent un contrôle beaucoup plus fin et puissant sur l'accès aux données, directement au niveau de la base de données.

Le fichier `supabase/fix-rls-policies.sql` contient la version finale et corrigée de toutes les politiques. Celles-ci garantissent que :

- Les utilisateurs ne peuvent accéder qu'à leurs propres données.
- Les coachs ne peuvent voir que les données de leurs clients assignés.
- Les administrateurs ont un accès plus large pour la gestion.
- Des fonctions SQL (`is_admin()`, `is_coach_or_admin()`) ont été créées pour simplifier l'écriture et la maintenance de ces politiques et éviter les problèmes de récursion.

## 8. Actions Post-Migration (TRÈS IMPORTANT)

Pour finaliser la migration et préparer l'application pour la production, une action manuelle est **requise**.

### Réactiver la Confirmation par Email

Pour faciliter les tests automatisés, la confirmation par email lors de l'inscription a été temporairement désactivée. Il est **impératif** de la réactiver avant de permettre à de vrais utilisateurs de s'inscrire.

**Comment faire :**

1.  Allez sur votre projet Supabase : **https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif**
2.  Dans le menu de gauche, cliquez sur l'icône **Authentication** (Authentification).
3.  Cliquez sur **"Providers"**.
4.  Cliquez sur **"Email"** pour déplier les options.
5.  **Cochez** la case **"Confirm email"**.
6.  Cliquez sur **"Save"** en bas de la page.

> **Avertissement** : Ne pas effectuer cette action exposerait l'application à des inscriptions non vérifiées, ce qui représente un risque de sécurité.

## 9. Conclusion

La migration vers Supabase est maintenant terminée. L'application repose sur une base technique moderne, robuste et sécurisée. Les problèmes d'authentification et de permissions ont été résolus, et la nouvelle architecture est mieux préparée pour les évolutions futures de Virtus.

Ce guide sert de référence pour comprendre les changements effectués et pour assurer une maintenance correcte de l'application.

