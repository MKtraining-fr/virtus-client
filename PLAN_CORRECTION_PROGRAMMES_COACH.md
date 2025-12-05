# 🛠️ Plan de correction : Programmes invisibles côté coach

**Date** : 5 décembre 2024  
**Objectif** : Permettre aux coaches de voir et accéder aux programmes qu'ils ont créés

---

## 🎯 Découverte clé

`client_created_programs` est une **VUE SQL** (alias de `client_programs`) qui expose uniquement les colonnes de base :

```sql
CREATE VIEW client_created_programs AS
SELECT id, assignment_id, client_id, coach_id, name, objective, 
       week_count, created_at, updated_at
FROM client_programs;
```

**Problème** : Le code frontend essaie de lire des colonnes (`source_type`, `program_template_id`, `modified_by_client`, `viewed_by_coach`) qui n'existent **ni dans la vue, ni dans la table `client_programs`**.

---

## 📊 Solutions proposées

### ✅ Solution 1 : Simplifier le code frontend (RECOMMANDÉE)

**Principe** : Adapter le code pour utiliser uniquement les colonnes disponibles.

**Avantages** :
- Pas de modification du schéma de base de données
- Alignement avec l'architecture actuelle
- Changements minimes et ciblés

**Inconvénients** :
- Perte de certaines fonctionnalités (badges "créé par client", "modifié", etc.)

---

### ⚙️ Solution 2 : Enrichir la vue avec des colonnes calculées

**Principe** : Recréer la vue `client_created_programs` avec des colonnes supplémentaires.

**Avantages** :
- Rétrocompatibilité totale avec le code existant
- Possibilité d'ajouter des métadonnées

**Inconvénients** :
- Modification du schéma de base de données
- Nécessite de déterminer comment calculer les valeurs manquantes

---

## 🚀 Solution 1 : Simplifier le code frontend (détaillée)

### Étape 1 : Mettre à jour le service `coachProgramViewService.ts`

**Fichier** : `src/services/coachProgramViewService.ts`

#### Modifications :

1. **Simplifier l'interface `ClientCreatedProgramView`** :

```typescript
export interface ClientCreatedProgramView {
  id: string;
  assignment_id: string | null;
  client_id: string;
  client_name: string;
  name: string;
  objective: string;
  week_count: number;
  status: string; // Calculé depuis assignment_id
  created_at: string;
}
```

2. **Adapter la requête** :

