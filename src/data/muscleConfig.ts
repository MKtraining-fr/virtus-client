// Configuration des muscles pour le visualiseur anatomique
// Chaque muscle a une vue antérieure (ant) et postérieure (post)

export interface MuscleDefinition {
  id: string;
  name: string;
  nameFr: string;
  svgAnt: string;
  svgPost: string;
  group: MuscleGroup;
  subGroup?: string;
  preferredView?: 'anterior' | 'posterior'; // Vue préférée pour ce muscle
}

export type MuscleGroup = 
  | 'shoulders'
  | 'arms'
  | 'forearms'
  | 'back'
  | 'chest'
  | 'core'
  | 'glutes'
  | 'thighs'
  | 'calves';

export interface MuscleGroupDefinition {
  id: MuscleGroup;
  name: string;
  nameFr: string;
  color: string;
  muscles: string[]; // IDs des muscles
}

// Définition de tous les muscles disponibles
export const MUSCLES: MuscleDefinition[] = [
  // Corps entier (base)
  {
    id: 'full_body',
    name: 'Full Body',
    nameFr: 'Corps entier',
    svgAnt: '/anatomy/muscles/full_body_ant.svg',
    svgPost: '/anatomy/muscles/full_body_post.svg',
    group: 'core',
  },
  
  // === ÉPAULES (Deltoïdes) ===
  {
    id: 'deltoid',
    name: 'Deltoid (Complete)',
    nameFr: 'Deltoïde (Complet)',
    svgAnt: '/anatomy/muscles/deltoid_ant.svg',
    svgPost: '/anatomy/muscles/deltoid_post.svg',
    group: 'shoulders',
  },
  {
    id: 'deltoid_anterior',
    name: 'Anterior Deltoid',
    nameFr: 'Deltoïde antérieur',
    svgAnt: '/anatomy/muscles/deltoid_anterior_ant.svg',
    svgPost: '/anatomy/muscles/deltoid_anterior_post.svg',
    group: 'shoulders',
    subGroup: 'deltoid',
  },
  {
    id: 'deltoid_medial',
    name: 'Medial Deltoid',
    nameFr: 'Deltoïde médial',
    svgAnt: '/anatomy/muscles/deltoid_medial_ant.svg',
    svgPost: '/anatomy/muscles/deltoid_medial_post.svg',
    group: 'shoulders',
    subGroup: 'deltoid',
  },
  {
    id: 'deltoid_posterior',
    name: 'Posterior Deltoid',
    nameFr: 'Deltoïde postérieur',
    svgAnt: '/anatomy/muscles/deltoid_posterior_ant.svg',
    svgPost: '/anatomy/muscles/deltoid_posterior_post.svg',
    group: 'shoulders',
    subGroup: 'deltoid',
  },
  
  // === BRAS ===
  {
    id: 'arm',
    name: 'Arm (Complete)',
    nameFr: 'Bras (Complet)',
    svgAnt: '/anatomy/muscles/arm_ant.svg',
    svgPost: '/anatomy/muscles/arm_post.svg',
    group: 'arms',
  },
  {
    id: 'biceps',
    name: 'Biceps Brachii',
    nameFr: 'Biceps brachial',
    svgAnt: '/anatomy/muscles/biceps_ant.svg',
    svgPost: '/anatomy/muscles/biceps_post.svg',
    group: 'arms',
    subGroup: 'arm',
  },
  {
    id: 'triceps',
    name: 'Triceps',
    nameFr: 'Triceps',
    svgAnt: '/anatomy/muscles/triceps_ant.svg',
    svgPost: '/anatomy/muscles/triceps_post.svg',
    group: 'arms',
    subGroup: 'arm',
  },
  {
    id: 'brachialis',
    name: 'Brachialis',
    nameFr: 'Brachial',
    svgAnt: '/anatomy/muscles/brachialis_ant.svg',
    svgPost: '/anatomy/muscles/brachialis_post.svg',
    group: 'arms',
    subGroup: 'arm',
  },
  
  // === AVANT-BRAS ===
  {
    id: 'forearm',
    name: 'Forearm',
    nameFr: 'Avant-bras',
    svgAnt: '/anatomy/muscles/forearm_ant.svg',
    svgPost: '/anatomy/muscles/forearm_post.svg',
    group: 'forearms',
  },
  
  // === DOS ===
  {
    id: 'back_general',
    name: 'Back (Complete)',
    nameFr: 'Dos (Complet)',
    svgAnt: '/anatomy/muscles/back_general_ant.svg',
    svgPost: '/anatomy/muscles/back_general_post.svg',
    group: 'back',
    preferredView: 'posterior',
  },
  {
    id: 'lats',
    name: 'Latissimus Dorsi',
    nameFr: 'Grand dorsal',
    svgAnt: '/anatomy/muscles/lats_ant.svg',
    svgPost: '/anatomy/muscles/lats_post.svg',
    group: 'back',
    subGroup: 'back_general',
    preferredView: 'posterior',
  },
  {
    id: 'trapezius_upper',
    name: 'Upper Trapezius',
    nameFr: 'Trapèze supérieur',
    svgAnt: '/anatomy/muscles/trapezius_upper_ant.svg',
    svgPost: '/anatomy/muscles/trapezius_upper_post.svg',
    group: 'back',
    subGroup: 'trapezius',
    preferredView: 'posterior',
  },
  {
    id: 'trapezius_middle',
    name: 'Middle Trapezius',
    nameFr: 'Trapèze moyen',
    svgAnt: '/anatomy/muscles/trapezius_middle_ant.svg',
    svgPost: '/anatomy/muscles/trapezius_middle_post.svg',
    group: 'back',
    subGroup: 'trapezius',
    preferredView: 'posterior',
  },
  {
    id: 'trapezius_lower',
    name: 'Lower Trapezius',
    nameFr: 'Trapèze inférieur',
    svgAnt: '/anatomy/muscles/trapezius_lower_ant.svg',
    svgPost: '/anatomy/muscles/trapezius_lower_post.svg',
    group: 'back',
    subGroup: 'trapezius',
    preferredView: 'posterior',
  },
  {
    id: 'levator_scapulae',
    name: 'Levator Scapulae',
    nameFr: 'Élévateur de la scapula',
    svgAnt: '/anatomy/muscles/levator_scapulae_ant.svg',
    svgPost: '/anatomy/muscles/levator_scapulae_post.svg',
    group: 'back',
    preferredView: 'posterior',
  },
  {
    id: 'rhomboids',
    name: 'Rhomboids',
    nameFr: 'Rhomboïdes',
    svgAnt: '/anatomy/muscles/rhomboids_post.svg',
    svgPost: '/anatomy/muscles/rhomboids_post.svg',
    group: 'back',
    preferredView: 'posterior',
  },
  {
    id: 'infraspinatus',
    name: 'Infraspinatus',
    nameFr: 'Infra-épineux',
    svgAnt: '/anatomy/muscles/infraspinatus_post.svg',
    svgPost: '/anatomy/muscles/infraspinatus_post.svg',
    group: 'shoulders',
    subGroup: 'rotator_cuff',
    preferredView: 'posterior',
  },
  {
    id: 'supraspinatus',
    name: 'Supraspinatus',
    nameFr: 'Supra-épineux',
    svgAnt: '/anatomy/muscles/supraspinatus_post.svg',
    svgPost: '/anatomy/muscles/supraspinatus_post.svg',
    group: 'shoulders',
    subGroup: 'rotator_cuff',
    preferredView: 'posterior',
  },
  {
    id: 'subscapularis',
    name: 'Subscapularis',
    nameFr: 'Subscapulaire',
    svgAnt: '/anatomy/muscles/subscapularis_post.svg',
    svgPost: '/anatomy/muscles/subscapularis_post.svg',
    group: 'shoulders',
    subGroup: 'rotator_cuff',
    preferredView: 'posterior',
  },
  {
    id: 'erector_spinae',
    name: 'Erector Spinae',
    nameFr: 'Érecteurs du rachis',
    svgAnt: '/anatomy/muscles/erector_spinae_ant.svg',
    svgPost: '/anatomy/muscles/erector_spinae_post.svg',
    group: 'back',
    preferredView: 'posterior',
  },
  
  // === PECTORAUX ===
  {
    id: 'pectoralis_major',
    name: 'Pectoralis Major',
    nameFr: 'Grand pectoral',
    svgAnt: '/anatomy/muscles/pectoralis_major_ant.svg',
    svgPost: '/anatomy/muscles/pectoralis_major_ant.svg',
    group: 'chest',
  },
  {
    id: 'pectoralis_minor',
    name: 'Pectoralis Minor',
    nameFr: 'Petit pectoral',
    svgAnt: '/anatomy/muscles/pectoralis_minor_ant.svg',
    svgPost: '/anatomy/muscles/pectoralis_minor_ant.svg',
    group: 'chest',
  },
  
  // === ABDOMINAUX / CORE ===
  {
    id: 'abs_general',
    name: 'Abdominals (Complete)',
    nameFr: 'Sangle abdominale',
    svgAnt: '/anatomy/muscles/abs_general_ant.svg',
    svgPost: '/anatomy/muscles/abs_general_ant.svg',
    group: 'core',
  },
  {
    id: 'rectus_abdominis',
    name: 'Rectus Abdominis',
    nameFr: 'Grand droit de l\'abdomen',
    svgAnt: '/anatomy/muscles/rectus_abdominis_ant.svg',
    svgPost: '/anatomy/muscles/rectus_abdominis_ant.svg',
    group: 'core',
    subGroup: 'abs',
  },
  {
    id: 'obliques',
    name: 'Obliques',
    nameFr: 'Obliques (interne et externe)',
    svgAnt: '/anatomy/muscles/obliques_ant.svg',
    svgPost: '/anatomy/muscles/obliques_post.svg',
    group: 'core',
    subGroup: 'abs',
  },
  {
    id: 'psoas',
    name: 'Psoas',
    nameFr: 'Psoas (petit et grand)',
    svgAnt: '/anatomy/muscles/psoas_ant.svg',
    svgPost: '/anatomy/muscles/psoas_post.svg',
    group: 'core',
  },
  {
    id: 'pelvic_floor',
    name: 'Pelvic Floor',
    nameFr: 'Plancher pelvien',
    svgAnt: '/anatomy/muscles/pelvic_floor_ant.svg',
    svgPost: '/anatomy/muscles/pelvic_floor_post.svg',
    group: 'core',
  },
  
  // === FESSIERS ===
  {
    id: 'glutes_general',
    name: 'Glutes (Complete)',
    nameFr: 'Fessiers (Complet)',
    svgAnt: '/anatomy/muscles/glutes_general_ant.svg',
    svgPost: '/anatomy/muscles/glutes_general_post.svg',
    group: 'glutes',
    preferredView: 'posterior',
  },
  {
    id: 'gluteus_maximus',
    name: 'Gluteus Maximus',
    nameFr: 'Grand fessier',
    svgAnt: '/anatomy/muscles/gluteus_maximus_ant.svg',
    svgPost: '/anatomy/muscles/gluteus_maximus_post.svg',
    group: 'glutes',
    subGroup: 'glutes',
    preferredView: 'posterior',
  },
  {
    id: 'gluteus_medius_minimus',
    name: 'Gluteus Medius & Minimus',
    nameFr: 'Moyen et petit fessier',
    svgAnt: '/anatomy/muscles/gluteus_medius_minimus_ant.svg',
    svgPost: '/anatomy/muscles/gluteus_medius_minimus_post.svg',
    group: 'glutes',
    subGroup: 'glutes',
    preferredView: 'posterior',
  },
  
  // === CUISSES ===
  {
    id: 'thigh_general',
    name: 'Thigh (Complete)',
    nameFr: 'Cuisse (Complet)',
    svgAnt: '/anatomy/muscles/thigh_general_ant.svg',
    svgPost: '/anatomy/muscles/thigh_general_post.svg',
    group: 'thighs',
  },
  {
    id: 'quadriceps',
    name: 'Quadriceps',
    nameFr: 'Quadriceps',
    svgAnt: '/anatomy/muscles/quadriceps_ant.svg',
    svgPost: '/anatomy/muscles/quadriceps_post.svg',
    group: 'thighs',
    subGroup: 'thigh',
  },
  {
    id: 'hamstrings',
    name: 'Hamstrings',
    nameFr: 'Ischio-jambiers',
    svgAnt: '/anatomy/muscles/hamstrings_ant.svg',
    svgPost: '/anatomy/muscles/hamstrings_post.svg',
    group: 'thighs',
    subGroup: 'thigh',
    preferredView: 'posterior',
  },
  {
    id: 'adductors',
    name: 'Adductors',
    nameFr: 'Adducteurs',
    svgAnt: '/anatomy/muscles/adductors1_ant.svg',
    svgPost: '/anatomy/muscles/adductors1_post.svg',
    group: 'thighs',
    subGroup: 'thigh',
  },
  {
    id: 'sartorius',
    name: 'Sartorius',
    nameFr: 'Sartorius',
    svgAnt: '/anatomy/muscles/sartorius_ant.svg',
    svgPost: '/anatomy/muscles/sartorius_post.svg',
    group: 'thighs',
    subGroup: 'thigh',
  },
  
  // === MOLLETS / JAMBES INFÉRIEURES ===
  {
    id: 'lower_leg',
    name: 'Lower Leg (Complete)',
    nameFr: 'Jambe (Complet)',
    svgAnt: '/anatomy/muscles/lower_leg_ant.svg',
    svgPost: '/anatomy/muscles/lower_leg_post.svg',
    group: 'calves',
    preferredView: 'posterior',
  },
  {
    id: 'gastrocnemius',
    name: 'Gastrocnemius',
    nameFr: 'Gastrocnémiens',
    svgAnt: '/anatomy/muscles/gastrocnemius_ant.svg',
    svgPost: '/anatomy/muscles/gastrocnemius_post.svg',
    group: 'calves',
    subGroup: 'lower_leg',
    preferredView: 'posterior',
  },
  {
    id: 'soleus',
    name: 'Soleus',
    nameFr: 'Soléaire',
    svgAnt: '/anatomy/muscles/soleus_ant.svg',
    svgPost: '/anatomy/muscles/soleus_post.svg',
    group: 'calves',
    subGroup: 'lower_leg',
    preferredView: 'posterior',
  },
  {
    id: 'tibialis_anterior',
    name: 'Tibialis Anterior',
    nameFr: 'Tibial antérieur',
    svgAnt: '/anatomy/muscles/tibialis_anterior_ant.svg',
    svgPost: '/anatomy/muscles/tibialis_anterior_post.svg',
    group: 'calves',
  },
];

