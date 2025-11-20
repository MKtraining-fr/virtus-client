# Guide de Déploiement et de Test

## 1. Contexte

Ce document finalise la résolution du bug critique affectant l'assignation des programmes. Le problème venait d'une erreur dans la fonction SQL `assign_program_atomic` qui interrogeait la mauvaise table (`profiles` au lieu de `clients`) pour valider la relation coach-client. La correction a été appliquée côté base de données et le code frontend a été mis à jour pour refléter le nouveau modèle de données.

## 2. Fichiers Modifiés

Voici la liste des fichiers qui ont été modifiés ou créés. Vous devrez les intégrer dans votre projet.

1.  **`supabase/migrations/20251119_fix_assign_program_function.sql`** (Correction SQL)
    *   **Action :** Ce script a déjà été appliqué à votre base de données Supabase. Vous pouvez le conserver dans vos migrations pour garder une trace des changements.

2.  **`src/pages/client/workout/ClientCurrentProgram.tsx`** (Composant Frontend)
    *   **Action :** Remplacer le contenu de votre fichier existant par celui-ci.
    *   **Changements :**
        *   Suppression de l'ancienne logique basée sur `user.assignedPrograms`.
        *   Intégration d'un `useEffect` pour appeler le service `getClientAssignedPrograms` au chargement du composant.
        *   Ajout d'un état de chargement (`isProgramLoading`) pour améliorer l'expérience utilisateur.
        *   La logique de passage au "programme suivant" a été commentée car elle dépendait de l'ancien système. Elle pourra être réimplémentée dans un second temps si nécessaire.

## 3. Plan de Test Complet

Pour valider de bout en bout que la correction fonctionne, veuillez suivre les étapes suivantes dans l'ordre.

### Étape A : Préparation des Données (Coach)

1.  **Connectez-vous en tant que Coach.**
2.  Allez dans la section de création de programmes (`Workout Builder` ou `Bibliothèque`).
3.  Créez un **nouveau programme template complet**. Assurez-vous qu'il contient au moins :
    *   Une ou plusieurs semaines.
    *   Au moins une séance par semaine.
    *   Au moins un ou deux exercices par séance.
    *   **Ceci est crucial**, car mes tests ont montré que le programme assigné était vide car le template lui-même n'avait pas de séances.

### Étape B : Test du Flux d'Assignation (Coach)

1.  Toujours connecté en tant que **Coach**, allez dans votre bibliothèque de programmes.
2.  Trouvez le programme complet que vous venez de créer.
3.  Cliquez sur **"Assigner"**.
4.  Sélectionnez un de vos **clients de test** dans la liste.
5.  Choisissez une date de début et validez l'assignation.
6.  **Attendu :** Vous devriez recevoir une notification de succès. Aucune erreur ne doit apparaître.

### Étape C : Test de la Vue Client (Client)

1.  **Déconnectez-vous** du compte Coach.
2.  **Connectez-vous avec le compte du Client** à qui vous venez d'assigner le programme.
3.  Naviguez vers la page qui affiche le programme en cours (probablement "Mon Programme" ou "Workout").
4.  **Attendu :**
    *   Un message "Chargement de votre programme..." devrait apparaître brièvement.
    *   Le programme que vous avez assigné à l'étape B doit s'afficher correctement avec ses séances et ses exercices.
    *   Si aucun programme n'est assigné, le message "Aucun programme ou séance active" doit s'afficher.

## 4. Conclusion

Une fois ces étapes validées, le bug sera entièrement corrigé. La base de données est saine, et le flux de données entre le backend et le frontend est maintenant cohérent. N'hésitez pas si vous avez la moindre question lors de l'intégration de ces changements.
