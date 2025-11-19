# Diagnostic et Plan de Refonte : Système d'Assignation de Programmes

**Projet** : Virtus - Application de Coaching SaaS
**Date** : 19 novembre 2025
**Auteur** : Manus AI

## 1. Introduction et Synthèse du Diagnostic

Conformément à ta demande, j'ai réalisé un diagnostic complet du système d'assignation de programmes et de séances de ton application Virtus. L'analyse s'est basée sur l'exploration du code source (repository `MKtraining-fr/Virtus`) et l'inspection de la base de données Supabase associée.

L'objectif est de passer de la situation actuelle, où "rien ne fonctionne", à une solution robuste, fonctionnelle et maintenable. Ce document présente les conclusions de mon diagnostic, identifie les problèmes fondamentaux et propose une première cartographie du domaine métier comme base pour la refonte.

### Situation Actuelle : Un Système Hybride Non Finalisé

Le système actuel est basé sur une **architecture hybride de duplication (template & instance)**. Un coach crée un programme "modèle" (`programs`, `sessions`, `session_exercises`), et lorsqu'il l'assigne à un client, une fonction PostgreSQL (`assign_program_to_client_atomic`) duplique ce modèle dans des tables dédiées au client (`client_created_programs`, `client_created_sessions`, etc.). Une table `program_assignments` sert de registre pour lier le client, le coach, le modèle et l'instance dupliquée.

**Le problème fondamental n'est pas un bug isolé, mais une implémentation incomplète et incohérente de cette architecture.**

| Point de Diagnostic | État Actuel | Impact | Criticité |
| :--- | :--- | :--- | :--- |
| **Modèle de Données** | Schéma complexe et partiellement dénormalisé. Multiples tables (`program_assignments`, `client_created_programs`) créent de la confusion. | Difficulté à maintenir la cohérence des données. Les requêtes sont complexes et sujettes à erreur. | **Élevée** |
| **Logique d'Assignation** | Une fonction RPC `assign_program_to_client_atomic` existe mais semble déconnectée de l'interface ou mal utilisée. | L'assignation échoue ou ne produit pas les résultats attendus dans les interfaces. | **Élevée** |
| **Sécurité (RLS)** | La table `program_assignments` n'a **aucune politique de sécurité au niveau des lignes (RLS)** activée. | **Faille de sécurité critique**. N'importe quel utilisateur authentifié pourrait potentiellement lire toutes les assignations de la plateforme. | **Critique** |
| **Interface Coach** | Le code pour assigner (`WorkoutLibrary.tsx`) et visualiser (`ClientProfile.tsx`) existe mais s'appuie sur des jointures complexes et des données qui ne sont pas correctement chargées ou mises à jour. | Le coach ne peut ni assigner de manière fiable, ni vérifier ce qui a été assigné. L'expérience est cassée. | **Élevée** |
| **Interface Client** | Le code (`ClientProgram.tsx`, `ClientWorkout.tsx`) tente de lire les programmes assignés depuis un état global (`useAuthStore`) qui ne semble pas être correctement peuplé avec les données d'assignation. | Le client ne voit jamais les programmes qui lui sont assignés. La fonctionnalité principale est inutilisable. | **Élevée** |

En résumé, bien que les fondations (tables SQL, fonction RPC) aient été posées, les connexions entre la base de données, la logique métier côté client (services TypeScript) et les composants UI (React) sont défaillantes ou manquantes. La faille de sécurité RLS sur `program_assignments` est le problème le plus urgent à corriger.

## 2. Cartographie du Domaine Fonctionnel (DDD)

Pour restructurer le système sur des bases saines, clarifions d'abord le langage et les concepts métier. Nous nous concentrons ici sur le **Bounded Context : "Gestion des Programmes Clients"**.

### Entités Métier Clés

- **Coach** : L'utilisateur qui crée et assigne les programmes.
- **Client** : L'utilisateur qui reçoit et exécute les programmes.
- **ProgrammeTemplate** : Le **modèle** d'un programme créé par un coach. Il contient la structure (semaines, séances, exercices) mais n'est pas lié à un client. C'est un actif réutilisable de la bibliothèque du coach.
- **SéanceTemplate** : Le **modèle** d'une séance au sein d'un `ProgrammeTemplate`.
- **Exercice** : Une entrée de la bibliothèque générale d'exercices (ex: "Développé couché").
- **AssignationProgramme** : L'**acte** de lier un `ProgrammeTemplate` à un `Client` à une date donnée. C'est l'enregistrement central qui matérialise la décision du coach.
- **ProgrammeClient** : L'**instance dupliquée et personnalisée** du `ProgrammeTemplate`, appartenant au client. C'est sur cet objet que le client travaille et que sa progression est suivie.
- **SéanceClient** : L'instance d'une séance au sein d'un `ProgrammeClient`.
- **LogPerformance** : L'enregistrement des données d'une séance réalisée par le client (charges, répétitions, RPE, etc.).
- **Statut** : L'état d'une `AssignationProgramme` ou d'une `SéanceClient` (ex: `À venir`, `En cours`, `Terminé`, `Archivé`).

### Relations et Logique

1.  Un **Coach** crée des **ProgrammeTemplates**.
2.  Un **ProgrammeTemplate** est composé de plusieurs **SéanceTemplates**.
3.  Une **SéanceTemplate** est composée de plusieurs **Exercices** avec des consignes (séries, reps, etc.).
4.  Le **Coach** crée une **AssignationProgramme** pour lier un **ProgrammeTemplate** à un **Client**.
5.  Cette action déclenche la création d'un **ProgrammeClient** (copie du template).
6.  Le **Client** interagit uniquement avec son **ProgrammeClient** et ses **SéanceClients**.
7.  Lorsqu'un client complète une séance, des **LogsPerformance** sont créés.
8.  Le **Statut** de l'assignation et des séances est mis à jour en fonction de la progression et des dates.

Cette clarification est la première étape indispensable avant de définir les user flows et de refondre le modèle de données. La suite de ma mission consistera à traduire ce domaine en spécifications UX, fonctionnelles et techniques détaillées, comme tu l'as demandé.
