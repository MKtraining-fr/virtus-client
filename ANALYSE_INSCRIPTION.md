# Analyse du Flux d'Inscription et Plan de Correction

## 1. Introduction

Ce document analyse le processus d'inscription des utilisateurs dans l'application Virtus, en se concentrant sur les exigences suivantes :
- Permettre l'inscription d'un client sans coach.
- Gérer correctement les codes d'affiliation pour lier un client à un coach.
- Assurer que le flux de confirmation par e-mail est fonctionnel et clair pour l'utilisateur.

L'analyse se base sur les fichiers `src/context/AuthContext.tsx` et `src/services/authService.ts`.

## 2. Analyse du Code Existant

### `src/context/AuthContext.tsx`

La fonction `register` est le point d'entrée pour l'inscription depuis l'interface utilisateur. Son fonctionnement est le suivant :

1.  Elle accepte les données de l'utilisateur (`userData`) et un `affiliationCode` optionnel.
2.  Si un `affiliationCode` est fourni, elle effectue une requête à la base de données Supabase pour trouver l'ID du coach correspondant.
3.  Elle crée un objet `finalUserData` qui inclut le `coachId` (qui peut être `null` si aucun code n'est fourni ou si le code est invalide).
4.  Elle appelle la fonction `signUp(finalUserData)` du service `authService`.

**Constat :** La logique de recherche du `coachId` est correcte. Le problème ne se situe pas à ce niveau. Le `coachId` est bien préparé pour être transmis au service d'authentification.

### `src/services/authService.ts`

Ce fichier contient la logique d'interaction avec Supabase pour l'authentification.

1.  **Interface `SignUpData`** : L'interface qui définit la structure des données d'inscription **ne contient pas** de champ `coachId`.

    ```typescript
    export interface SignUpData {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role?: 'admin' | 'coach' | 'client";
      affiliationCode?: string;
    }
    ```

2.  **Fonction `signUp`** : C'est le point crucial. La fonction reçoit `userData`, mais comme `SignUpData` n'inclut pas `coachId`, ce dernier est perdu lors de l'appel. Par conséquent :
    *   Lors de la création de l'utilisateur dans `supabase.auth.signUp`, le `coach_id` n'est **pas** ajouté aux métadonnées de l'utilisateur.
    *   Lors de la création du profil dans la table `clients`, l'objet `clientProfile` est assemblé sans le `coach_id`.

**Conclusion de l'analyse :** Le problème principal est une **rupture dans la chaîne de transmission des données**. Le `coachId` est correctement déterminé dans `AuthContext.tsx` mais n'est jamais reçu ni traité par `authService.ts` car l'interface `SignUpData` et la logique de la fonction `signUp` ne sont pas prévues pour le gérer.

## 3. Plan de Correction Proposé

Pour résoudre les problèmes identifiés et répondre aux exigences, les étapes suivantes sont nécessaires :

1.  **Modifier `src/services/authService.ts`** :
    *   Ajouter le champ optionnel `coachId?: string;` à l'interface `SignUpData`.
    *   Mettre à jour la fonction `signUp` pour qu'elle inclue `coach_id: userData.coachId || null` dans les `options.data` de `supabase.auth.signUp`.
    *   Mettre à jour la fonction `signUp` pour qu'elle inclue également `coach_id: userData.coachId || null` dans l'objet `clientProfile` inséré dans la table `clients`.

2.  **Modifier `src/context/AuthContext.tsx`** :
    *   Dans la fonction `register`, modifier la redirection après l'appel à `signUp`. Au lieu de `navigate('/')`, utiliser `navigate('/check-email')`. Cela créera une page dédiée informant l'utilisateur qu'il doit vérifier sa boîte de réception pour confirmer son compte, ce qui est le comportement par défaut de Supabase et améliore l'expérience utilisateur.

3.  **Vérification et Test** :
    *   S'assurer que la configuration des e-mails dans Supabase (modèles d'e-mail de confirmation) est correcte.
    *   Effectuer un test complet du parcours d'inscription :
        *   Inscription d'un client **sans** code d'affiliation.
        *   Inscription d'un client **avec** un code d'affiliation valide.
        *   Vérifier dans la base de données que le champ `coach_id` est correctement renseigné (ou `null`).
        *   Vérifier la réception de l'e-mail de confirmation.

Ce plan d'action permettra de corriger le bug, d'implémenter la fonctionnalité de lien coach-client et d'améliorer la clarté du processus pour l'utilisateur final.
