# Corrections à Implémenter - Flux Assignation & Séances

**Date** : 2 décembre 2025

## 1. Compréhension du Problème

### Flux à Implémenter

Le système doit gérer le flux complet suivant :

**Assignation programme → visibilité élève → séance réalisée → compteur +1 → visibilité coach**

### État Actuel

✅ **Schéma Supabase** : Toutes les tables ont été créées avec succès
- `program_templates`, `session_templates`, `session_exercise_templates`
- `program_assignments`
- `client_programs`, `client_sessions`, `client_session_exercises`
- `performance_logs`

✅ **Services** : Les services existent et sont bien structurés
- `programAssignmentService.ts` : Gestion des assignations
- `clientProgramService.ts` : Récupération des programmes clients
- `performanceLogService.ts` : Enregistrement des performances
- `clientSessionService.ts` : Gestion des séances clients

❌ **Problèmes Identifiés** :
1. La fonction `markSessionAsCompleted()` dans `clientProgramService.ts` utilise la mauvaise table
2. Les composants client ne chargent pas les programmes depuis Supabase
3. Le compteur d'entraînements n'est pas calculé depuis la base
4. Pas d'interface coach pour voir les séances des clients

---

## 2. Exploration du Code & de la Base

### Fichiers Analysés

#### Services
- ✅ `src/services/programAssignmentService.ts` : Bien structuré, utilise la fonction RPC `assign_program_atomic`
- ✅ `src/services/clientProgramService.ts` : Bien structuré, mais bug dans `markSessionAsCompleted()`
- ✅ `src/services/performanceLogService.ts` : Bien structuré, utilise `client_exercise_performance`
- ⚠️ `src/services/clientSessionService.ts` : À vérifier

#### Composants Client
- ⚠️ `src/pages/client/workout/ClientCurrentProgram.tsx` : Utilise `user?.assignedProgram` au lieu de charger depuis Supabase
- ⚠️ `src/pages/client/workout/ClientMyPrograms.tsx` : À vérifier
- ⚠️ `src/pages/client/ClientDashboard.tsx` : Compteur d'entraînements à vérifier

#### Stores
- ⚠️ `src/stores/useDataStore.ts` : Vérifie si les programmes assignés sont chargés
- ⚠️ `src/stores/useAuthStore.ts` : Vérifie la structure de `user`

### Problèmes Détectés

#### Problème 1 : `markSessionAsCompleted()` utilise la mauvaise table

**Fichier** : `src/services/clientProgramService.ts` (lignes 370-389)

**Code actuel** :
```typescript
export const markSessionAsCompleted = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sessions') // ❌ MAUVAISE TABLE
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
    // ...
  }
};
```

**Correction nécessaire** :
```typescript
export const markSessionAsCompleted = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_sessions') // ✅ BONNE TABLE
      .update({
        status: 'completed', // ✅ Mettre à jour le statut
        completed_at: new Date().toISOString(), // ✅ Enregistrer la date de complétion
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
    
    if (error) {
      console.error('Erreur lors du marquage de la séance:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur globale:', error);
    return false;
  }
};
```

#### Problème 2 : `updateClientProgress()` utilise le mauvais nom de colonne

**Fichier** : `src/services/clientProgramService.ts` (lignes 337-362)

**Code actuel** :
```typescript
const { error } = await supabase
  .from('program_assignments')
  .update({
    current_week: currentWeek,
    current_session: currentSessionOrder, // ❌ MAUVAIS NOM DE COLONNE
    updated_at: new Date().toISOString(),
  })
  .eq('id', assignmentId);
```

**Correction nécessaire** :
```typescript
const { error } = await supabase
  .from('program_assignments')
  .update({
    current_week: currentWeek,
    current_session_order: currentSessionOrder, // ✅ BON NOM DE COLONNE
    updated_at: new Date().toISOString(),
  })
  .eq('id', assignmentId);
```

---

## 3. Plan d'Action Détaillé

### Étape 1 : Corriger les Services (PRIORITÉ HAUTE)

#### Fichier : `src/services/clientProgramService.ts`

**Modifications** :
1. Corriger `markSessionAsCompleted()` pour utiliser `client_sessions` et mettre à jour `status` et `completed_at`
2. Corriger `updateClientProgress()` pour utiliser `current_session_order` au lieu de `current_session`

#### Fichier : `src/services/clientSessionService.ts`

**Vérifications** :
1. Vérifier que `updateSessionStatus()` existe et fonctionne correctement
2. Vérifier que `getClientSessionExerciseId()` fonctionne correctement
3. Créer `getCompletedSessionsCount(clientId)` pour calculer le compteur d'entraînements