// Définition des groupes musculaires
export const MUSCLE_GROUPS: MuscleGroupDefinition[] = [
  {
    id: 'shoulders',
    name: 'Shoulders',
    nameFr: 'Épaules',
    color: '#ef4444', // red
    muscles: ['deltoid', 'deltoid_anterior', 'deltoid_medial', 'deltoid_posterior', 'infraspinatus', 'supraspinatus', 'subscapularis'],
  },
  {
    id: 'arms',
    name: 'Arms',
    nameFr: 'Bras',
    color: '#f97316', // orange
    muscles: ['arm', 'biceps', 'triceps', 'brachialis'],
  },
  {
    id: 'forearms',
    name: 'Forearms',
    nameFr: 'Avant-bras',
    color: '#eab308', // yellow
    muscles: ['forearm'],
  },
  {
    id: 'chest',
    name: 'Chest',
    nameFr: 'Pectoraux',
    color: '#22c55e', // green
    muscles: ['pectoralis_major', 'pectoralis_minor'],
  },
  {
    id: 'back',
    name: 'Back',
    nameFr: 'Dos',
    color: '#3b82f6', // blue
    muscles: ['back_general', 'lats', 'trapezius_upper', 'trapezius_middle', 'trapezius_lower', 'levator_scapulae', 'rhomboids', 'erector_spinae'],
  },
  {
    id: 'core',
    name: 'Core',
    nameFr: 'Abdominaux',
    color: '#8b5cf6', // purple
    muscles: ['abs_general', 'rectus_abdominis', 'obliques', 'psoas', 'pelvic_floor'],
  },
  {
    id: 'glutes',
    name: 'Glutes',
    nameFr: 'Fessiers',
    color: '#ec4899', // pink
    muscles: ['glutes_general', 'gluteus_maximus', 'gluteus_medius_minimus'],
  },
  {
    id: 'thighs',
    name: 'Thighs',
    nameFr: 'Cuisses',
    color: '#14b8a6', // teal
    muscles: ['thigh_general', 'quadriceps', 'hamstrings', 'adductors', 'sartorius'],
  },
  {
    id: 'calves',
    name: 'Calves',
    nameFr: 'Mollets',
    color: '#6366f1', // indigo
    muscles: ['lower_leg', 'gastrocnemius', 'soleus', 'tibialis_anterior'],
  },
];

// Fonction utilitaire pour obtenir un muscle par son ID
export const getMuscleById = (id: string): MuscleDefinition | undefined => {
  return MUSCLES.find(m => m.id === id);
};

// Fonction utilitaire pour obtenir les muscles d'un groupe
export const getMusclesByGroup = (groupId: MuscleGroup): MuscleDefinition[] => {
  return MUSCLES.filter(m => m.group === groupId);
};

// Fonction utilitaire pour obtenir un groupe par son ID
export const getGroupById = (id: MuscleGroup): MuscleGroupDefinition | undefined => {
  return MUSCLE_GROUPS.find(g => g.id === id);
};
