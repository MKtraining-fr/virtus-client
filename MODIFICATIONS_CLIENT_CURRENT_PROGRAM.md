# Modifications à Apporter à ClientCurrentProgram.tsx

**Date** : 2 décembre 2025

## Problème Identifié

Le composant `ClientCurrentProgram.tsx` gère actuellement :
- ✅ L'enregistrement des performances via `savePerformanceLog()`
- ❌ La progression du programme localement (dans l'état `clients`)
- ❌ Ne marque pas la séance comme complétée dans `client_sessions`
- ❌ Ne met pas à jour `program_assignments` dans Supabase

## Modifications Nécessaires

### 1. Importer les Services Manquants

**Ligne 16-17** : Ajouter les imports

```typescript
import { savePerformanceLog } from '../../../services/performanceLogService';
import { updateSessionStatus } from '../../../services/clientSessionService';
import { updateClientProgress, markSessionAsCompleted } from '../../../services/clientProgramService';
```

### 2. Modifier la Fonction `handleFinishSession`

**Après la ligne 450** (après `savePerformanceLog`), ajouter :

```typescript
// ✅ AJOUT: Marquer la séance comme complétée dans Supabase
const sessionMarked = await markSessionAsCompleted(sessionId);

if (!sessionMarked) {
  console.error('Échec du marquage de la séance comme complétée');
  addNotification({
    message: 'Erreur lors de la mise à jour de la séance. Veuillez réessayer.',
    type: 'error'
  });
  // Ne pas bloquer, mais logger l'erreur
}

// ✅ AJOUT: Mettre à jour la progression dans program_assignments
if (programAssignmentId) {
  const currentProgramWeek = user.programWeek || 1;
  const sessionsForCurrentWeek =
    localProgram.sessionsByWeek[currentProgramWeek] || localProgram.sessionsByWeek[1] || [];
  const totalSessionsForCurrentWeek = sessionsForCurrentWeek.length;
  const currentSessionProgress = user.sessionProgress || 1;
  
  // Calculer la prochaine séance
  let nextSessionProgress = currentSessionProgress + 1;
  let nextProgramWeek = currentProgramWeek;
  
  if (nextSessionProgress > totalSessionsForCurrentWeek) {
    nextProgramWeek++;
    nextSessionProgress = 1;
  }
  
  const progressUpdated = await updateClientProgress(
    programAssignmentId,
    nextProgramWeek,
    nextSessionProgress
  );
  
  if (!progressUpdated) {
    console.warn('Échec de la mise à jour de la progression');
    // Ne pas bloquer, mais logger l'avertissement
  }
}
```

### 3. Problème Plus Profond : Gestion Locale vs Supabase

Le composant `ClientCurrentProgram.tsx` utilise actuellement :
- `user?.assignedProgram` : Chargé depuis l'état local
- `user?.programWeek` : Progression stockée localement
- `user?.sessionProgress` : Progression stockée localement

**Solution recommandée** :
1. Charger les programmes assignés depuis Supabase au montage du composant
2. Utiliser `getClientAssignedPrograms(user.id)` pour récupérer les programmes
3. Afficher le programme actif (status = 'active')
4. Utiliser `currentWeek` et `currentSessionOrder` depuis `program_assignments`

### 4. Refactoring Complet (Optionnel mais Recommandé)

**Nouvelle structure** :

```typescript
const ClientCurrentProgram: React.FC = () => {
  const { user, addNotification } = useAuth();
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
      addNotification({
        message: 'Erreur lors du chargement de votre programme',
        type: 'error'
      });
    } finally {
      setIsLoadingPrograms(false);
    }
  };
  
  // Utiliser selectedProgram au lieu de baseProgram
  const currentWeek = selectedProgram?.currentWeek || 1;
  const currentSessionOrder = selectedProgram?.currentSession || 1;
  
  // Reste du code...
};
```

## Modifications Minimales (Solution Rapide)

Si on ne veut pas refactoriser complètement, voici les modifications minimales :

### Fichier : `src/pages/client/workout/ClientCurrentProgram.tsx`

**Ligne 16** : Ajouter les imports

```typescript
import { updateSessionStatus } from '../../../services/clientSessionService';
import { updateClientProgress, markSessionAsCompleted } from '../../../services/clientProgramService';
```

**Ligne 450** : Après `savePerformanceLog`, ajouter

```typescript
// Marquer la séance comme complétée
await markSessionAsCompleted(sessionId);

// Mettre à jour la progression
if (programAssignmentId) {
  const nextSessionProgress = (user.sessionProgress || 1) + 1;
  const nextProgramWeek = user.programWeek || 1;
  await updateClientProgress(programAssignmentId, nextProgramWeek, nextSessionProgress);
}
```

## Résultat Attendu

Après ces modifications :
1. ✅ Les séances sont marquées comme complétées dans `client_sessions`
2. ✅ La progression est mise à jour dans `program_assignments`
3. ✅ Le compteur d'entraînements peut être calculé depuis la base
4. ✅ Le coach peut voir les séances complétées

---

**Auteur** : Manus AI  
**Date** : 2 décembre 2025