**Nouveau code à ajouter** :
```typescript
/**
 * Compte le nombre de séances complétées par un client
 * 
 * @param clientId - ID du client
 * @returns Le nombre de séances complétées
 */
export const getCompletedSessionsCount = async (clientId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('client_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'completed');
    
    if (error) {
      console.error('Erreur lors du comptage des séances:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Erreur globale lors du comptage:', error);
    return 0;
  }
};

/**
 * Met à jour le statut d'une séance
 * 
 * @param sessionId - ID de la séance
 * @param status - Nouveau statut (pending/completed/skipped)
 * @returns true si succès, false sinon
 */
export const updateSessionStatus = async (
  sessionId: string,
  status: 'pending' | 'completed' | 'skipped'
): Promise<boolean> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('client_sessions')
      .update(updateData)
      .eq('id', sessionId);
    
    if (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur globale:', error);
    return false;
  }
};
```

### Étape 2 : Brancher les Programmes Assignés Côté Client (PRIORITÉ HAUTE)

#### Fichier : `src/pages/client/workout/ClientCurrentProgram.tsx`

**Problème actuel** :
```typescript
const baseProgram = user?.assignedProgram; // ❌ Utilise l'état local
```

**Correction nécessaire** :
1. Utiliser `getClientAssignedPrograms(clientId)` pour charger les programmes depuis Supabase
2. Afficher la liste des programmes assignés
3. Permettre au client de sélectionner un programme actif
4. Charger les séances du programme sélectionné

**Nouveau code à ajouter** :
```typescript
import { getClientAssignedPrograms } from '../../../services/clientProgramService';

const ClientCurrentProgram: React.FC = () => {
  const { user } = useAuth();
  const [assignedPrograms, setAssignedPrograms] = useState<WorkoutProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  
  // Charger les programmes assignés au montage
  useEffect(() => {
    if (user?.id) {
      loadAssignedPrograms();
    }
  }, [user?.id]);
  
  const loadAssignedPrograms = async () => {
    setIsLoadingPrograms(true);
    try {
      const programs = await getClientAssignedPrograms(user!.id);
      setAssignedPrograms(programs);
      
      // Sélectionner automatiquement le premier programme actif
      const activeProgram = programs.find(p => p.status === 'active');
      if (activeProgram) {
        setSelectedProgram(activeProgram);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des programmes:', error);
    } finally {
      setIsLoadingPrograms(false);
    }
  };
  
  // Reste du code...
};
```

### Étape 3 : Implémenter l'Enregistrement de Séance Terminée (PRIORITÉ HAUTE)

#### Fichier : `src/pages/client/workout/ClientCurrentProgram.tsx`

**Modifications** :
1. À la fin de la séance, appeler `savePerformanceLog()` pour enregistrer les performances
2. Appeler `updateSessionStatus(sessionId, 'completed')` pour marquer la séance comme complétée
3. Appeler `updateClientProgress(assignmentId, currentWeek, nextSessionOrder)` pour mettre à jour la progression
4. Recharger les programmes assignés pour rafraîchir l'affichage

**Nouveau code à ajouter** :
```typescript
import { savePerformanceLog } from '../../../services/performanceLogService';
import { updateSessionStatus } from '../../../services/clientSessionService';
import { updateClientProgress } from '../../../services/clientProgramService';

const handleFinishSession = async () => {
  try {
    // 1. Enregistrer les performances
    const performanceLogId = await savePerformanceLog(
      user!.id,
      selectedProgram!.assignmentId,
      currentSessionId,
      performanceLog,
      user!.coach_id
    );
    
    if (!performanceLogId) {
      throw new Error('Erreur lors de l\'enregistrement des performances');
    }
    
    // 2. Marquer la séance comme complétée
    const sessionUpdated = await updateSessionStatus(currentSessionId, 'completed');
    
    if (!sessionUpdated) {
      throw new Error('Erreur lors de la mise à jour du statut de la séance');
    }
    
    // 3. Mettre à jour la progression
    const nextSessionOrder = selectedSessionIndex + 2; // +1 pour l'index 0-based, +1 pour la prochaine séance
    const progressUpdated = await updateClientProgress(
      selectedProgram!.assignmentId!,
      currentWeek,
      nextSessionOrder
    );
    
    if (!progressUpdated) {
      console.warn('Erreur lors de la mise à jour de la progression');
    }
    
    // 4. Afficher le modal de félicitations
    setIsCongratsModalOpen(true);
    
    // 5. Recharger les programmes pour rafraîchir l'affichage
    await loadAssignedPrograms();
    
  } catch (error) {
    console.error('Erreur lors de la finalisation de la séance:', error);
    alert('Une erreur est survenue lors de l\'enregistrement de la séance. Veuillez réessayer.');
  }
};
```

