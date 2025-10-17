# Stratégie d'Intégration des Services Supabase avec WorkoutBuilder

**Auteur** : Manus AI  
**Date** : 17 octobre 2025

## Vue d'ensemble

Ce document décrit la stratégie d'intégration des services Supabase créés (`programService`, `sessionService`, `clientProgramService`, `clientInfoService`) avec l'interface utilisateur existante `WorkoutBuilder.tsx`.

## État actuel

Actuellement, `WorkoutBuilder.tsx` utilise le contexte `AuthContext` pour gérer les programmes et les séances **en mémoire**. Cela signifie que :

- Les programmes et séances sont stockés dans le state React via `useAuth()`
- Les données ne sont pas persistées dans Supabase
- Les assignations aux clients sont gérées localement
- Les informations client (notes, historique) ne sont pas récupérées depuis Supabase

## Objectif de l'intégration

L'objectif est de **connecter `WorkoutBuilder.tsx` aux services Supabase** pour :

1. **Sauvegarder automatiquement** les programmes et séances dans Supabase lors de leur création/modification
2. **Charger les programmes et séances** depuis Supabase au démarrage de l'application
3. **Créer des instances client** (copies personnalisées) lors de l'assignation d'un programme/séance à un client
4. **Récupérer les informations client** (notes du coach, infos médicales, historique) depuis Supabase et les afficher dans l'interface

## Changements nécessaires

### 1. Modification de la logique de sauvegarde

**Fichier concerné** : `WorkoutBuilder.tsx`

**Changements** :

- Ajouter un bouton "Sauvegarder" ou "Valider" qui appelle les services Supabase
- Lors de la sauvegarde d'un **programme** :
  - Appeler `createProgram()` ou `updateProgram()` selon le mode (création/édition)
  - Pour chaque semaine du programme, appeler `createSession()` pour créer les séances
  - Pour chaque exercice de chaque séance, appeler `addExerciseToSession()`
- Lors de la sauvegarde d'une **séance standalone** :
  - Appeler `createSession()` avec `program_id = null`
  - Pour chaque exercice, appeler `addExerciseToSession()`

**Code exemple** :

```typescript
const handleSaveProgram = async () => {
  try {
    // 1. Créer le programme (matrice)
    const program = await createProgram({
      name: programName,
      objective: objective,
      week_count: Number(weekCount),
    });

    if (!program) throw new Error('Failed to create program');

    // 2. Créer les séances pour chaque semaine
    for (const [weekNum, sessions] of Object.entries(sessionsByWeek)) {
      for (const session of sessions) {
        const createdSession = await createSession({
          program_id: program.id,
          name: session.name,
          week_number: Number(weekNum),
          session_order: session.id,
        });

        if (!createdSession) continue;

        // 3. Ajouter les exercices à la séance
        for (const exercise of session.exercises) {
          await addExerciseToSession(createdSession.id, {
            exercise_id: exercise.exerciseId,
            exercise_order: exercise.id,
            sets: parseInt(exercise.sets),
            reps: exercise.details[0]?.reps,
            load: `${exercise.details[0]?.load.value}${exercise.details[0]?.load.unit}`,
            tempo: exercise.details[0]?.tempo,
            rest_time: exercise.details[0]?.rest,
            intensification: exercise.intensification,
            notes: exercise.notes,
          });
        }
      }
    }

    // 4. Si un client est sélectionné, créer une instance client
    if (selectedClient !== '0') {
      await assignProgramToClient({
        program_template_id: program.id,
        client_id: selectedClient,
        name: programName,
        objective: objective,
        week_count: Number(weekCount),
      });
    }

    addNotification('Programme sauvegardé avec succès !', 'success');
    navigate('/library');
  } catch (error) {
    console.error('Error saving program:', error);
    addNotification('Erreur lors de la sauvegarde du programme', 'error');
  }
};
```

### 2. Modification de la logique de chargement

**Fichier concerné** : `WorkoutLibrary.tsx` (et potentiellement `AuthContext.tsx`)

**Changements** :

- Au démarrage de l'application, appeler `getCoachPrograms()` et `getCoachSessions()` pour charger les programmes et séances depuis Supabase
- Stocker ces données dans le contexte `AuthContext` ou dans le state local de `WorkoutLibrary`
- Lors de l'édition d'un programme, charger les séances associées via `getProgramSessions()` et les exercices via `getSessionExercises()`

**Code exemple** :

```typescript
useEffect(() => {
  const loadProgramsAndSessions = async () => {
    const programs = await getCoachPrograms();
    const sessions = await getCoachSessions();
    setPrograms(programs);
    setSessions(sessions);
  };

  loadProgramsAndSessions();
}, []);
```

### 3. Affichage des informations client

**Fichier concerné** : `WorkoutBuilder.tsx`

**Changements** :

- Lorsqu'un client est sélectionné, appeler `getClientProfile()` pour récupérer les notes du coach et les infos médicales
- Appeler `getClientProgramHistory()` pour récupérer l'historique des programmes du client
- Afficher ces informations dans les sections appropriées de l'interface

**Code exemple** :

