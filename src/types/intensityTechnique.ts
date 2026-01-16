// Types pour les techniques d'intensification

export type IntensityTechniqueCategory = 
  | 'series'          // Techniques basées sur l'enchaînement de séries (Superset, Drop set, etc.)
  | 'failure'         // Techniques poussant jusqu'à l'échec musculaire
  | 'partial'         // Techniques utilisant des amplitudes partielles ou des pauses
  | 'tempo'           // Techniques jouant sur la vitesse d'exécution
  | 'periodization'   // Techniques de périodisation et variation de charge
  | 'advanced';       // Techniques avancées et méthodes spécifiques

export type AdaptationType = 
  | 'informative'     // Affichage informatif uniquement (pas de champs supplémentaires)
  | 'extra_fields'    // Nécessite des champs de saisie supplémentaires
  | 'sub_series';     // Ajoute des sous-séries (ex: Drop sets)

export interface IntensityTechniqueConfigSchema {
  [key: string]: 'number' | 'string' | 'boolean';
}

export interface IntensityTechniqueDefaultConfig {
  [key: string]: number | string | boolean;
}

export interface IntensityTechnique {
  id: string;
  name: string;
  description: string;
  category: IntensityTechniqueCategory;
  protocol: string;
  adaptation_type: AdaptationType;
  config_schema?: IntensityTechniqueConfigSchema | null;
  default_config?: IntensityTechniqueDefaultConfig | null;
  created_by?: string | null;  // UUID du coach créateur (NULL pour techniques système)
  is_public: boolean;           // true pour techniques système, false pour techniques personnalisées
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIntensityTechniqueInput {
  name: string;
  description: string;
  category: IntensityTechniqueCategory;
  protocol: string;
  adaptation_type: AdaptationType;
  config_schema?: IntensityTechniqueConfigSchema;
  default_config?: IntensityTechniqueDefaultConfig;
}

export interface UpdateIntensityTechniqueInput {
  name?: string;
  description?: string;
  category?: IntensityTechniqueCategory;
  protocol?: string;
  adaptation_type?: AdaptationType;
  config_schema?: IntensityTechniqueConfigSchema;
  default_config?: IntensityTechniqueDefaultConfig;
  is_archived?: boolean;
}

// Configuration d'une technique appliquée à un exercice
export interface ExerciseIntensityConfig {
  technique_id: string;
  technique_name: string;
  applies_to: 'all' | 'last' | 'specific';  // Appliqué à toutes les séries, dernière série, ou séries spécifiques
  specific_sets?: number[];                  // Si applies_to = 'specific', liste des numéros de séries
  config?: IntensityTechniqueDefaultConfig;  // Configuration personnalisée
}
