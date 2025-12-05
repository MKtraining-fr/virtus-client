# Conception des Statistiques de Séance - Virtus

## Vue d'ensemble

Conception d'une fenêtre modale en deux panneaux pour afficher les statistiques de performance et recueillir le feedback du pratiquant après validation d'une séance.

## Architecture de la Modale

### Structure à deux panneaux

**Panneau 1 (Gauche) : Statistiques de Performance**
- Affichage des métriques de la séance réalisée
- Comparaison avec la semaine précédente
- Indicateurs visuels de progression

**Panneau 2 (Droite) : Questionnaire de Feedback**
- 4 questions avec échelles de 0 à 10
- Zone de commentaire libre
- Indicateur visuel (flèche) pour guider vers ce panneau

### Navigation
- Croix de fermeture en haut à droite (permet de fermer sans répondre)
- Après fermeture : redirection automatique vers la page entraînement avec compteur mis à jour

## Métriques Proposées

### 1. Métriques Demandées

#### Pourcentage de Complétion de la Séance
```
Formule : (Séries réalisées / Séries programmées) × 100
Affichage : Barre de progression circulaire + pourcentage
```

#### Augmentation des Performances vs Semaine Précédente
```
Métriques comparées :
- Tonnage total : Σ(charge × répétitions) pour tous les exercices
- Charge moyenne : Moyenne des charges utilisées
- Répétitions moyennes : Moyenne des répétitions effectuées

Affichage : 
- Pourcentage d'augmentation/diminution
- Icône ↑ (vert) / ↓ (rouge) / → (gris)
- Message "Première séance" si pas de données précédentes
```

#### Moyenne de Répétitions
```
Formule : Σ(répétitions) / Nombre total de séries réalisées
Affichage : Nombre avec 1 décimale
```

#### Moyenne de Charge
```
Formule : Σ(charges) / Nombre total de séries avec charge
Affichage : Nombre avec 1 décimale + unité (kg/lbs)
```

#### Tonnage Total
```
Formule : Σ(charge × répétitions) pour toutes les séries
Affichage : Nombre entier + "kg" ou "tonnes" si > 1000kg
```

### 2. Métriques Additionnelles Pertinentes

#### Volume Total (Nombre de Séries)
```
Formule : Nombre total de séries réalisées
Utilité : Indicateur de charge d'entraînement
```

#### Temps de Séance
```
Formule : Durée totale de la séance (si chronomètre utilisé)
Affichage : Format MM:SS ou HH:MM:SS
Utilité : Suivi de l'efficacité et de l'intensité
```

#### Intensité Moyenne (si RPE disponible)
```
Formule : Moyenne des RPE renseignés
Affichage : X/10
Utilité : Évaluation de l'effort perçu
```

#### Exercices Complétés
```
Formule : Nombre d'exercices avec au moins une série / Total exercices
Affichage : "X/Y exercices"
```

#### Record Personnel (PR)
```
Détection : Charge maximale > toutes les séances précédentes pour un exercice
Affichage : Badge "🏆 Nouveau PR!" si applicable
```

#### Progression Hebdomadaire
```
Calcul : Comparaison du tonnage total avec moyenne des 4 dernières semaines
Affichage : Graphique en ligne simple ou pourcentage
```

## Questionnaire de Feedback

### Questions Définitives

1. **Niveau de Fatigue Pré-Séance**
   - Question : "Étais-tu fatigué(e) avant de débuter la séance ?"
   - Échelle : 0 (très fatigué(e)) à 10 (en pleine forme)
   - Type : Slider avec labels aux extrémités

2. **Qualité du Sommeil**
   - Question : "As-tu bien dormi(e) la veille de la séance ?"
   - Échelle : 0 (très mal dormi(e)) à 10 (très bien dormi(e))
   - Type : Slider avec labels aux extrémités

3. **Difficulté Perçue**
   - Question : "As-tu trouvé(e) la séance difficile physiquement ?"
   - Échelle : 0 (une balade de santé) à 10 (très difficile)
   - Type : Slider avec labels aux extrémités