### Étape 4 : Calculer le Compteur d'Entraînements Depuis la Base (PRIORITÉ MOYENNE)

#### Fichier : `src/pages/client/ClientDashboard.tsx`

**Modifications** :
1. Utiliser `getCompletedSessionsCount(clientId)` pour calculer le compteur
2. Afficher le compteur depuis la base au lieu de l'état local

**Nouveau code à ajouter** :
```typescript
import { getCompletedSessionsCount } from '../../services/clientSessionService';

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [trainingCount, setTrainingCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  
  useEffect(() => {
    if (user?.id) {
      loadTrainingCount();
    }
  }, [user?.id]);
  
  const loadTrainingCount = async () => {
    setIsLoadingCount(true);
    try {
      const count = await getCompletedSessionsCount(user!.id);
      setTrainingCount(count);
    } catch (error) {
      console.error('Erreur lors du chargement du compteur:', error);
    } finally {
      setIsLoadingCount(false);
    }
  };
  
  // Afficher le compteur
  return (
    <div>
      <h2>Mes Entraînements</h2>
      {isLoadingCount ? (
        <p>Chargement...</p>
      ) : (
        <p className="text-2xl font-bold">{trainingCount} entraînements</p>
      )}
    </div>
  );
};
```

### Étape 5 : Créer l'Interface Coach pour Visualiser les Séances (PRIORITÉ MOYENNE)

#### Nouveau fichier : `src/services/coachClientProgramService.ts`

**Fonctions à créer** :
```typescript
/**
 * Récupère les séances complétées d'un client pour un coach
 * 
 * @param coachId - ID du coach
 * @param clientId - ID du client (optionnel)
 * @returns Liste des séances complétées avec détails
 */
export const getClientCompletedSessions = async (
  coachId: string,
  clientId?: string
): Promise<any[]> => {
  try {
    let query = supabase
      .from('client_sessions')
      .select(`
        id,
        name,
        week_number,
        session_order,
        status,
        completed_at,
        client_id,
        client_program_id,
        client_programs!inner (
          id,
          name,
          coach_id
        ),
        client_session_exercises (
          id,
          exercise_id,
          sets,
          reps,
          load,
          exercises (
            id,
            name
          )
        )
      `)
      .eq('client_programs.coach_id', coachId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erreur lors de la récupération des séances:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};

/**
 * Récupère les détails de performance d'une séance
 * 
 * @param sessionId - ID de la séance
 * @returns Détails de performance avec logs
 */
export const getSessionPerformanceDetails = async (sessionId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('client_sessions')
      .select(`
        id,
        name,
        completed_at,
        client_session_exercises (
          id,
          exercise_id,
          sets,
          reps,
          load,
          exercises (
            id,
            name
          ),
          client_exercise_performance (
            id,
            set_number,
            reps_achieved,
            load_achieved,
            rpe,
            notes,
            performed_at
          )
        )
      `)
      .eq('id', sessionId)
      .single();
    
    if (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erreur globale:', error);
    return null;
  }
};
```

#### Nouveau fichier : `src/pages/coach/ClientProgressView.tsx`

**Composant à créer** :
```typescript
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getClientCompletedSessions } from '../../services/coachClientProgramService';

const ClientProgressView: React.FC = () => {
  const { user, clients } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (user?.id) {
      loadCompletedSessions();
    }
  }, [user?.id, selectedClientId]);
  
  const loadCompletedSessions = async () => {
    setIsLoading(true);
    try {
      const sessions = await getClientCompletedSessions(user!.id, selectedClientId || undefined);
      setCompletedSessions(sessions);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Progression des Clients</h1>
      
      {/* Sélecteur de client */}
      <div className="mb-4">
        <label htmlFor="client-select" className="block mb-2">Filtrer par client :</label>
        <select
          id="client-select"
          value={selectedClientId || ''}
          onChange={(e) => setSelectedClientId(e.target.value || null)}
          className="border p-2 rounded"
        >
          <option value="">Tous les clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.firstName} {client.lastName}
            </option>
          ))}
        </select>
      </div>
      
      {/* Liste des séances */}
      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <div className="space-y-4">
          {completedSessions.map((session) => (
            <div key={session.id} className="border p-4 rounded shadow">
              <h3 className="font-bold">{session.name}</h3>
              <p className="text-sm text-gray-600">
                Complétée le {new Date(session.completed_at).toLocaleDateString()}
              </p>
              <p className="text-sm">Programme : {session.client_programs?.name}</p>
              
              {/* Détails des exercices */}
              <div className="mt-2">
                <h4 className="font-semibold">Exercices :</h4>
                <ul className="list-disc list-inside">
                  {session.client_session_exercises?.map((exercise: any) => (
                    <li key={exercise.id}>
                      {exercise.exercises?.name} - {exercise.sets} séries x {exercise.reps} reps @ {exercise.load}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientProgressView;
```

