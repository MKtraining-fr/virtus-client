# Guide de Migration des Interfaces Utilisateur

**Objectif** : Adapter les composants React pour utiliser les nouveaux services refactorisés  
**Date** : 19 novembre 2025

---

## Vue d'Ensemble

Les services TypeScript ont été refactorisés pour utiliser le nouveau modèle de données. Les interfaces utilisateur doivent maintenant être adaptées pour appeler ces nouveaux services. Ce guide fournit des instructions détaillées pour chaque page à modifier.

---

## Modifications par Page

### 1. WorkoutLibrary.tsx - Bibliothèque de Programmes

**Localisation** : `src/pages/WorkoutLibrary.tsx`

**Problème actuel** : Le bouton "Assigner" appelle probablement l'ancienne fonction RPC ou un service obsolète.

**Solution** :

Importer le nouveau service :
```typescript
import { assignProgramToClient } from '../services/programAssignmentService';
```

Remplacer la logique d'assignation :
```typescript
const handleAssignProgram = async (templateId: string, clientId: string, startDate: string) => {
  const result = await assignProgramToClient(
    templateId,
    clientId,
    coachId, // ID du coach connecté
    startDate
  );

  if (result.success) {
    toast.success(`Programme assigné avec succès !`);
    // Rafraîchir la liste ou afficher un compteur
  } else {
    toast.error(`Erreur : ${result.message || result.error}`);
  }
};
```

**Modale de sélection** :

Créer une modale qui permet de :
- Sélectionner un ou plusieurs clients (liste déroulante ou checkboxes)
- Choisir une date de début (date picker)
- Valider l'assignation

**Affichage du compteur d'assignations** :

Utiliser `getAssignmentCountByTemplate` pour afficher combien de clients ont ce programme :
```typescript
import { getAssignmentCountByTemplate } from '../services/programAssignmentService';

const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});

useEffect(() => {
  const loadCounts = async () => {
    const counts = await getAssignmentCountByTemplate(coachId);
    setAssignmentCounts(counts);
  };
  loadCounts();
}, [coachId]);

// Dans le rendu
<span>{assignmentCounts[program.id] || 0} clients</span>
```

---

### 2. ClientProfile.tsx - Profil Client (Vue Coach)

**Localisation** : `src/pages/ClientProfile.tsx`

**Problème actuel** : La section "Programmes Assignés" lit probablement depuis les anciennes tables.

**Solution** :

Importer les nouveaux services :
```typescript
import { getAssignmentsForClient, updateAssignmentStatus, deleteAssignment, getAssignmentSummary } from '../services/programAssignmentService';
```

Charger les assignations :
```typescript
const [assignments, setAssignments] = useState<ProgramAssignment[]>([]);

useEffect(() => {
  const loadAssignments = async () => {
    const data = await getAssignmentsForClient(clientId);
    setAssignments(data);
  };
  loadAssignments();
}, [clientId]);
```

Afficher les assignations :
```typescript
{assignments.map((assignment) => (
  <div key={assignment.id}>
    <h3>{/* Nom du programme - à récupérer via join ou getAssignmentSummary */}</h3>
    <p>Statut : {assignment.status}</p>
    <p>Début : {new Date(assignment.start_date).toLocaleDateString('fr-FR')}</p>
    <p>Progression : Semaine {assignment.current_week}, Séance {assignment.current_session_order}</p>
    
    <button onClick={() => handleArchive(assignment.id)}>Archiver</button>
    <button onClick={() => handlePause(assignment.id)}>Suspendre</button>
    <button onClick={() => handleDelete(assignment.id)}>Supprimer</button>
  </div>
))}
```

Actions :
```typescript
const handleArchive = async (assignmentId: string) => {
  const success = await updateAssignmentStatus(assignmentId, 'archived');
  if (success) {
    toast.success('Programme archivé');
    // Rafraîchir la liste
  }
};

const handlePause = async (assignmentId: string) => {
  const success = await updateAssignmentStatus(assignmentId, 'paused');
  if (success) {
    toast.success('Programme suspendu');
  }
};

const handleDelete = async (assignmentId: string) => {
  if (confirm('Supprimer cette assignation ? Toutes les données du client seront perdues.')) {
    const success = await deleteAssignment(assignmentId);
    if (success) {
      toast.success('Assignation supprimée');
      // Rafraîchir la liste
    }
  }
};
```

Afficher le résumé détaillé :
```typescript
const [summary, setSummary] = useState<any>(null);

const handleViewSummary = async (assignmentId: string) => {
  const data = await getAssignmentSummary(assignmentId);
  setSummary(data);
  // Afficher dans une modale ou un panneau latéral
};
```

