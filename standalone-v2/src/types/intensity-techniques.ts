/**
 * Types et contrat de données pour les techniques d'intensification
 * 
 * Ce fichier définit le contrat d'interface entre le front-end et le backend
 * pour toutes les techniques d'intensification supportées par IronTrack.
 */

// ============================================================================
// TECHNIQUES D'INTENSIFICATION
// ============================================================================

/**
 * Liste exhaustive des techniques d'intensification supportées
 */
export type IntensityTechnique =
  | 'STANDARD'      // Série classique
  | 'DROP_SET'      // Réduction progressive du poids
  | 'REST_PAUSE'    // Micro-repos entre mini-séries
  | 'CLUSTER'       // Repos courts entre chaque rep
  | 'TEMPO'         // Tempo contrôlé avec métronome
  | 'MYO_REPS'      // Série d'activation + mini-séries
  | 'SUPERSET'      // Enchaînement de 2+ exercices
  | 'AMRAP'         // As Many Reps As Possible
  | 'EMOM';         // Every Minute On the Minute

// ============================================================================
// PARAMÈTRES PAR TECHNIQUE
// ============================================================================

/**
 * Paramètres pour DROP SET
 * Réduction progressive du poids sans repos
 */
export interface DropSetParams {
  /** Pourcentage de réduction du poids à chaque drop (ex: 20 = -20%) */
  dropPercentage: number;
  /** Nombre de drops à effectuer */
  numberOfDrops: number;
  /** Reps cibles pour chaque drop */
  repsPerDrop: number[];
}

/**
 * Paramètres pour REST-PAUSE
 * Mini-séries avec micro-repos
 */
export interface RestPauseParams {
  /** Durée du repos entre mini-séries (en secondes) */
  restDuration: number;
  /** Nombre de mini-séries */
  numberOfMiniSets: number;
  /** Reps cibles pour chaque mini-série */
  repsPerMiniSet: number[];
}

/**
 * Paramètres pour CLUSTER SET
 * Repos courts entre chaque rep
 */
export interface ClusterParams {
  /** Durée du repos entre chaque rep (en secondes) */
  restBetweenReps: number;
  /** Nombre total de reps */
  totalReps: number;
  /** Reps par cluster (ex: [3, 2, 2, 1] = 4 clusters) */
  repsPerCluster: number[];
}

/**
 * Paramètres pour TEMPO
 * Contrôle du tempo avec métronome visuel
 */
export interface TempoParams {
  /** Tempo au format "excentrique-pause bas-concentrique-pause haut" (ex: "3-0-1-0") */
  tempo: string;
  /** Afficher le métronome visuel */
  showMetronome: boolean;
  /** Son du métronome activé */
  metronomeSound: boolean;
}

/**
 * Paramètres pour MYO-REPS
 * Série d'activation suivie de mini-séries
 */
export interface MyoRepsParams {
  /** Reps pour la série d'activation */
  activationReps: number;
  /** Durée du repos entre mini-séries (en secondes) */
  restDuration: number;
  /** Reps par mini-série */
  repsPerMiniSet: number;
  /** Nombre de mini-séries */
  numberOfMiniSets: number;
}

/**
 * Paramètres pour SUPERSET
 * Enchaînement de plusieurs exercices
 */
export interface SupersetParams {
  /** IDs des exercices à enchaîner */
  exerciseIds: number[];
  /** Repos entre chaque exercice (en secondes) */
  restBetweenExercises: number;
  /** Repos après le superset complet (en secondes) */
  restAfterSuperset: number;
}

/**
 * Paramètres pour AMRAP
 * As Many Reps As Possible
 */
export interface AmrapParams {
  /** Durée totale en secondes (optionnel, peut être illimité) */
  duration?: number;
  /** Poids fixe */
  weight: number;
}

/**
 * Paramètres pour EMOM
 * Every Minute On the Minute
 */
export interface EmomParams {
  /** Nombre de minutes */
  numberOfMinutes: number;
  /** Reps à compléter chaque minute */
  repsPerMinute: number;
  /** Poids fixe */
  weight: number;
}

/**
 * Union type pour tous les paramètres possibles
 */
export type IntensityTechniqueParams =
  | { type: 'STANDARD'; params: null }
  | { type: 'DROP_SET'; params: DropSetParams }
  | { type: 'REST_PAUSE'; params: RestPauseParams }
  | { type: 'CLUSTER'; params: ClusterParams }
  | { type: 'TEMPO'; params: TempoParams }
  | { type: 'MYO_REPS'; params: MyoRepsParams }
  | { type: 'SUPERSET'; params: SupersetParams }
  | { type: 'AMRAP'; params: AmrapParams }
  | { type: 'EMOM'; params: EmomParams };

// ============================================================================
// TYPES DE SÉRIES
// ============================================================================

/**
 * Type de série
 */
export type SetType =
  | 'WARMUP'        // Série d'échauffement
  | 'WORKING'       // Série de travail
  | 'DROP'          // Série de drop (dans un drop set)
  | 'MINI'          // Mini-série (rest-pause, myo-reps)
  | 'CLUSTER'       // Cluster
  | 'ACTIVATION';   // Série d'activation (myo-reps)

// ============================================================================
// STRUCTURE DE DONNÉES POUR LE BACKEND
// ============================================================================

/**
 * Structure d'une série pour le backend
 * C'est le contrat principal que le backend devra respecter
 */
export interface WorkoutSet {
  /** ID unique de la série */
  id: number;
  
  /** Numéro de la série (1, 2, 3...) */
  setNumber: number;
  
  /** Type de série */
  type: SetType;
  