```typescript
useEffect(() => {
  const loadClientInfo = async () => {
    if (selectedClient === '0') return;

    const profile = await getClientProfile(selectedClient);
    const history = await getClientProgramHistory(selectedClient, 3);

    if (profile) {
      setClientNotes(profile.coach_notes || '');
      setClientMedicalInfo(profile.medical_info || '');
    }

    setClientHistory(history);
  };

  loadClientInfo();
}, [selectedClient]);
```

### 4. Gestion des matrices vs instances

**Concept clé** :

- **Matrice** : Le template de base créé par le coach (stocké dans `programs`, `sessions`, `session_exercises`)
- **Instance** : La copie personnalisée assignée à un client (stockée dans `client_programs`, `client_sessions`, `client_session_exercises`)

**Logique** :

- Lorsqu'un coach crée un programme/séance **sans** sélectionner de client, seule la **matrice** est créée
- Lorsqu'un coach crée un programme/séance **avec** un client sélectionné, la **matrice** est créée ET une **instance** est créée pour le client
- Lorsqu'un client modifie son programme (ajoute des performances, notes, etc.), seule **l'instance** est modifiée, la **matrice** reste inchangée
- Un coach peut assigner la même matrice à plusieurs clients, créant ainsi plusieurs instances indépendantes

## Points d'attention

### 1. Mapping des données

Les structures de données actuelles dans `WorkoutBuilder.tsx` (types `WorkoutSession`, `WorkoutProgram`, etc.) devront être mappées vers les structures de données Supabase (types `Session`, `Program`, etc.).

**Exemple de mapping** :

```typescript
// WorkoutSession (frontend) -> Session (Supabase)
const mapWorkoutSessionToSession = (workoutSession: WorkoutSession, programId: string, weekNumber: number): SessionInput => {
  return {
    program_id: programId,
    name: workoutSession.name,
    week_number: weekNumber,
    session_order: workoutSession.id,
  };
};
```

### 2. Gestion des IDs

- Les IDs actuels dans `WorkoutBuilder` sont des nombres auto-incrémentés (`id: 1, 2, 3...`)
- Les IDs dans Supabase sont des UUIDs (`id: 'a1b2c3d4-...'`)
- Il faudra adapter la logique pour gérer ces UUIDs

### 3. Performance

- Sauvegarder un programme complet avec toutes ses séances et exercices peut générer de nombreuses requêtes Supabase
- Il faudra peut-être optimiser en utilisant des transactions ou des insertions en batch

### 4. Gestion des erreurs

- Ajouter une gestion robuste des erreurs pour informer l'utilisateur en cas de problème de sauvegarde/chargement
- Utiliser les notifications existantes (`addNotification`) pour afficher les messages d'erreur/succès

## Plan d'implémentation

### Phase 1 : Sauvegarde des programmes/séances (Priorité haute)

1. Ajouter un bouton "Sauvegarder" dans `WorkoutBuilder.tsx`
2. Implémenter la fonction `handleSaveProgram()` qui appelle les services Supabase
3. Tester la sauvegarde d'un programme simple avec une séance et un exercice

### Phase 2 : Chargement des programmes/séances (Priorité haute)

1. Modifier `WorkoutLibrary.tsx` pour charger les programmes/séances depuis Supabase
2. Modifier `WorkoutBuilder.tsx` pour charger un programme existant en mode édition
3. Tester le chargement et l'affichage d'un programme sauvegardé

### Phase 3 : Assignation aux clients (Priorité moyenne)

1. Implémenter la logique de création d'instances client lors de l'assignation
2. Tester l'assignation d'un programme à un client
3. Vérifier que les instances sont bien créées dans Supabase

### Phase 4 : Affichage des informations client (Priorité moyenne)

1. Récupérer et afficher les notes du coach et les infos médicales
2. Récupérer et afficher l'historique des programmes du client
3. Tester l'affichage de ces informations dans l'interface

### Phase 5 : Tests et optimisations (Priorité basse)

1. Tester l'ensemble du flux de création, sauvegarde, chargement et assignation
2. Optimiser les requêtes Supabase si nécessaire
3. Améliorer la gestion des erreurs et les messages utilisateur

## Questions ouvertes

1. **Faut-il conserver les données en mémoire dans `AuthContext` en plus de Supabase ?**
   - Avantage : Performance, pas besoin de recharger depuis Supabase à chaque fois
   - Inconvénient : Synchronisation complexe entre le state local et Supabase

2. **Faut-il sauvegarder automatiquement lors de chaque modification, ou seulement lors d'un clic sur "Sauvegarder" ?**
   - Auto-save : Meilleure UX, pas de perte de données
   - Save manuel : Plus de contrôle, moins de requêtes Supabase

3. **Comment gérer les programmes/séances créés avant l'implémentation de Supabase ?**
   - Migration des données existantes ?
   - Ou simplement ignorer et repartir de zéro ?

## Conclusion

L'intégration des services Supabase avec `WorkoutBuilder.tsx` nécessitera des modifications significatives de la logique de sauvegarde et de chargement, mais elle permettra de bénéficier d'une persistance des données robuste et d'une gestion avancée des matrices et des instances client.

Je recommande de procéder par phases, en commençant par la sauvegarde et le chargement des programmes/séances, puis en ajoutant progressivement les fonctionnalités d'assignation et d'affichage des informations client.

**Prochaine étape** : Obtenir votre validation sur cette stratégie avant de commencer l'implémentation.