### Étape 6 : Tester le Flux Complet (PRIORITÉ HAUTE)

#### Checklist de Tests Manuels

☐ **Test 1 : Assignation de programme**
1. Se connecter en tant que coach
2. Aller dans "Bibliothèque" → "Programmes"
3. Créer un nouveau programme template (ou utiliser un existant)
4. Assigner le programme à un client
5. Vérifier qu'aucune erreur n'apparaît

☐ **Test 2 : Visibilité côté client**
1. Se connecter en tant que client (ou utiliser l'impersonation)
2. Aller dans "Mes Programmes"
3. Vérifier que le programme assigné apparaît
4. Vérifier que le statut est "Actif"

☐ **Test 3 : Exécution d'une séance**
1. En tant que client, ouvrir le programme
2. Sélectionner une séance
3. Lancer la séance
4. Renseigner les données (reps, charges, RPE, commentaires)
5. Terminer la séance
6. Vérifier que le message de confirmation s'affiche

☐ **Test 4 : Compteur d'entraînements**
1. Revenir sur la page "Dashboard" ou "Entraînement"
2. Vérifier que le compteur a augmenté de +1
3. Rafraîchir la page (F5)
4. Vérifier que le compteur affiche toujours la bonne valeur

☐ **Test 5 : Visibilité côté coach**
1. Se connecter en tant que coach
2. Aller dans "Clients" → Sélectionner le client
3. Aller dans l'onglet "Progression" ou "Séances"
4. Vérifier que la séance effectuée apparaît
5. Vérifier que les détails (exercices, séries, reps, charges) sont visibles

☐ **Test 6 : Persistance des données**
1. Se déconnecter
2. Se reconnecter
3. Vérifier que toutes les données sont toujours présentes
4. Ouvrir Supabase Dashboard
5. Vérifier les tables `client_sessions`, `client_exercise_performance`, `program_assignments`

---

## 4. Implémentation Guidée

### Ordre d'Implémentation

1. ✅ **Étape 1** : Corriger les services (bugs critiques)
2. ✅ **Étape 2** : Brancher les programmes assignés côté client
3. ✅ **Étape 3** : Implémenter l'enregistrement de séance terminée
4. ✅ **Étape 4** : Calculer le compteur d'entraînements
5. ⏳ **Étape 5** : Créer l'interface coach
6. ⏳ **Étape 6** : Tester le flux complet

### Fichiers à Modifier

1. `src/services/clientProgramService.ts` (corrections bugs)
2. `src/services/clientSessionService.ts` (ajout fonctions)
3. `src/pages/client/workout/ClientCurrentProgram.tsx` (branchement Supabase)
4. `src/pages/client/ClientDashboard.tsx` (compteur)
5. `src/services/coachClientProgramService.ts` (nouveau fichier)
6. `src/pages/coach/ClientProgressView.tsx` (nouveau fichier)

---

## 5. Tests & Validation

### Tests Automatisés

À créer dans `src/test/` :
- `programAssignment.test.ts` : Tests d'assignation
- `clientSession.test.ts` : Tests de séances
- `performanceLog.test.ts` : Tests de logs de performance

### Tests Manuels

Voir la checklist à l'Étape 6 ci-dessus.

---

## 6. Résultat Attendu Concret

### Ce que voit l'élève

1. **Page "Mes Programmes"** : Liste des programmes assignés par le coach
2. **Sélection d'un programme** : Affichage des séances de la semaine en cours
3. **Lancement d'une séance** : Interface d'exécution avec timer et saisie des données
4. **Fin de séance** : Message de félicitations + compteur mis à jour
5. **Dashboard** : Compteur d'entraînements à jour (basé sur la base)

### Ce que voit le coach

1. **Page "Clients"** : Liste des clients avec nombre d'entraînements
2. **Page "Client X"** : Onglets "Programmes", "Progression", "Séances"
3. **Onglet "Séances"** : Liste des séances effectuées avec détails
4. **Détails d'une séance** : Exercices, séries, reps, charges, RPE, commentaires

### Comment le compteur évolue

- **Avant la séance** : Compteur = N (basé sur `SELECT COUNT(*) FROM client_sessions WHERE status = 'completed'`)
- **Après la séance** : Compteur = N+1 (la séance est marquée comme 'completed' en base)
- **Après rafraîchissement** : Compteur = N+1 (les données sont persistées)

---

**Auteur** : Manus AI  
**Date** : 2 décembre 2025  
**Version** : 1.0
