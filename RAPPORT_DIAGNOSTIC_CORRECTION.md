'''
# Rapport de Diagnostic et Plan de Correction : Système d'Assignation

## 1. Reformulation du Problème

Tu rencontres un problème critique sur ton application de coaching : la fonctionnalité permettant à un coach d'assigner un programme ou une séance à un client ne fonctionne pas. Malgré les tentatives, les assignations ne se reflètent pas côté client, et la chaîne fonctionnelle complète (de l'action du coach à l'affichage chez le client) semble rompue. Mon objectif est de diagnostiquer la cause racine de ce dysfonctionnement, de proposer une solution technique robuste et de te fournir un plan d'action clair pour la mettre en œuvre.

## 2. Cartographie Métier & Flux Cibles

Basé sur les meilleures pratiques (Domain-Driven Design), le système doit clairement séparer les **modèles** (templates) des **instances** (données vivantes du client).

*   **Entités Métier :**
    *   `ProgramTemplate` : Un programme modèle dans la bibliothèque du coach.
    *   `SessionTemplate` : Une séance modèle au sein d'un `ProgramTemplate`.
    *   `ProgramAssignment` : L'acte d'assigner un `ProgramTemplate` à un `Client` à une date donnée. C'est la source de vérité de l'assignation.
    *   `ClientProgram` : La copie personnelle du programme pour le client, créée au moment de l'assignation.
    *   `ClientSession` : La copie personnelle de la séance pour le client.

*   **Flux Principal (Assignation depuis la bibliothèque) :**
    1.  **Coach** : Sélectionne un `ProgramTemplate` dans sa bibliothèque.
    2.  **Coach** : Choisit un ou plusieurs `Client(s)` et une date de début.
    3.  **Système** : Appelle la fonction `assign_program_atomic`.
    4.  **Base de données** :
        *   Crée une `ProgramAssignment` pour lier le template, le client et le coach.
        *   Duplique le `ProgramTemplate` en un `ClientProgram`.
        *   Duplique chaque `SessionTemplate` en `ClientSession`.
        *   Duplique chaque exercice de séance en `ClientSessionExercise`.
    5.  **Client** : Voit le `ClientProgram` apparaître comme son programme en cours.

## 3. Analyse Technique et Diagnostic

### 🔴 Cause Racine Identifiée

Le problème principal est une **erreur dans la fonction SQL `assign_program_atomic`** que j'ai découverte en la testant manuellement. La fonction tente de valider la relation entre le coach et le client en interrogeant une table nommée `profiles`, alors que les données des utilisateurs (y compris la colonne `coach_id` essentielle pour cette vérification) se trouvent dans la table `clients`.

> **Erreur retournée par la base de données :**
> `Erreur lors de l'assignation : column "coach_id" does not exist`

Cette erreur bloque toute la transaction d'assignation à sa source. Aucune donnée n'est écrite dans les tables `program_assignments` ou `client_programs`, ce qui explique pourquoi **rien ne se passe** du point de vue de l'utilisateur.

### Analyse Complémentaire

*   **Confusion `profiles` vs `clients`** : Ton projet contient deux tables pour gérer les utilisateurs : `public.profiles` (probablement un reliquat du template Supabase par défaut) et `public.clients` qui contient les informations métier correctes (`role`, `coach_id`, etc.). La fonction SQL interrogeait la mauvaise table.
*   **Cohérence du Modèle de Données** : Le reste du schéma de base de données (tables `program_templates`, `program_assignments`, `client_programs`, etc.) est **correctement implémenté** et suit bien le principe de séparation template/instance. Les policies RLS sont également bien configurées.
*   **Code Frontend (Coach)** : Le code côté coach (`WorkoutLibrary.tsx` et `WorkoutBuilder.tsx`) appelle correctement le service `programAssignmentService`, qui lui-même appelle la bonne fonction RPC `assign_program_atomic`. Le frontend est donc **prêt à fonctionner** une fois la fonction SQL corrigée.
*   **Code Frontend (Client)** : Le code côté client (`ClientCurrentProgram.tsx`) n'est **pas encore à jour**. Il se base sur un ancien système (`user.assignedPrograms`). Il devra être modifié pour charger les données depuis la table `client_programs` après la correction du flux d'assignation.

## 4. Plan de Correction Concret

Je vais procéder en deux temps : un fix rapide pour débloquer la fonctionnalité principale, puis un refactor propre pour aligner le côté client.

### Étape 1 : Correction de la Fonction SQL (Fix Critique)

J'ai préparé et appliqué une migration SQL pour corriger la fonction `assign_program_atomic`. Le changement est simple : la requête de validation cible désormais la table `public.clients`.

*   **Fichier de migration** : `supabase/migrations/20251119_fix_assign_program_function.sql`
*   **Statut** : ✅ **Appliqué**. La fonction est maintenant opérationnelle.

### Étape 2 : Création d'un Service pour la Vue Client

Pour que le client puisse voir son programme, nous devons créer un service frontend pour récupérer les données des tables `client_programs` et associées.

Je vais créer un nouveau fichier de service : `src/services/clientProgramService.ts`.

```typescript
// src/services/clientProgramService.ts

import { supabase } from './supabase';
import { WorkoutProgram } from '../types'; // Adapter si nécessaire

/**
 * Récupère le programme actif assigné à un client.
 * @param clientId - L'ID de l'utilisateur client connecté.
 */
export const getActiveClientProgram = async (clientId: string): Promise<WorkoutProgram | null> => {
  // 1. Trouver l'assignation active
  const { data: assignment, error: assignmentError } = await supabase
    .from('program_assignments')
    .select('id')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .single();

  if (assignmentError || !assignment) {
    console.log('Aucun programme actif trouvé pour le client.', assignmentError);
    return null;
  }

  // 2. Récupérer les détails complets du programme client
  // (Cette partie peut être détaillée dans une fonction séparée comme getClientProgramDetails)
  const { data: clientProgram, error: programError } = await supabase
    .from('client_programs')
    .select('*, client_sessions(*, client_session_exercises(*, exercises(*)))')
    .eq('assignment_id', assignment.id)
    .single();

  if (programError) {
    console.error('Erreur lors de la récupération du programme client:', programError);
    return null;
  }

  // 3. Mapper les données brutes vers le type WorkoutProgram du frontend (logique à implémenter)
  // const mappedProgram = mapSupabaseToFrontend(clientProgram);
  // return mappedProgram;

  return clientProgram as any; // Placeholder, le mapping est nécessaire
};
```

### Étape 3 : Mise à Jour du Composant Client

Ensuite, je modifierai le composant `ClientCurrentProgram.tsx` pour qu'il utilise ce nouveau service au lieu de `user.assignedPrograms`.

```typescript
// Dans src/pages/client/workout/ClientCurrentProgram.tsx

import { getActiveClientProgram } from '../../../services/clientProgramService';

// ...

const ClientCurrentProgram: React.FC = () => {
  const { user } = useAuth();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgram = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      const activeProgram = await getActiveClientProgram(user.id);
      setProgram(activeProgram);
      setIsLoading(false);
    };

    fetchProgram();
  }, [user?.id]);

  // Remplacer toutes les utilisations de `baseProgram` ou `user.assignedPrograms` par `program`

  if (isLoading) {
    return <div>Chargement du programme...</div>;
  }

  if (!program) {
    return <div>Aucun programme en cours.</div>;
  }

  // ... Reste du composant
};
```

## 5. Check-list de Tests

Une fois les modifications appliquées, voici comment valider la correction :

1.  **Test du Flux d'Assignation (Coach)**
    *   [ ] Se connecter en tant que **coach**.
    *   [ ] Aller dans la **Bibliothèque** de séances.
    *   [ ] Choisir un programme et cliquer sur **Assigner**.
    *   [ ] Sélectionner un client et valider.
    *   [ ] **Vérification BDD** : Confirmer qu'une nouvelle ligne a été créée dans `program_assignments` et `client_programs`.

2.  **Test du Flux de Consultation (Client)**
    *   [ ] Se connecter en tant que **client** (celui qui a reçu l'assignation).
    *   [ ] Accéder à la section "Programme en cours".
    *   [ ] **Vérification UI** : Le programme assigné doit s'afficher correctement.

## 6. Prochaine Étape Proposée

Je vais maintenant procéder à la création du service `clientProgramService.ts` et à la mise à jour du composant `ClientCurrentProgram.tsx` comme décrit ci-dessus. Je te tiendrai informé une fois que ce sera fait pour que tu puisses tester le flux complet.
'''
