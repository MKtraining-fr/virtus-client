/**
 * Templates de configuration prédéfinis pour les techniques d'intensification personnalisées
 */

export type TemplateType = 
  | 'simple'          // Informatif uniquement (pas de configuration)
  | 'duration'        // Durée en secondes
  | 'angle'           // Angle en degrés
  | 'duration_angle'  // Durée + Angle
  | 'progression'     // Progression de charge (% début → % fin)
  | 'iso_overcoming'; // Iso Overcoming complet (6 champs)

export interface TemplateDefinition {
  id: TemplateType;
  name: string;
  description: string;
  fields: TemplateField[];
  useCases: string[];
}

export interface TemplateField {
  key: string;
  label: string;
  type: 'number' | 'text' | 'select';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

/**
 * Configuration des templates disponibles
 */
export const INTENSITY_TEMPLATES: Record<TemplateType, TemplateDefinition> = {
  simple: {
    id: 'simple',
    name: 'Simple (Informatif)',
    description: 'Technique informative sans configuration supplémentaire',
    fields: [],
    useCases: [
      'Techniques descriptives',
      'Méthodes sans paramètres spécifiques',
      'Instructions générales'
    ]
  },

  duration: {
    id: 'duration',
    name: 'Durée',
    description: 'Configuration basée sur une durée en secondes',
    fields: [
      {
        key: 'duration',
        label: 'Durée',
        type: 'number',
        unit: 'secondes',
        min: 1,
        max: 300,
        step: 1,
        placeholder: 'Ex: 30'
      }
    ],
    useCases: [
      'Pauses intra-série',
      'Temps sous tension',
      'Isométrie simple',
      'Rest-Pause personnalisé'
    ]
  },

  angle: {
    id: 'angle',
    name: 'Angle',
    description: 'Configuration basée sur un angle articulaire',
    fields: [
      {
        key: 'angle',
        label: 'Angle articulaire',
        type: 'number',
        unit: 'degrés',
        min: 0,
        max: 180,
        step: 5,
        placeholder: 'Ex: 90'
      }
    ],
    useCases: [
      'Travail isométrique à angle spécifique',
      'Partial reps',
      'Position de maintien'
    ]
  },

  duration_angle: {
    id: 'duration_angle',
    name: 'Durée + Angle',
    description: 'Configuration avec durée et angle articulaire',
    fields: [
      {
        key: 'duration',
        label: 'Durée',
        type: 'number',
        unit: 'secondes',
        min: 1,
        max: 300,
        step: 1,
        placeholder: 'Ex: 8'
      },
      {
        key: 'angle',
        label: 'Angle articulaire',
        type: 'number',
        unit: 'degrés',
        min: 0,
        max: 180,
        step: 5,
        placeholder: 'Ex: 90'
      }
    ],
    useCases: [
      'Iso Overcoming',
      'Iso Yielding',
      'Travail isométrique positionné'
    ]
  },

  progression: {
    id: 'progression',
    name: 'Progression',
    description: 'Configuration avec progression de charge',
    fields: [
      {
        key: 'start_percentage',
        label: 'Charge de départ',
        type: 'number',
        unit: '%',
        min: 10,
        max: 100,
        step: 5,
        placeholder: 'Ex: 70'
      },
      {
        key: 'end_percentage',
        label: 'Charge finale',
        type: 'number',
        unit: '%',
        min: 10,
        max: 100,
        step: 5,
        placeholder: 'Ex: 50'
      },
      {
        key: 'decrement',
        label: 'Décrémentation',
        type: 'number',
        unit: '%',
        min: 5,
        max: 50,
        step: 5,
        placeholder: 'Ex: 10'
      }
    ],
    useCases: [
      'Drop Set personnalisé',
      'Pyramide descendante',
      'Dégressif contrôlé'
    ]
  },

  iso_overcoming: {
    id: 'iso_overcoming',
    name: 'Iso Overcoming Complet',
    description: 'Configuration complète pour isométrie surmontante',
    fields: [
      {
        key: 'sets',
        label: 'Nombre de séries',
        type: 'number',
        unit: 'séries',
        min: 1,
        max: 10,
        step: 1,
        placeholder: 'Ex: 3'
      },
      {
        key: 'reps',
        label: 'Nombre de répétitions',
        type: 'number',
        unit: 'reps',
        min: 1,
        max: 20,
        step: 1,
        placeholder: 'Ex: 5'
      },
      {
        key: 'iso_duration',
        label: 'Temps d\'isométrie',
        type: 'number',
        unit: 'secondes',
        min: 1,
        max: 60,
        step: 1,
        placeholder: 'Ex: 8'
      },
      {
        key: 'rest_between_sets',
        label: 'Repos entre séries',
        type: 'number',
        unit: 'secondes',
        min: 30,
        max: 600,
        step: 10,
        placeholder: 'Ex: 180'
      },
      {
        key: 'rest_between_reps',
        label: 'Repos entre répétitions',
        type: 'number',
        unit: 'secondes',
        min: 5,
        max: 120,
        step: 5,
        placeholder: 'Ex: 30'
      },
      {
        key: 'angle',
        label: 'Angle articulaire',
        type: 'number',
        unit: 'degrés',
        min: 0,
        max: 180,
        step: 5,
        placeholder: 'Ex: 90'
      }
    ],
    useCases: [
      'Iso Overcoming',
      'Force maximale isométrique',
      'Renforcement à angle spécifique'
    ]
  }
};

/**
 * Configuration spécifique selon le template
 */
export interface DurationConfig {
  duration: number; // en secondes
}

export interface AngleConfig {
  angle: number; // en degrés
}

export interface DurationAngleConfig {
  duration: number; // en secondes
  angle: number; // en degrés
}

export interface ProgressionConfig {
  start_percentage: number;
  end_percentage: number;
  decrement: number;
}

export interface IsoOvercomingConfig {
  sets: number;
  reps: number;
  iso_duration: number;
  rest_between_sets: number;
  rest_between_reps: number;
  angle: number;
}

export type TemplateConfig = 
  | null  // Pour 'simple'
  | DurationConfig
  | AngleConfig
  | DurationAngleConfig
  | ProgressionConfig
  | IsoOvercomingConfig;

/**
 * Helper pour obtenir un template par son ID
 */
export function getTemplate(templateId: TemplateType): TemplateDefinition {
  return INTENSITY_TEMPLATES[templateId];
}

/**
 * Helper pour obtenir tous les templates
 */
export function getAllTemplates(): TemplateDefinition[] {
  return Object.values(INTENSITY_TEMPLATES);
}

/**
 * Helper pour valider une configuration selon son template
 */
export function validateTemplateConfig(
  templateId: TemplateType,
  config: any
): boolean {
  const template = getTemplate(templateId);
  
  if (templateId === 'simple') {
    return config === null || config === undefined;
  }
  
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  // Vérifier que tous les champs requis sont présents
  for (const field of template.fields) {
    if (config[field.key] === undefined || config[field.key] === null) {
      return false;
    }
    
    // Vérifier les contraintes min/max
    if (field.type === 'number') {
      const value = Number(config[field.key]);
      if (isNaN(value)) return false;
      if (field.min !== undefined && value < field.min) return false;
      if (field.max !== undefined && value > field.max) return false;
    }
  }
  
  return true;
}