---

### 3. ClientWorkout.tsx - Programme en Cours (Vue Client)

**Localisation** : `src/pages/client/ClientWorkout.tsx`

**Problème actuel** : L'encart "Programme en cours" lit probablement depuis les anciennes tables.

**Solution** :

Importer le nouveau service :
```typescript
import { getActiveAssignmentsForClient } from '../services/programAssignmentService';
import { getAssignedProgramDetails } from '../services/clientProgramService';
```

Charger le programme actif :
```typescript
const [activeProgram, setActiveProgram] = useState<any>(null);

useEffect(() => {
  const loadActiveProgram = async () => {
    const assignments = await getActiveAssignmentsForClient(clientId);
    
    if (assignments.length > 0) {
      // Prendre la première assignation active
      const firstAssignment = assignments[0];
      const programDetails = await getAssignedProgramDetails(firstAssignment.id);
      setActiveProgram(programDetails);
    }
  };
  loadActiveProgram();
}, [clientId]);
```

Afficher le programme :
```typescript
{activeProgram && (
  <div>
    <h2>{activeProgram.name}</h2>
    <p>Semaine {activeProgram.currentWeek} - Séance {activeProgram.currentSession}</p>
    <button onClick={() => navigate(`/client/perform-workout/${activeProgram.assignmentId}`)}>
      Commencer la séance
    </button>
  </div>
)}
```

---

### 4. ClientProgram.tsx - Détails du Programme (Vue Client)

**Localisation** : `src/pages/client/ClientProgram.tsx`

**Problème actuel** : Lit probablement depuis les anciennes tables.

**Solution** :

Importer le nouveau service :
```typescript
import { getAssignedProgramDetails } from '../services/clientProgramService';
```

Charger les détails :
```typescript
const { assignmentId } = useParams(); // Récupérer l'ID depuis l'URL
const [program, setProgram] = useState<WorkoutProgram | null>(null);

useEffect(() => {
  const loadProgram = async () => {
    const data = await getAssignedProgramDetails(assignmentId!);
    setProgram(data);
  };
  loadProgram();
}, [assignmentId]);
```

Afficher la structure :
```typescript
{program && (
  <div>
    <h1>{program.name}</h1>
    <p>{program.objective}</p>
    
    {Object.entries(program.sessionsByWeek).map(([week, sessions]) => (
      <div key={week}>
        <h2>Semaine {week}</h2>
        {sessions.map((session, index) => (
          <div key={session.id}>
            <h3>Séance {index + 1} : {session.name}</h3>
            <ul>
              {session.exercises.map((exercise: any) => (
                <li key={exercise.id}>
                  {exercise.name} - {exercise.sets} séries
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ))}
  </div>
)}
```

---

### 5. Nouvelle Page : PerformWorkout.tsx

**Localisation** : `src/pages/client/PerformWorkout.tsx` (à créer)

**Objectif** : Permettre au client de remplir sa séance et d'enregistrer ses performances.

**Structure de la page** :