  /** Poids utilisé (en kg) */
  weight: number;
  
  /** Nombre de répétitions */
  reps: number;
  
  /** Technique d'intensification appliquée */
  intensityTechnique?: IntensityTechniqueParams;
  
  /** Meilleure performance précédente (format: "80kg × 10") */
  previousBest?: string;
  
  /** Série complétée ou non */
  completed: boolean;
  
  /** Timestamp de complétion (ISO 8601) */
  completedAt?: string;
  
  /** RIR (Reps In Reserve) - Reps restantes estimées */
  rir?: number;
  
  /** RPE (Rate of Perceived Exertion) - Échelle 1-10 */
  rpe?: number;
  
  /** Notes de l'athlète */
  notes?: string;
}

/**
 * Structure d'un exercice pour le backend
 */
export interface Exercise {
  /** ID unique de l'exercice */
  id: number;
  
  /** Nom de l'exercice */
  name: string;
  
  /** URL de la vidéo de démonstration */
  videoUrl?: string;
  
  /** Protocole de l'exercice */
  protocol: {
    /** Nombre de séries cibles */
    targetSets: number;
    
    /** Reps cibles (format: "8-12 reps" ou "AMRAP") */
    targetReps: string;
    
    /** Tempo (format: "3-0-1-0") */
    tempo?: string;
    
    /** Repos entre séries (en secondes) */
    restSeconds: number;
    
    /** Technique d'intensification par défaut */
    defaultIntensityTechnique?: IntensityTechniqueParams;
  };
  
  /** Liste des séries */
  sets: WorkoutSet[];
}

/**
 * Structure d'une séance d'entraînement
 */
export interface WorkoutSession {
  /** ID unique de la séance */
  id: number;
  
  /** Nom de la séance */
  name: string;
  
  /** Date de la séance (ISO 8601) */
  date: string;
  
  /** Liste des exercices */
  exercises: Exercise[];
  
  /** Statut de la séance */
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  
  /** Durée totale (en secondes) */
  duration?: number;
  
  /** Notes globales de la séance */
  notes?: string;
}

// ============================================================================
// MÉTADONNÉES DES TECHNIQUES
// ============================================================================

/**
 * Métadonnées d'une technique d'intensification
 * Utilisé pour l'affichage dans l'interface de sélection
 */
export interface IntensityTechniqueMetadata {
  /** Type de la technique */
  type: IntensityTechnique;
  
  /** Nom affiché */
  label: string;
  
  /** Description courte */
  description: string;
  
  /** Icône (emoji ou nom d'icône Lucide) */
  icon: string;
  
  /** Niveau de difficulté (1-5) */
  difficulty: 1 | 2 | 3 | 4 | 5;
  
  /** Objectif principal */
  goal: 'STRENGTH' | 'HYPERTROPHY' | 'ENDURANCE' | 'POWER';
  
  /** Nécessite un partenaire */
  requiresPartner: boolean;
}

/**
 * Catalogue des techniques avec leurs métadonnées
 */
export const INTENSITY_TECHNIQUES_CATALOG: Record<IntensityTechnique, IntensityTechniqueMetadata> = {
  STANDARD: {
    type: 'STANDARD',
    label: 'Standard',
    description: 'Série classique sans technique particulière',
    icon: '💪',
    difficulty: 1,
    goal: 'HYPERTROPHY',
    requiresPartner: false,
  },
  DROP_SET: {
    type: 'DROP_SET',
    label: 'Drop Set',
    description: 'Réduction progressive du poids sans repos',
    icon: '📉',
    difficulty: 4,
    goal: 'HYPERTROPHY',
    requiresPartner: false,
  },
  REST_PAUSE: {
    type: 'REST_PAUSE',
    label: 'Rest-Pause',
    description: 'Mini-séries avec micro-repos de 10-15s',
    icon: '⏸️',
    difficulty: 5,
    goal: 'HYPERTROPHY',
    requiresPartner: false,
  },
  CLUSTER: {
    type: 'CLUSTER',
    label: 'Cluster Set',
    description: 'Repos courts entre chaque rep pour soulever plus lourd',
    icon: '🔗',
    difficulty: 4,
    goal: 'STRENGTH',
    requiresPartner: false,
  },
  TEMPO: {
    type: 'TEMPO',
    label: 'Tempo Contrôlé',
    description: 'Contrôle strict du tempo avec métronome',
    icon: '⏱️',
    difficulty: 3,
    goal: 'HYPERTROPHY',
    requiresPartner: false,
  },
  MYO_REPS: {
    type: 'MYO_REPS',
    label: 'Myo-Reps',
    description: 'Série d\'activation + mini-séries de 3-5 reps',
    icon: '🔥',
    difficulty: 5,
    goal: 'HYPERTROPHY',
    requiresPartner: false,
  },
  SUPERSET: {
    type: 'SUPERSET',
    label: 'Superset',
    description: 'Enchaînement de 2+ exercices sans repos',
    icon: '⚡',
    difficulty: 3,
    goal: 'ENDURANCE',
    requiresPartner: false,
  },
  AMRAP: {
    type: 'AMRAP',
    label: 'AMRAP',
    description: 'As Many Reps As Possible - Compteur ouvert',
    icon: '♾️',
    difficulty: 4,
    goal: 'ENDURANCE',
    requiresPartner: false,
  },
  EMOM: {
    type: 'EMOM',
    label: 'EMOM',
    description: 'Every Minute On the Minute - Reps à compléter chaque minute',
    icon: '⏰',
    difficulty: 4,
    goal: 'ENDURANCE',
    requiresPartner: false,
  },
};