```typescript
export const getClientCreatedProgramsForCoach = async (
  coachId: string
): Promise<ClientCreatedProgramView[]> => {
  try {
    const { data, error } = await supabase
      .from('client_created_programs')
      .select(`
        id,
        assignment_id,
        client_id,
        name,
        objective,
        week_count,
        created_at,
        clients!client_programs_client_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des programmes:', error);
      throw error;
    }

    const programs: ClientCreatedProgramView[] = (data || []).map((prog: any) => ({
      id: prog.id,
      assignment_id: prog.assignment_id,
      client_id: prog.client_id,
      client_name: `${prog.clients.first_name} ${prog.clients.last_name}`,
      name: prog.name,
      objective: prog.objective,
      week_count: prog.week_count,
      status: prog.assignment_id ? 'assigned' : 'draft',
      created_at: prog.created_at,
    }));

    return programs;
  } catch (error) {
    console.error('Erreur globale:', error);
    return [];
  }
};
```

---

### Étape 2 : Simplifier le composant `ClientCreatedProgramsList.tsx`

**Fichier** : `src/components/coach/ClientCreatedProgramsList.tsx`

#### Modifications :

1. **Retirer les badges basés sur les colonnes inexistantes** :

```typescript
<div className="flex items-start justify-between">
  <div className="flex-1">
    <h4 className="text-lg font-semibold text-gray-900">{program.name}</h4>
    <p className="text-sm text-gray-600 mt-1">
      <span className="font-medium">Client :</span> {program.client_name}
    </p>
    <p className="text-sm text-gray-600">
      <span className="font-medium">Objectif :</span> {program.objective || 'Non défini'}
    </p>
    <p className="text-sm text-gray-600">
      <span className="font-medium">Durée :</span> {program.week_count} semaine(s)
    </p>
    <p className="text-sm text-gray-600">
      <span className="font-medium">Statut :</span>{' '}
      <span
        className={`px-2 py-1 rounded text-xs ${
          program.status === 'assigned'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {program.status === 'assigned' ? 'Assigné' : 'Brouillon'}
      </span>
    </p>
  </div>
</div>
```

2. **Simplifier les actions** :

```typescript
<div className="mt-4 flex gap-2">
  {onProgramClick && (
    <Button 
      onClick={() => onProgramClick(program)} 
      variant="primary" 
      className="flex-1"
    >
      📋 Voir les détails
    </Button>
  )}
</div>
```

---

### Étape 3 : Créer une page de détail pour le coach

**Fichier** : `src/pages/coach/ProgramDetail.tsx` (nouveau)

```typescript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProgramDetailForCoach } from '../../services/coachClientProgramService';
import ProgramDetailView from '../../components/ProgramDetailView';
import Button from '../../components/Button';
import { WorkoutProgram } from '../../types';

const ProgramDetail: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgram = async () => {
      if (!programId) return;
      setLoading(true);
      const data = await getProgramDetailForCoach(programId);
      setProgram(data);
      setLoading(false);
    };

    fetchProgram();
  }, [programId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
        <div className="text-center py-10">Chargement du programme...</div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
        <div className="text-center py-10">
          <p className="text-gray-500">Programme introuvable.</p>
          <Button onClick={() => navigate('/coach/programs')} className="mt-4">
            Retour à la bibliothèque
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button onClick={() => navigate('/coach/programs')} variant="secondary">
          ← Retour à la bibliothèque
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">{program.name}</h1>
        {program.objective && (
          <p className="text-gray-600 mt-2">{program.objective}</p>
        )}
      </div>

      <ProgramDetailView program={program} />
    </div>
  );
};

export default ProgramDetail;
```

---

### Étape 4 : Créer le service de récupération du détail

**Fichier** : `src/services/coachClientProgramService.ts` (nouveau)

```typescript
import { supabase } from './supabase';
import { WorkoutProgram, WorkoutSession, WorkoutExercise } from '../types';

/**
 * Récupère le détail complet d'un programme pour le coach
 * Inclut toutes les séances et exercices
 */
export const getProgramDetailForCoach = async (
  programId: string
): Promise<WorkoutProgram | null> => {
  try {
    // 1. Récupérer le programme
    const { data: programData, error: programError } = await supabase
      .from('client_programs')
      .select('id, name, objective, week_count, client_id')
      .eq('id', programId)
      .single();

    if (programError || !programData) {
      console.error('Erreur lors de la récupération du programme:', programError);
      return null;
    }

    // 2. Récupérer toutes les séances du programme
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('client_sessions')
      .select(`
        id,
        name,
        week_number,
        session_order,
        status
      `)
      .eq('client_program_id', programId)
      .order('week_number', { ascending: true })
      .order('session_order', { ascending: true });

    if (sessionsError) {
      console.error('Erreur lors de la récupération des séances:', sessionsError);
      return null;
    }

    // 3. Pour chaque séance, récupérer les exercices
    const sessionsByWeek: Record<number, WorkoutSession[]> = {};

    for (const session of sessionsData || []) {
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('client_session_exercises')
        .select(`
          id,
          exercise_id,
          exercise_order,
          sets,
          reps,
          load,
          tempo,
          rest_time,
          intensification,
          notes,
          exercises!client_session_exercises_exercise_id_fkey (
            name,
            image_url
          )
        `)
        .eq('client_session_id', session.id)
        .order('exercise_order', { ascending: true });

      if (exercisesError) {
        console.error('Erreur lors de la récupération des exercices:', exercisesError);
        continue;
      }

      // Transformer les exercices au format WorkoutExercise
      const exercises: WorkoutExercise[] = (exercisesData || []).map((ex: any, index: number) => ({
        id: index + 1,
        exerciseId: ex.exercise_id,
        name: ex.exercises?.name || 'Exercice inconnu',
        illustrationUrl: ex.exercises?.image_url || '',
        sets: String(ex.sets || ''),
        isDetailed: true,
        details: Array.from({ length: ex.sets || 1 }, () => ({
          reps: ex.reps || '',
          load: { value: ex.load || '', unit: 'kg' as const },
          tempo: ex.tempo || '',
          rest: ex.rest_time || '',
        })),
        intensification: [],
        alternatives: [],
      }));

      // Créer la session
      const workoutSession: WorkoutSession = {
        id: session.session_order,
        name: session.name,
        exercises,
      };

      // Ajouter la séance à la semaine correspondante
      if (!sessionsByWeek[session.week_number]) {
        sessionsByWeek[session.week_number] = [];
      }
      sessionsByWeek[session.week_number].push(workoutSession);
    }

    // 4. Construire le programme complet
    const program: WorkoutProgram = {
      id: programData.id,
      name: programData.name,
      objective: programData.objective || '',
      weekCount: programData.week_count,
      clientId: programData.client_id,
      sessionsByWeek,
    };

    return program;
  } catch (error) {
    console.error('Erreur globale lors de la récupération du programme:', error);
    return null;
  }
};
```

---

### Étape 5 : Mettre à jour la page `ClientCreatedPrograms.tsx`

**Fichier** : `src/pages/coach/ClientCreatedPrograms.tsx`

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ClientCreatedProgramsList from '../../components/coach/ClientCreatedProgramsList';
import { ClientCreatedProgramView } from '../../services/coachProgramViewService';

const ClientCreatedPrograms: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role !== 'coach') {
    return <div>Accès refusé</div>;
  }

  const handleProgramClick = (program: ClientCreatedProgramView) => {
    navigate(`/coach/programs/${program.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Bibliothèque d'Entraînement
        </h1>
        <p className="text-gray-600 mt-2">
          Consultez et gérez les programmes d'entraînement de vos clients.
        </p>
      </div>
      <ClientCreatedProgramsList 
        coachId={user.id} 
        onProgramClick={handleProgramClick}
      />
    </div>
  );
};

export default ClientCreatedPrograms;
```

---

### Étape 6 : Ajouter la route dans le routeur

**Fichier** : `src/App.tsx` (ou le fichier de routes)

```typescript
// Ajouter cette route dans les routes coach
<Route path="/coach/programs/:programId" element={<ProgramDetail />} />
```

---

## 🧪 Tests à effectuer

### Test 1 : Affichage de la bibliothèque
1. Se connecter en tant que coach
2. Naviguer vers `/coach/programs`
3. **Vérifier** : Le programme "Nouveau programme" apparaît dans la liste

### Test 2 : Accès au détail
1. Cliquer sur "Voir les détails" du programme
2. **Vérifier** : La page de détail s'affiche avec le tableau des séances
3. **Vérifier** : Les 8 séances sont visibles avec leurs exercices

### Test 3 : Vérification côté client
1. Se connecter en tant que client (Mickael Roncin)
2. **Vérifier** : Le programme est toujours visible et fonctionnel

### Test 4 : Création d'un nouveau programme
1. Créer un nouveau programme via l'interface coach
2. L'assigner à un client
3. **Vérifier** : Il apparaît dans la bibliothèque du coach
4. **Vérifier** : Il apparaît dans l'interface du client

---

## 📋 Résumé des fichiers modifiés

### Fichiers à modifier :
1. `src/services/coachProgramViewService.ts` - Simplifier l'interface et la requête
2. `src/components/coach/ClientCreatedProgramsList.tsx` - Retirer les badges obsolètes
3. `src/pages/coach/ClientCreatedPrograms.tsx` - Ajouter la navigation vers le détail

### Fichiers à créer :
1. `src/services/coachClientProgramService.ts` - Service de récupération du détail
2. `src/pages/coach/ProgramDetail.tsx` - Page de détail du programme
3. Route dans le routeur pour `/coach/programs/:programId`

---

## 🎯 Avantages de cette solution

✅ **Pas de modification de la base de données**  
✅ **Réutilisation du composant `ProgramDetailView` existant**  
✅ **Alignement avec l'architecture actuelle**  
✅ **Code simple et maintenable**  
✅ **Fonctionnalité complète : liste + détail**

---

## 🚨 Points d'attention

- La vue `client_created_programs` ne peut pas être modifiée sans recréer la vue SQL
- Si tu veux ajouter des colonnes supplémentaires (comme `source_type`), il faudra :
  1. Ajouter ces colonnes à la table `client_programs`
  2. Recréer la vue `client_created_programs` pour les inclure