```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignedProgramDetails, markSessionAsCompleted, updateClientProgress } from '../../services/clientProgramService';
import { bulkCreatePerformanceLogs } from '../../services/performanceLogService';

const PerformWorkout: React.FC = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState<any>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>({});

  useEffect(() => {
    const loadSession = async () => {
      const programData = await getAssignedProgramDetails(assignmentId!);
      setProgram(programData);
      
      // Récupérer la séance actuelle en fonction de currentWeek et currentSession
      const week = programData.currentWeek;
      const sessionOrder = programData.currentSession;
      const session = programData.sessionsByWeek[week]?.[sessionOrder - 1];
      setCurrentSession(session);
    };
    loadSession();
  }, [assignmentId]);

  const handleSetComplete = (exerciseId: string, setNumber: number, data: any) => {
    setPerformanceData({
      ...performanceData,
      [`${exerciseId}_${setNumber}`]: data,
    });
  };

  const handleCompleteWorkout = async () => {
    // Enregistrer toutes les performances
    for (const exercise of currentSession.exercises) {
      const sets = [];
      for (let i = 1; i <= exercise.sets; i++) {
        const key = `${exercise.id}_${i}`;
        if (performanceData[key]) {
          sets.push({
            set_number: i,
            reps_achieved: performanceData[key].reps,
            load_achieved: performanceData[key].load,
            rpe: performanceData[key].rpe,
            notes: performanceData[key].notes,
          });
        }
      }
      
      if (sets.length > 0) {
        await bulkCreatePerformanceLogs(exercise.id, clientId, sets);
      }
    }

    // Marquer la séance comme terminée
    await markSessionAsCompleted(currentSession.id);

    // Mettre à jour la progression
    const nextSessionOrder = program.currentSession + 1;
    const nextWeek = nextSessionOrder > program.sessionsByWeek[program.currentWeek].length 
      ? program.currentWeek + 1 
      : program.currentWeek;
    
    await updateClientProgress(assignmentId!, nextWeek, nextSessionOrder);

    // Rediriger avec message de félicitations
    toast.success('Séance terminée ! Bravo 💪');
    navigate('/client/dashboard');
  };

  return (
    <div>
      <h1>{currentSession?.name}</h1>
      
      {currentSession?.exercises.map((exercise: any, index: number) => (
        <div key={exercise.id}>
          <h2>{index + 1}. {exercise.name}</h2>
          <p>Consignes : {exercise.sets} séries de {exercise.details[0].reps} reps</p>
          
          {Array.from({ length: exercise.sets }).map((_, setIndex) => (
            <div key={setIndex}>
              <h3>Série {setIndex + 1}</h3>
              <input 
                type="number" 
                placeholder="Reps effectuées"
                onChange={(e) => handleSetComplete(exercise.id, setIndex + 1, {
                  ...performanceData[`${exercise.id}_${setIndex + 1}`],
                  reps: parseInt(e.target.value),
                })}
              />
              <input 
                type="text" 
                placeholder="Charge (ex: 50kg)"
                onChange={(e) => handleSetComplete(exercise.id, setIndex + 1, {
                  ...performanceData[`${exercise.id}_${setIndex + 1}`],
                  load: e.target.value,
                })}
              />
              <input 
                type="number" 
                min="1" 
                max="10" 
                placeholder="RPE (1-10)"
                onChange={(e) => handleSetComplete(exercise.id, setIndex + 1, {
                  ...performanceData[`${exercise.id}_${setIndex + 1}`],
                  rpe: parseInt(e.target.value),
                })}
              />
            </div>
          ))}
        </div>
      ))}

      <button onClick={handleCompleteWorkout}>
        Terminer la séance
      </button>
    </div>
  );
};

export default PerformWorkout;
```

**Route à ajouter** :

Dans `App.tsx` ou le fichier de routes :
```typescript
<Route path="/client/perform-workout/:assignmentId" element={<PerformWorkout />} />
```

---

## Checklist de Migration

### Phase 1 : Services (✅ Complété)
- [x] Refactoriser `programAssignmentService.ts`
- [x] Refactoriser `clientProgramService.ts`
- [x] Créer `performanceLogService.ts`

### Phase 2 : Interfaces Coach
- [ ] Modifier `WorkoutLibrary.tsx` (bouton Assigner)
- [ ] Modifier `ClientProfile.tsx` (section Programmes Assignés)
- [ ] Tester l'assignation depuis la bibliothèque
- [ ] Tester la visualisation dans le profil client

### Phase 3 : Interfaces Client
- [ ] Modifier `ClientWorkout.tsx` (encart Programme en cours)
- [ ] Modifier `ClientProgram.tsx` (détails du programme)
- [ ] Créer `PerformWorkout.tsx` (réalisation de séance)
- [ ] Ajouter la route `/client/perform-workout/:assignmentId`
- [ ] Tester le parcours complet client

### Phase 4 : Tests
- [ ] Test assignation : Coach → Client
- [ ] Test visualisation : Client voit son programme
- [ ] Test séance : Client remplit sa séance
- [ ] Test performances : Logs enregistrés correctement
- [ ] Test progression : Séance suivante activée
- [ ] Test sécurité : RLS fonctionne

---

## Points d'Attention

**Types TypeScript** : Les nouveaux services utilisent des types mis à jour (`ProgramAssignment`, `AssignProgramResult`). Assure-toi que les types sont importés correctement.

**Gestion des erreurs** : Tous les services retournent `null`, `false` ou un objet avec `success: false` en cas d'erreur. Vérifie toujours le retour avant d'afficher les données.

**Autosave** : Pour `PerformWorkout.tsx`, implémente un système d'autosave pour ne pas perdre les données si le client ferme la page.

**Optimistic UI** : Pour une meilleure UX, mets à jour l'interface immédiatement (optimistic update) puis synchronise avec la base de données.

---

## Conclusion

Ce guide fournit toutes les informations nécessaires pour migrer les interfaces utilisateur vers les nouveaux services. Chaque modification est documentée avec des exemples de code prêts à l'emploi. Une fois ces modifications appliquées, le système d'assignation sera entièrement fonctionnel.