4. **Appréciation de la Séance**
   - Question : "As-tu aimé(e) la séance ?"
   - Échelle : 0 (pas aimé(e)) à 10 (j'ai adoré(e))
   - Type : Slider avec labels aux extrémités

### Zone de Commentaire
- Champ texte multiligne
- Placeholder : "Ajoute un commentaire sur ta séance (optionnel)..."
- Limite : 500 caractères

## Structure des Données

### Interface TypeScript pour les Statistiques

```typescript
interface SessionStats {
  // Métriques de base
  completionRate: number; // Pourcentage 0-100
  totalSets: number;
  completedSets: number;
  totalExercises: number;
  completedExercises: number;
  
  // Métriques de performance
  averageReps: number;
  averageLoad: number;
  totalTonnage: number;
  loadUnit: string; // 'kg' | 'lbs'
  
  // Comparaison avec semaine précédente
  previousWeekStats?: {
    totalTonnage: number;
    averageLoad: number;
    averageReps: number;
  };
  
  // Progression (calculée)
  tonnageChange?: number; // Pourcentage
  loadChange?: number; // Pourcentage
  repsChange?: number; // Pourcentage
  
  // Métriques optionnelles
  sessionDuration?: number; // Secondes
  personalRecords?: Array<{
    exerciseName: string;
    load: number;
    reps: number;
  }>;
  averageRPE?: number;
}
```

### Interface TypeScript pour le Feedback

```typescript
interface SessionFeedback {
  sessionId: string;
  clientId: string;
  performanceLogId: string;
  
  // Réponses aux questions (0-10)
  preFatigue: number;
  sleepQuality: number;
  perceivedDifficulty: number;
  enjoyment: number;
  
  // Commentaire optionnel
  comment?: string;
  
  // Métadonnées
  submittedAt: string; // ISO timestamp
}
```

## Calcul des Statistiques

### Fonction de Calcul Principale

```typescript
function calculateSessionStats(
  exerciseLogs: ExerciseLog[],
  activeSession: WorkoutSession,
  previousWeekLog?: PerformanceLog
): SessionStats {
  // 1. Calculer les séries totales programmées
  const totalSets = activeSession.exercises.reduce(
    (sum, ex) => sum + parseInt(ex.sets || '0', 10),
    0
  );
  
  // 2. Compter les séries réalisées
  const completedSets = exerciseLogs.reduce(
    (sum, log) => sum + log.loggedSets.length,
    0
  );
  
  // 3. Calculer le taux de complétion
  const completionRate = totalSets > 0 
    ? Math.round((completedSets / totalSets) * 100) 
    : 0;
  
  // 4. Calculer les moyennes
  let totalReps = 0;
  let totalLoad = 0;
  let totalTonnage = 0;
  let setsWithLoad = 0;
  
  exerciseLogs.forEach(log => {
    log.loggedSets.forEach(set => {
      const reps = parseFloat(set.reps) || 0;
      const load = parseFloat(set.load) || 0;
      
      totalReps += reps;
      if (load > 0) {
        totalLoad += load;
        setsWithLoad++;
      }
      totalTonnage += reps * load;
    });
  });
  
  const averageReps = completedSets > 0 
    ? totalReps / completedSets 
    : 0;
  const averageLoad = setsWithLoad > 0 
    ? totalLoad / setsWithLoad 
    : 0;
  
  // 5. Calculer les changements vs semaine précédente
  let tonnageChange: number | undefined;
  let loadChange: number | undefined;
  let repsChange: number | undefined;
  
  if (previousWeekLog) {
    const prevStats = calculatePreviousStats(previousWeekLog);
    
    tonnageChange = prevStats.totalTonnage > 0
      ? ((totalTonnage - prevStats.totalTonnage) / prevStats.totalTonnage) * 100
      : undefined;
      
    loadChange = prevStats.averageLoad > 0
      ? ((averageLoad - prevStats.averageLoad) / prevStats.averageLoad) * 100
      : undefined;
      
    repsChange = prevStats.averageReps > 0
      ? ((averageReps - prevStats.averageReps) / prevStats.averageReps) * 100
      : undefined;
  }
  
  return {
    completionRate,
    totalSets,
    completedSets,
    totalExercises: activeSession.exercises.length,
    completedExercises: exerciseLogs.length,
    averageReps: Math.round(averageReps * 10) / 10,
    averageLoad: Math.round(averageLoad * 10) / 10,
    totalTonnage: Math.round(totalTonnage),
    loadUnit: 'kg', // À adapter selon les préférences utilisateur
    previousWeekStats: previousWeekLog ? calculatePreviousStats(previousWeekLog) : undefined,
    tonnageChange: tonnageChange ? Math.round(tonnageChange * 10) / 10 : undefined,
    loadChange: loadChange ? Math.round(loadChange * 10) / 10 : undefined,
    repsChange: repsChange ? Math.round(repsChange * 10) / 10 : undefined,
  };
}
```

## Design UI/UX

### Layout Responsive

**Desktop (≥768px)**
```
┌─────────────────────────────────────────────────────┐
│  Statistiques de Séance                    [X]      │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   📊 STATISTIQUES    │   📝 QUESTIONNAIRE      →    │
│                      │                              │
│   [Métriques]        │   [4 Questions]              │
│   [Comparaisons]     │   [Commentaire]              │
│                      │                              │
│                      │   [Bouton Valider]           │
└──────────────────────┴──────────────────────────────┘
```

**Mobile (<768px)**
```
┌─────────────────────────────┐
│  Stats de Séance       [X]  │
├─────────────────────────────┤
│                             │
│   📊 STATISTIQUES           │
│   [Métriques compactes]     │
│                             │
├─────────────────────────────┤
│   📝 QUESTIONNAIRE     →    │
│   [4 Questions]             │
│   [Commentaire]             │
│   [Bouton Valider]          │
└─────────────────────────────┘
```

### Palette de Couleurs

- **Progression positive** : Vert (#10B981)
- **Progression négative** : Rouge (#EF4444)
- **Neutre/Maintien** : Gris (#6B7280)
- **Accent principal** : Bleu primary du thème
- **Fond statistiques** : Gris clair / Dark mode adapté

### Animations

- Apparition de la modale : Fade in + Scale (0.95 → 1)
- Affichage des statistiques : Stagger animation (décalage de 50ms)
- Barre de progression : Animation de remplissage (1s)
- Flèche indicateur : Pulse subtil pour attirer l'attention

## Stockage des Données

### Table Supabase : `session_feedback`

```sql
CREATE TABLE session_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  performance_log_id TEXT, -- Référence au log de performance
  
  -- Réponses aux questions (0-10)
  pre_fatigue INTEGER CHECK (pre_fatigue >= 0 AND pre_fatigue <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 0 AND sleep_quality <= 10),
  perceived_difficulty INTEGER CHECK (perceived_difficulty >= 0 AND perceived_difficulty <= 10),
  enjoyment INTEGER CHECK (enjoyment >= 0 AND enjoyment <= 10),
  
  -- Commentaire optionnel
  comment TEXT,
  
  -- Métadonnées
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index pour recherche rapide
  CONSTRAINT unique_session_feedback UNIQUE (client_id, session_id, submitted_at)
);

CREATE INDEX idx_session_feedback_client ON session_feedback(client_id);
CREATE INDEX idx_session_feedback_session ON session_feedback(session_id);
CREATE INDEX idx_session_feedback_submitted ON session_feedback(submitted_at DESC);
```

## Flux Utilisateur

1. **Pratiquant termine la séance** → Clique sur "Terminer la séance"
2. **Sauvegarde des performances** → Backend enregistre les données
3. **Ouverture de la modale** → Affichage automatique des statistiques
4. **Consultation des stats** → Pratiquant voit ses performances
5. **Navigation vers questionnaire** → Flèche guide vers le panneau droit
6. **Remplissage optionnel** → Pratiquant peut répondre ou fermer
7. **Validation ou fermeture** → Redirection vers page entraînement
8. **Mise à jour du compteur** → Affichage de la progression du programme

## Prochaines Étapes d'Implémentation

1. ✅ Créer les interfaces TypeScript
2. ✅ Implémenter la fonction de calcul des statistiques
3. ✅ Créer le composant modal avec les deux panneaux
4. ✅ Intégrer le questionnaire avec validation
5. ✅ Créer le service de sauvegarde du feedback
6. ✅ Intégrer dans le flux de validation de séance
7. ✅ Tester avec données réelles
8. ✅ Ajuster le design responsive
