/**
 * Types pour les configurations des techniques d'intensification adaptatives
 */

// Configuration pour Drop Sets
export interface DropSetConfig {
  applyTo: 'all' | 'last' | 'specific'; // Toutes séries, dernière, ou spécifiques
  specificSets?: number[]; // Si applyTo = 'specific', quelles séries (ex: [3, 4])
  dropLevels: Array<{
    type: 'percentage' | 'weight'; // Type de réduction : pourcentage ou charge précise
    value: number; // Valeur : 20 (%) ou 60 (kg)
    targetReps?: string; // Répétitions cibles optionnelles (ex: "8-10")
  }>;
}

// Configuration pour Rest-Pause
export interface RestPauseConfig {
  applyTo: 'all' | 'last' | 'specific';
  specificSets?: number[];
  pauseDuration: number; // Durée de la micro-pause en secondes (ex: 15)
  miniSets: number; // Nombre de mini-séries après la pause (ex: 2-3)
}

// Configuration pour Myo-Reps
export interface MyoRepsConfig {
  applyTo: 'all' | 'last' | 'specific';
  specificSets?: number[];
  activationSet: {
    targetReps: string; // Reps de la série d'activation (ex: "12-15")
  };
  miniSets: number; // Nombre de mini-séries (ex: 3-5)
  restBetween: number; // Repos entre mini-séries en secondes (ex: 5)
  targetRepsPerMini: string; // Reps par mini-série (ex: "3-5")
}

// Configuration pour Cluster Sets
export interface ClusterSetConfig {
  applyTo: 'all' | 'last' | 'specific';
  specificSets?: number[];
  clusters: number; // Nombre de clusters par série (ex: 3)
  repsPerCluster: string; // Reps par cluster (ex: "2-3")
  restBetweenClusters: number; // Repos entre clusters en secondes (ex: 10-15)
}

// Configuration pour Tempo Contrôlé
export interface TempoConfig {
  applyTo: 'all' | 'last' | 'specific';
  specificSets?: number[];
  eccentric: number; // Phase excentrique en secondes (ex: 4)
  pause1: number; // Pause en bas en secondes (ex: 1)
  concentric: number; // Phase concentrique en secondes (ex: 1)
  pause2: number; // Pause en haut en secondes (ex: 0)
}

// Union type pour toutes les configurations
export type IntensityConfig = 
  | DropSetConfig 
  | RestPauseConfig 
  | MyoRepsConfig 
  | ClusterSetConfig 
  | TempoConfig;

// Type guard functions
export function isDropSetConfig(config: any): config is DropSetConfig {
  return config && 'dropLevels' in config;
}

export function isRestPauseConfig(config: any): config is RestPauseConfig {
  return config && 'pauseDuration' in config && 'miniSets' in config;
}

export function isMyoRepsConfig(config: any): config is MyoRepsConfig {
  return config && 'activationSet' in config && 'miniSets' in config;
}

export function isClusterSetConfig(config: any): config is ClusterSetConfig {
  return config && 'clusters' in config && 'repsPerCluster' in config;
}

export function isTempoConfig(config: any): config is TempoConfig {
  return config && 'eccentric' in config && 'concentric' in config;
}

// Helper pour obtenir le nom de la technique depuis la config
export function getTechniqueTypeFromConfig(config: any): string | null {
  if (isDropSetConfig(config)) return 'drop_set';
  if (isRestPauseConfig(config)) return 'rest_pause';
  if (isMyoRepsConfig(config)) return 'myo_reps';
  if (isClusterSetConfig(config)) return 'cluster_set';
  if (isTempoConfig(config)) return 'tempo';
  return null;
}

// Configurations par défaut
export const DEFAULT_DROP_SET_CONFIG: DropSetConfig = {
  applyTo: 'last',
  dropLevels: [
    { type: 'percentage', value: 20, targetReps: '8-10' },
  ],
};

export const DEFAULT_REST_PAUSE_CONFIG: RestPauseConfig = {
  applyTo: 'last',
  pauseDuration: 15,
  miniSets: 2,
};

export const DEFAULT_MYO_REPS_CONFIG: MyoRepsConfig = {
  applyTo: 'last',
  activationSet: { targetReps: '12-15' },
  miniSets: 3,
  restBetween: 5,
  targetRepsPerMini: '3-5',
};

export const DEFAULT_CLUSTER_SET_CONFIG: ClusterSetConfig = {
  applyTo: 'all',
  clusters: 3,
  repsPerCluster: '2-3',
  restBetweenClusters: 10,
};

export const DEFAULT_TEMPO_CONFIG: TempoConfig = {
  applyTo: 'all',
  eccentric: 4,
  pause1: 1,
  concentric: 1,
  pause2: 0,
};
