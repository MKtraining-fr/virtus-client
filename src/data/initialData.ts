import {
  Client,
  Exercise,
  WorkoutProgram,
  WorkoutSession,
  NutritionPlan,
  Message,
  ClientFormation,
  ProfessionalFormation,
  Notification,
  FoodItem,
  BilanTemplate,
  Partner,
  Product,
  IntensificationTechnique,
  Meal,
} from '../types';
import { CIQUAL_DATA } from './ciqualData';

// --- FOOD ITEMS ---
export const INITIAL_FOOD_ITEMS: FoodItem[] = [
  ...CIQUAL_DATA,
  { name: 'Whey Protein', category: 'Compléments', calories: 370, protein: 80, carbs: 5, fat: 3 },
];

const findFood = (name: string): FoodItem => {
  const food = INITIAL_FOOD_ITEMS.find((f) => f.name.toLowerCase() === name.toLowerCase());
  if (!food) {
    console.warn(`Food item "${name}" not found. Using default values.`);
    return { name: name, category: 'Inconnu', calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  return food;
};

// --- RECIPES AND MEALS ---
export const INITIAL_RECIPES: (Meal & { type: 'Recette' })[] = [
  {
    id: 'recipe-pancakes',
    name: 'Pancakes Protéinés',
    type: 'Recette',
    items: [
      { id: 'p1', food: findFood("Flocons d'avoine"), quantity: 50, unit: 'g' },
      { id: 'p2', food: findFood('Oeuf, entier, cuit dur'), quantity: 100, unit: 'g' }, // Assuming 2 eggs
      { id: 'p3', food: findFood('Fromage blanc 0% MG'), quantity: 100, unit: 'g' },
      { id: 'p4', food: findFood('Banane'), quantity: 50, unit: 'g' }, // Half a banana
    ],
  },
  {
    id: 'recipe-salade-poulet',
    name: 'Salade César Poulet',
    type: 'Recette',
    items: [
      { id: 's1', food: findFood('Poulet, blanc, sans peau'), quantity: 150, unit: 'g' },
      { id: 's2', food: findFood('Salade verte'), quantity: 100, unit: 'g' },
      { id: 's3', food: findFood('Pain complet'), quantity: 30, unit: 'g' },
      { id: 's4', food: findFood("Huile d'olive"), quantity: 10, unit: 'ml' },
    ],
  },
];

export const INITIAL_MEALS: (Meal & { type: 'Repas' })[] = [
  {
    id: 'meal-breakfast-1',
    name: 'Petit-déjeuner Équilibré',
    type: 'Repas',
    items: [
      { id: 'm1i1', food: findFood('Pain complet'), quantity: 80, unit: 'g' },
      { id: 'm1i2', food: findFood('Jambon blanc, cuit'), quantity: 50, unit: 'g' },
      { id: 'm1i3', food: findFood('Oeuf, entier, cuit dur'), quantity: 50, unit: 'g' },
      { id: 'm1i4', food: findFood('Kiwi'), quantity: 100, unit: 'g' },
    ],
  },
  {
    id: 'meal-lunch-1',
    name: 'Déjeuner Prise de Masse',
    type: 'Repas',
    items: [
      { id: 'm2i1', food: findFood('Boeuf, steak haché 5% MG'), quantity: 150, unit: 'g' },
      { id: 'm2i2', food: findFood('Riz blanc, cuit'), quantity: 250, unit: 'g' },
      { id: 'm2i3', food: findFood('Haricots verts, cuits'), quantity: 200, unit: 'g' },
      { id: 'm2i4', food: findFood("Huile d'olive"), quantity: 15, unit: 'ml' },
    ],
  },
];

// --- BILAN TEMPLATES ---
export const INITIAL_BILAN_TEMPLATES: BilanTemplate[] = [
  {
    id: 'system-default',
    name: 'Bilan Initial',
    coachId: 'system',
    sections: [
      {
        id: 'sec_civility',
        title: 'Informations générales',
        isRemovable: false,
        isCivility: true,
        fields: [
          { id: 'firstName', label: 'Prénom', type: 'text', placeholder: 'Jean' },
          { id: 'lastName', label: 'Nom', type: 'text', placeholder: 'Dupont' },
          { id: 'dob', label: 'Date de naissance', type: 'date' },
          { id: 'sex', label: 'Sexe', type: 'select', options: ['Homme', 'Femme'] },
          { id: 'address', label: 'Adresse', type: 'text', placeholder: '123 rue de la Forme' },
          { id: 'email', label: 'Email', type: 'text', placeholder: 'jean.dupont@email.com' },
          { id: 'phone', label: 'Téléphone', type: 'text', placeholder: '0612345678' },
          { id: 'height', label: 'Taille (cm)', type: 'number', placeholder: '180' },
          { id: 'weight', label: 'Poids (kg)', type: 'number', placeholder: '75' },
          {
            id: 'energyExpenditureLevel',
            label: 'Niveau de dépense énergétique',
            type: 'select',
            options: ['Sédentaire', 'Légèrement actif', 'Actif', 'Très actif'],
          },
        ],
      },
      {
        id: 'sec_objectif',
        title: 'Objectif',
        isRemovable: false,
        fields: [
          {
            id: 'fld_objectif',
            label: 'Objectif principal',
            type: 'textarea',
            placeholder: 'Décrivez vos objectifs...',
          },
        ],
      },
      {
        id: 'sec_lifestyle',
        title: 'Vie quotidienne',
        isRemovable: true,
        fields: [
          {
            id: 'fld_profession',
            label: 'Profession',
            type: 'text',
            placeholder: 'Ex: Employé de bureau',
          },
        ],
      },
      {
        id: 'sec_alimentation',
        title: 'Alimentation',
        isRemovable: true,
        fields: [
          {
            id: 'fld_allergies',
            label: 'Allergies',
            type: 'textarea',
            placeholder: 'Lister les allergies connues...',
          },
          {
            id: 'fld_aversions',
            label: 'Aversions alimentaires',
            type: 'textarea',
            placeholder: "Lister les aliments que la personne n'aime pas...",
          },
          {
            id: 'fld_habits',
            label: 'Habitudes alimentaires générales',
            type: 'textarea',
            placeholder: 'Décrire les habitudes alimentaires, nombre de repas par jour, etc.',
          },
        ],
      },
    ],
  },
];

// --- EXERCISES ---
export const INITIAL_EXERCISES: Exercise[] = [
  // System exercises (Default)
  {
    id: 'ex-1',
    name: 'Développé couché',
    category: 'Musculation',
    description: 'Exercice de base pour les pectoraux.',
    videoUrl: 'https://www.youtube.com/embed/vb-45b6G4V4',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/8/male-Dumbbell-Bench-Press.png',
    equipment: 'Haltères',
    muscleGroups: ['Pectoraux', 'Triceps', 'Épaules'],
    coachId: 'system',
  },
  {
    id: 'ex-2',
    name: 'Squat',
    category: 'Musculation',
    description: 'Mouvement fondamental pour les jambes et fessiers.',
    videoUrl: 'https://www.youtube.com/embed/U3HlEF_E9fo',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/403/male-Barbell-Squat.png',
    equipment: 'Barre olympique',
    muscleGroups: ['Quadriceps', 'Fessiers', 'Ischio-jambiers'],
    coachId: 'system',
  },
  {
    id: 'ex-3',
    name: 'Soulevé de terre',
    category: 'Musculation',
    description: 'Exercice polyarticulaire complet.',
    videoUrl: 'https://www.youtube.com/embed/wjsu6ce24I',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/399/male-Barbell-Deadlift.png',
    equipment: 'Barre olympique',
    muscleGroups: ['Dos', 'Ischio-jambiers', 'Lombaires'],
    coachId: 'system',
  },
  {
    id: 'ex-4',
    name: 'Traction',
    category: 'Musculation',
    description: 'Exercice au poids du corps pour le dos et les biceps.',
    videoUrl: 'https://www.youtube.com/embed/poyr8KenUfc',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/381/male-Pull-up.png',
    equipment: 'Poids du corps',
    muscleGroups: ['Dos', 'Biceps'],
    coachId: 'system',
  },
  {
    id: 'ex-5',
    name: 'Développé militaire',
    category: 'Musculation',
    description: 'Exercice de base pour les épaules.',
    videoUrl: 'https://www.youtube.com/embed/2yjwXTZQDDI',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/344/male-Barbell-Shoulder-Press.png',
    equipment: 'Barre olympique',
    muscleGroups: ['Épaules', 'Triceps'],
    coachId: 'system',
  },
  {
    id: 'ex-6',
    name: 'Rowing barre',
    category: 'Musculation',
    description: "Excellent pour l'épaisseur du dos.",
    videoUrl: 'https://www.youtube.com/embed/T3N-TO4reLQ',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/1351/male-Lever-T-bar-Row.png',
    equipment: 'Barre olympique',
    muscleGroups: ['Dos', 'Biceps'],
    coachId: 'system',
  },
  {
    id: 'ex-7',
    name: 'Fentes',
    category: 'Musculation',
    description: 'Mouvement unilatéral pour les jambes.',
    videoUrl: 'https://www.youtube.com/embed/QOVaHwm-Q6U',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/407/male-Dumbbell-Lunge.png',
    equipment: 'Haltères',
    muscleGroups: ['Quadriceps', 'Fessiers'],
    coachId: 'system',
  },
  {
    id: 'ex-8',
    name: 'Pompes',
    category: 'Musculation',
    description: 'Exercice de base au poids du corps pour les pectoraux.',
    videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/383/male-Push-up.png',
    equipment: 'Poids du corps',
    muscleGroups: ['Pectoraux', 'Triceps', 'Épaules'],
    coachId: 'system',
  },
  {
    id: 'ex-9',
    name: 'Leg Press',
    category: 'Musculation',
    description: 'Alternative au squat pour cibler les quadriceps.',
    videoUrl: 'https://www.youtube.com/embed/IZxyso_73e4',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/99/male-Sled-Leg-Press.png',
    equipment: 'Machine à charge guidée',
    muscleGroups: ['Quadriceps', 'Fessiers'],
    coachId: 'system',
  },
  {
    id: 'ex-10',
    name: 'Leg Curl',
    category: 'Musculation',
    description: 'Isolation des ischio-jambiers.',
    videoUrl: 'https://www.youtube.com/embed/1Tq3QdYUv-c',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/95/male-Sled-Lying-Leg-Curl.png',
    equipment: 'Machine à charge guidée',
    muscleGroups: ['Ischio-jambiers'],
    coachId: 'system',
  },
  {
    id: 'ex-11',
    name: 'Élévations latérales',
    category: 'Musculation',
    description: 'Isolation du faisceau moyen des épaules.',
    videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/45/male-Dumbbell-Lateral-Raise.png',
    equipment: 'Haltères',
    muscleGroups: ['Épaules'],
    coachId: 'system',
  },
  {
    id: 'ex-12',
    name: 'Curl Biceps',
    category: 'Musculation',
    description: 'Isolation des biceps.',
    videoUrl: 'https://www.youtube.com/embed/av7-8zk_VNM',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/318/male-Barbell-Curl.png',
    equipment: 'Barre olympique',
    muscleGroups: ['Biceps'],
    coachId: 'system',
  },
  {
    id: 'ex-13',
    name: 'Dips',
    category: 'Musculation',
    description: 'Exercice au poids du corps pour les triceps et pectoraux.',
    videoUrl: 'https://www.youtube.com/embed/2z8JmcrW-As',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/28/male-Dip.png',
    equipment: 'Poids du corps',
    muscleGroups: ['Triceps', 'Pectoraux'],
    coachId: 'system',
  },
  {
    id: 'ex-14',
    name: 'Planche',
    category: 'Musculation',
    description: 'Gainage abdominal.',
    videoUrl: 'https://www.youtube.com/embed/ASdvN_XEl_c',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/1622/male-Plank.png',
    equipment: 'Poids du corps',
    muscleGroups: ['Abdominaux'],
    coachId: 'system',
  },

  // Mobilité & Échauffement
  {
    id: 'ex-mob-1',
    name: 'Étirement du psoas',
    category: 'Mobilité',
    description: 'Soulage les tensions du bas du dos.',
    videoUrl: 'https://www.youtube.com/embed/ylQvI5sH0_A',
    illustrationUrl:
      'https://img.gymvisual.com/illustrations/1618/male-Kneeling-Hip-Flexor-Stretch.png',
    equipment: 'Poids du corps',
    muscleGroups: ['Hanches'],
    coachId: 'system',
  },
  {
    id: 'ex-warm-1',
    name: 'Jumping Jacks',
    category: 'Échauffement',
    description: 'Augmente la fréquence cardiaque.',
    videoUrl: 'https://www.youtube.com/embed/c4DAnQ6DtEg',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/283/male-Jumping-Jack.png',
    equipment: 'Poids du corps',
    muscleGroups: ['Cardio'],
    coachId: 'system',
  },
  {
    id: 'ex-cardio-1',
    name: 'Tapis de course',
    category: 'Musculation',
    description: "Course sur tapis roulant pour améliorer l'endurance cardiovasculaire.",
    videoUrl: '',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/107/male-Treadmill.png',
    equipment: 'Machine à charge guidée',
    muscleGroups: ['Cardio'],
    coachId: 'system',
  },
  {
    id: 'ex-cardio-2',
    name: 'Vélo elliptique',
    category: 'Musculation',
    description: 'Entraînement cardiovasculaire à faible impact pour tout le corps.',
    videoUrl: '',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/68/male-Elliptical-trainer.png',
    equipment: 'Machine à charge guidée',
    muscleGroups: ['Cardio'],
    coachId: 'system',
  },

  // Coach specific exercises
  {
    id: 'c1-1',
    name: 'Hip Thrust (Coach T.)',
    category: 'Musculation',
    description: 'Exercice spécifique pour les fessiers.',
    videoUrl: 'https://www.youtube.com/embed/xDmFkJxPzeM',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/393/male-Barbell-Hip-Thrust.png',
    equipment: 'Barre olympique',
    muscleGroups: ['Fessiers', 'Ischio-jambiers'],
    coachId: 'coach-1',
  },
  {
    id: 'c2-1',
    name: 'Kettlebell Swing (Coach S.)',
    category: 'Musculation',
    description: 'Mouvement explosif pour la chaîne postérieure.',
    videoUrl: 'https://www.youtube.com/embed/YSxH59uh_w',
    illustrationUrl: 'https://img.gymvisual.com/illustrations/1594/male-Kettlebell-Swing.png',
    equipment: 'Autre',
    muscleGroups: ['Fessiers', 'Lombaires', 'Ischio-jambiers'],
    coachId: 'coach-2',
  },
];

const createWeeklyProgram = (
  sessions: WorkoutSession[],
  weekCount: number
): Record<number, WorkoutSession[]> => {
  const sessionsByWeek: Record<number, WorkoutSession[]> = {};
  for (let i = 1; i <= weekCount; i++) {
    sessionsByWeek[i] = JSON.parse(JSON.stringify(sessions));
  }
  return sessionsByWeek;
};

// --- PROGRAMS ---
const FULL_BODY_FOUNDATION: WorkoutProgram = {
  id: 'prog-fbf-1',
  name: 'Full Body Foundation',
  objective: 'Conditionnement général et force pour débutants',
  weekCount: 8,
  sessionsByWeek: createWeeklyProgram(
    [
      {
        id: 1,
        name: 'Séance A',
        exercises: [
          {
            id: 1,
            exerciseId: 'ex-2',
            name: 'Squat',
            illustrationUrl: 'https://img.gymvisual.com/illustrations/403/male-Barbell-Squat.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '8-12',
              load: { value: '90', unit: 'kg' },
              tempo: '3010',
              rest: '90s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 2,
            exerciseId: 'ex-1',
            name: 'Développé couché',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/8/male-Dumbbell-Bench-Press.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '8-12',
              load: { value: '60', unit: 'kg' },
              tempo: '3010',
              rest: '90s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 3,
            exerciseId: 'ex-6',
            name: 'Rowing barre',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/1351/male-Lever-T-bar-Row.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '8-12',
              load: { value: '50', unit: 'kg' },
              tempo: '2011',
              rest: '90s',
            }),
            intensification: [],
            alternatives: [],
          },
        ],
      },
      {
        id: 2,
        name: 'Séance B',
        exercises: [
          {
            id: 1,
            exerciseId: 'ex-3',
            name: 'Soulevé de terre',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/399/male-Barbell-Deadlift.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '6-8',
              load: { value: '100', unit: 'kg' },
              tempo: '3010',
              rest: '120s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 2,
            exerciseId: 'ex-5',
            name: 'Développé militaire',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/344/male-Barbell-Shoulder-Press.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '8-12',
              load: { value: '40', unit: 'kg' },
              tempo: '2010',
              rest: '90s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 3,
            exerciseId: 'ex-4',
            name: 'Traction',
            illustrationUrl: 'https://img.gymvisual.com/illustrations/381/male-Pull-up.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: 'Max',
              load: { value: '0', unit: 'kg' },
              tempo: '2011',
              rest: '90s',
            }),
            intensification: [],
            alternatives: [],
          },
        ],
      },
      {
        id: 3,
        name: 'Séance C',
        exercises: [
          {
            id: 1,
            exerciseId: 'ex-7',
            name: 'Fentes',
            illustrationUrl: 'https://img.gymvisual.com/illustrations/407/male-Dumbbell-Lunge.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '10-12',
              load: { value: '12', unit: 'kg' },
              tempo: '2010',
              rest: '75s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 2,
            exerciseId: 'ex-11',
            name: 'Élévations latérales',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/45/male-Dumbbell-Lateral-Raise.png',
            sets: '4',
            isDetailed: false,
            details: Array(4).fill({
              reps: '12-15',
              load: { value: '8', unit: 'kg' },
              tempo: '2011',
              rest: '60s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 3,
            exerciseId: 'ex-14',
            name: 'Planche',
            illustrationUrl: 'https://img.gymvisual.com/illustrations/1622/male-Plank.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '60s',
              load: { value: '0', unit: 'kg' },
              tempo: 'N/A',
              rest: '60s',
            }),
            intensification: [],
            alternatives: [],
          },
        ],
      },
    ],
    8
  ),
};

const FORCE_PROGRESSION_CYCLE: WorkoutProgram = {
  id: 'prog-fpc-1',
  name: 'Cycle de Progression en Force',
  objective: 'Augmenter la force maximale sur les mouvements de base',
  weekCount: 6,
  sessionsByWeek: createWeeklyProgram(
    [
      {
        id: 1,
        name: 'Push',
        exercises: [
          {
            id: 1,
            exerciseId: 'ex-1',
            name: 'Développé couché',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/8/male-Dumbbell-Bench-Press.png',
            sets: '5',
            isDetailed: false,
            details: Array(5).fill({
              reps: '5',
              load: { value: '85', unit: '%' },
              tempo: '20X1',
              rest: '180s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 2,
            exerciseId: 'ex-5',
            name: 'Développé militaire',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/344/male-Barbell-Shoulder-Press.png',
            sets: '4',
            isDetailed: false,
            details: Array(4).fill({
              reps: '6-8',
              load: { value: '80', unit: '%' },
              tempo: '2010',
              rest: '120s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 3,
            exerciseId: 'ex-13',
            name: 'Dips',
            illustrationUrl: 'https://img.gymvisual.com/illustrations/28/male-Dip.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '8-12',
              load: { value: '10', unit: 'kg' },
              tempo: '2010',
              rest: '90s',
            }),
            intensification: [],
            alternatives: [],
          },
        ],
      },
      {
        id: 2,
        name: 'Pull',
        exercises: [
          {
            id: 1,
            exerciseId: 'ex-3',
            name: 'Soulevé de terre',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/399/male-Barbell-Deadlift.png',
            sets: '5',
            isDetailed: false,
            details: Array(5).fill({
              reps: '5',
              load: { value: '85', unit: '%' },
              tempo: '11X1',
              rest: '180s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 2,
            exerciseId: 'ex-4',
            name: 'Traction',
            illustrationUrl: 'https://img.gymvisual.com/illustrations/381/male-Pull-up.png',
            sets: '4',
            isDetailed: false,
            details: Array(4).fill({
              reps: '6-8',
              load: { value: '5', unit: 'kg' },
              tempo: '2011',
              rest: '120s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 3,
            exerciseId: 'ex-6',
            name: 'Rowing barre',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/1351/male-Lever-T-bar-Row.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '8-10',
              load: { value: '70', unit: 'kg' },
              tempo: '2011',
              rest: '90s',
            }),
            intensification: [],
            alternatives: [],
          },
        ],
      },
      {
        id: 3,
        name: 'Legs',
        exercises: [
          {
            id: 1,
            exerciseId: 'ex-2',
            name: 'Squat',
            illustrationUrl: 'https://img.gymvisual.com/illustrations/403/male-Barbell-Squat.png',
            sets: '5',
            isDetailed: false,
            details: Array(5).fill({
              reps: '5',
              load: { value: '85', unit: '%' },
              tempo: '31X1',
              rest: '180s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 2,
            exerciseId: 'ex-9',
            name: 'Leg Press',
            illustrationUrl: 'https://img.gymvisual.com/illustrations/99/male-Sled-Leg-Press.png',
            sets: '4',
            isDetailed: false,
            details: Array(4).fill({
              reps: '8-10',
              load: { value: '200', unit: 'kg' },
              tempo: '2010',
              rest: '120s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 3,
            exerciseId: 'ex-10',
            name: 'Leg Curl',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/95/male-Sled-Lying-Leg-Curl.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '10-12',
              load: { value: '40', unit: 'kg' },
              tempo: '3010',
              rest: '90s',
            }),
            intensification: [],
            alternatives: [],
          },
        ],
      },
    ],
    6
  ),
};

const TONING_PROGRAM: WorkoutProgram = {
  id: 'prog-tone-1',
  name: 'Perte de poids et tonification',
  objective: 'Perte de poids et tonification',
  weekCount: 12,
  sessionsByWeek: createWeeklyProgram(
    [
      {
        id: 1,
        name: 'Haut du corps A',
        exercises: [
          {
            id: 1,
            exerciseId: 'ex-1',
            name: 'Développé couché',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/8/male-Dumbbell-Bench-Press.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '12-15',
              load: { value: '60', unit: '%' },
              tempo: '3010',
              rest: '60s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 2,
            exerciseId: 'ex-11',
            name: 'Élévations latérales',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/45/male-Dumbbell-Lateral-Raise.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '15-20',
              load: { value: '5', unit: 'kg' },
              tempo: '2011',
              rest: '60s',
            }),
            intensification: [],
            alternatives: [],
          },
        ],
      },
      {
        id: 2,
        name: 'Bas du corps A',
        exercises: [
          {
            id: 1,
            exerciseId: 'ex-2',
            name: 'Squat',
            illustrationUrl: 'https://img.gymvisual.com/illustrations/403/male-Barbell-Squat.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '12-15',
              load: { value: '60', unit: '%' },
              tempo: '3010',
              rest: '60s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 2,
            exerciseId: 'ex-10',
            name: 'Leg Curl',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/95/male-Sled-Lying-Leg-Curl.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '15-20',
              load: { value: '25', unit: 'kg' },
              tempo: '3011',
              rest: '60s',
            }),
            intensification: [],
            alternatives: [],
          },
        ],
      },
      {
        id: 3,
        name: 'Haut du corps B',
        exercises: [
          {
            id: 1,
            exerciseId: 'ex-4',
            name: 'Traction',
            illustrationUrl: 'https://img.gymvisual.com/illustrations/381/male-Pull-up.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: 'Max',
              load: { value: '0', unit: 'kg' },
              tempo: '2011',
              rest: '75s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 2,
            exerciseId: 'ex-6',
            name: 'Rowing barre',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/1351/male-Lever-T-bar-Row.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '12-15',
              load: { value: '30', unit: 'kg' },
              tempo: '2011',
              rest: '60s',
            }),
            intensification: [],
            alternatives: [],
          },
        ],
      },
      {
        id: 4,
        name: 'Bas du corps B',
        exercises: [
          {
            id: 1,
            exerciseId: 'ex-7',
            name: 'Fentes',
            illustrationUrl: 'https://img.gymvisual.com/illustrations/407/male-Dumbbell-Lunge.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '12-15',
              load: { value: '8', unit: 'kg' },
              tempo: '2010',
              rest: '60s',
            }),
            intensification: [],
            alternatives: [],
          },
          {
            id: 2,
            exerciseId: 'c1-1',
            name: 'Hip Thrust (Coach T.)',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/393/male-Barbell-Hip-Thrust.png',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill({
              reps: '15-20',
              load: { value: '40', unit: 'kg' },
              tempo: '2111',
              rest: '60s',
            }),
            intensification: [],
            alternatives: [],
          },
        ],
      },
    ],
    12
  ),
};

const CARDIO_PROGRAM: WorkoutProgram = {
  id: 'prog-cardio-1',
  name: 'Amélioration Cardio',
  objective: 'Amélioration cardio',
  weekCount: 4,
  sessionsByWeek: createWeeklyProgram(
    [
      {
        id: 1,
        name: 'Cardio A (HIIT)',
        exercises: [
          {
            id: 1,
            exerciseId: 'ex-cardio-1',
            name: 'Tapis de course',
            illustrationUrl: 'https://img.gymvisual.com/illustrations/107/male-Treadmill.png',
            sets: '8',
            isDetailed: false,
            details: Array(8).fill({
              reps: '30s sprint / 60s repos',
              load: { value: '14', unit: 'km/h' },
              tempo: 'N/A',
              rest: '60s',
            }),
            intensification: [],
            alternatives: [],
          },
        ],
      },
      {
        id: 2,
        name: 'Cardio B (Endurance)',
        exercises: [
          {
            id: 1,
            exerciseId: 'ex-cardio-2',
            name: 'Vélo elliptique',
            illustrationUrl:
              'https://img.gymvisual.com/illustrations/68/male-Elliptical-trainer.png',
            sets: '1',
            isDetailed: false,
            details: Array(1).fill({
              reps: '30 min',
              load: { value: '6', unit: 'RPE' },
              tempo: 'N/A',
              rest: 'N/A',
            }),
            intensification: [],
            alternatives: [],
          },
        ],
      },
    ],
    4
  ),
};

export const INITIAL_PROGRAMS: WorkoutProgram[] = [
  FULL_BODY_FOUNDATION,
  FORCE_PROGRESSION_CYCLE,
  TONING_PROGRAM,
  CARDIO_PROGRAM,
];

// --- SESSIONS ---
export const INITIAL_SESSIONS: WorkoutSession[] = [];

// --- NUTRITION PLANS ---
const SAMPLE_NUTRITION_PLAN: NutritionPlan = {
  id: 'plan-masse-1',
  name: 'Plan Prise de Masse 2500kcal',
  objective: 'Prise de masse musculaire progressive en limitant la prise de gras.',
  coachId: 'coach-1',
  weekCount: 1,
  daysByWeek: {
    '1': [
      {
        id: 1,
        name: 'Jour 1',
        meals: [
          {
            id: 'breakfast',
            name: 'Petit-déjeuner',
            items: [
              { id: 'i1', food: findFood("Flocons d'avoine"), quantity: 80, unit: 'g' },
              { id: 'i2', food: findFood('Whey Protein'), quantity: 30, unit: 'g' },
              { id: 'i3', food: findFood('Amande'), quantity: 20, unit: 'g' },
            ],
          },
          {
            id: 'lunch',
            name: 'Déjeuner',
            items: [
              { id: 'l1', food: findFood('Poulet, blanc, sans peau'), quantity: 150, unit: 'g' },
              { id: 'l2', food: findFood('Riz blanc, cuit'), quantity: 200, unit: 'g' },
              { id: 'l3', food: findFood('Brocoli, cuit'), quantity: 150, unit: 'g' },
              { id: 'l4', food: findFood("Huile d'olive"), quantity: 10, unit: 'ml' },
            ],
          },
          {
            id: 'snack1',
            name: 'Collation',
            items: [
              { id: 'c1', food: findFood('Fromage blanc 0% MG'), quantity: 200, unit: 'g' },
              { id: 'c2', food: findFood('Pomme'), quantity: 150, unit: 'g' },
            ],
          },
          {
            id: 'dinner',
            name: 'Dîner',
            items: [
              { id: 'd1', food: findFood('Saumon, cuit'), quantity: 150, unit: 'g' },
              { id: 'd2', food: findFood('Patate douce, cuite'), quantity: 200, unit: 'g' },
              { id: 'd3', food: findFood('Haricots verts, cuits'), quantity: 150, unit: 'g' },
            ],
          },
        ],
      },
    ],
  },
};
export const INITIAL_NUTRITION_PLANS: NutritionPlan[] = [SAMPLE_NUTRITION_PLAN];

// --- NOTIFICATIONS ---
export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: `notif-1724690000000`,
    userId: 'coach-1',
    fromName: 'Jean Dupont',
    type: 'session_completed',
    message: 'a terminé la séance : Séance B.',
    link: '/app/client/client-1',
    isRead: false,
    timestamp: new Date().toISOString(),
  },
];

// --- MESSAGES ---
export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: 'client-2',
    clientId: 'client-2',
    text: "Salut coach ! J'ai une question sur l'exercice de squat.",
    timestamp: '10:30',
    isVoice: false,
    seenByCoach: false,
    seenByClient: true,
  },
  {
    id: 'm2',
    senderId: 'coach-1',
    clientId: 'client-2',
    text: 'Bonjour Marie, bien sûr. Quelle est ta question ?',
    timestamp: '10:31',
    isVoice: false,
    seenByCoach: true,
    seenByClient: false,
  },
  {
    id: 'm3',
    senderId: 'client-2',
    clientId: 'client-2',
    text: 'Je ne suis pas sûre de ma posture, est-ce que je descends assez bas ?',
    timestamp: '10:32',
    isVoice: false,
    seenByCoach: false,
    seenByClient: true,
  },
  {
    id: 'm4',
    senderId: 'client-1',
    clientId: 'client-1',
    text: "La séance d'hier était top !",
    timestamp: '09:15',
    isVoice: false,
    seenByCoach: true,
    seenByClient: true,
  },
  {
    id: 'm5',
    senderId: 'coach-1',
    clientId: 'client-1',
    text: "Super Jean, content que ça t'ait plu ! N'hésite pas si tu as des courbatures.",
    timestamp: '09:20',
    isVoice: false,
    seenByCoach: true,
    seenByClient: false,
  },
];

// --- CLIENT FORMATIONS ---
export const INITIAL_CLIENT_FORMATIONS: ClientFormation[] = [
  {
    id: 'form-1',
    title: 'Guide des Compléments Alimentaires',
    coachId: 'coach-1',
    type: 'file',
    fileName: 'guide-complements.pdf',
    fileContent: '...',
  },
  {
    id: 'form-2',
    title: 'Tutoriel Foam Roller',
    coachId: 'coach-1',
    type: 'link',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
];

// --- PROFESSIONAL FORMATIONS ---
export const INITIAL_PROFESSIONAL_FORMATIONS: ProfessionalFormation[] = [
  {
    id: 'proform-1',
    title: 'Marketing pour Coachs Sportifs',
    description: 'Apprenez à développer votre clientèle et à promouvoir vos services efficacement.',
    price: 299,
    coverImageUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=800',
    accessType: 'purchase',
  },
  {
    id: 'proform-2',
    title: 'Nutrition Avancée',
    description:
      'Maîtrisez les principes de la nutrition sportive pour optimiser les performances de vos clients.',
    price: 499,
    coverImageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800',
    accessType: 'purchase',
  },
  {
    id: 'proform-3',
    title: 'Anatomie et Biomécanique',
    description:
      'Approfondissez vos connaissances pour une programmation plus sûre et plus efficace.',
    price: 349,
    coverImageUrl: 'https://images.unsplash.com/photo-1581009137052-c0b2405a5338?q=80&w=800',
    accessType: 'purchase',
  },
];

// --- USERS (Clients, Coaches, Admins) ---
export const INITIAL_CLIENTS: Client[] = [
  // --- ADMIN ---
  {
    id: 'admin-1',
    status: 'active',
    firstName: 'Admin',
    lastName: 'MKTraining',
    email: 'contact@mktraining.fr',
    password: 'darsche',
    role: 'admin',
    phone: '',
    age: 99,
    sex: 'Homme',
    registrationDate: '2020-01-01',
    objective: 'Gérer la plateforme',
    notes: '',
    height: 175,
    weight: 70,
    energyExpenditureLevel: 'Sédentaire',
    medicalInfo: { history: '', allergies: '' },
    nutrition: {
      measurements: {},
      weightHistory: [],
      calorieHistory: [],
      macros: { protein: 0, carbs: 0, fat: 0 },
      historyLog: [],
    },
  },
  // --- COACHES ---
  {
    id: 'coach-1',
    status: 'active',
    firstName: 'Thomas',
    lastName: 'Durant',
    email: 'thomas.durant@email.com',
    password: 'password',
    role: 'coach',
    phone: '0611223344',
    age: 35,
    sex: 'Homme',
    registrationDate: '2021-01-01',
    affiliationCode: '123456',
    objective: 'Suivre mes clients',
    notes: '',
    height: 182,
    weight: 85,
    energyExpenditureLevel: 'Actif',
    medicalInfo: { history: '', allergies: '' },
    nutrition: {
      measurements: {},
      weightHistory: [],
      calorieHistory: [],
      macros: { protein: 0, carbs: 0, fat: 0 },
      historyLog: [],
    },
  },
  {
    id: 'coach-2',
    status: 'active',
    firstName: 'Sophie',
    lastName: 'Lambert',
    email: 'sophie.lambert@email.com',
    password: 'password',
    role: 'coach',
    phone: '0655667788',
    age: 29,
    sex: 'Femme',
    registrationDate: '2022-06-15',
    affiliationCode: '654321',
    objective: 'Spécialiste Crosstraining',
    notes: '',
    height: 168,
    weight: 60,
    energyExpenditureLevel: 'Très actif',
    medicalInfo: { history: '', allergies: '' },
    nutrition: {
      measurements: {},
      weightHistory: [],
      calorieHistory: [],
      macros: { protein: 0, carbs: 0, fat: 0 },
      historyLog: [],
    },
  },
  // --- CLIENTS ---
  {
    id: 'client-1',
    status: 'active',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@email.com',
    password: 'password',
    role: 'client',
    coachId: 'coach-1',
    phone: '0612345678',
    age: 32,
    sex: 'Homme',
    registrationDate: '2023-01-15',
    address: '123 rue de la Forme, 75001 Paris',
    dob: '1992-03-20',
    height: 180,
    weight: 80,
    energyExpenditureLevel: 'Actif',
    programWeek: 2,
    totalWeeks: 8,
    sessionProgress: 2,
    totalSessions: 3,
    viewed: false,
    objective: 'Prise de masse musculaire',
    notes:
      '--- 10/07/2024 ---\nFaire attention au genou droit sur les exercices de squat.\n\n--- 05/07/2024 ---\nBonne progression sur le développé couché.',
    medicalInfo: { history: 'Aucun antécédent notable.', allergies: 'Pollen' },
    nutrition: {
      measurements: {
        neck: 40,
        chest: 105,
        l_bicep: 38,
        r_bicep: 38.5,
        waist: 85,
        hips: 95,
        l_thigh: 60,
        r_thigh: 61,
      },
      weightHistory: [
        { date: 'W1', value: 78 },
        { date: 'W2', value: 78.5 },
        { date: 'W3', value: 79 },
        { date: 'W4', value: 79.2 },
        { date: 'W5', value: 80 },
      ],
      calorieHistory: [
        { date: 'W1', value: 2800 },
        { date: 'W2', value: 2850 },
        { date: 'W3', value: 2900 },
        { date: 'W4', value: 3000 },
        { date: 'W5', value: 3000 },
      ],
      macros: { protein: 160, carbs: 350, fat: 80 },
      historyLog: [
        {
          date: '05/08/2024',
          weight: 80.0,
          calories: 3000,
          macros: { protein: 160, carbs: 350, fat: 80 },
          measurements: {
            neck: 40,
            chest: 105,
            l_bicep: 38,
            r_bicep: 38.5,
            waist: 85,
            hips: 95,
            l_thigh: 60,
            r_thigh: 61,
          },
        },
        {
          date: '29/07/2024',
          weight: 79.2,
          calories: 3000,
          macros: { protein: 160, carbs: 350, fat: 80 },
        },
        {
          date: '22/07/2024',
          weight: 78.5,
          calories: 2800,
          macros: { protein: 150, carbs: 300, fat: 88 },
          measurements: {
            neck: 39,
            chest: 104,
            l_bicep: 37.5,
            r_bicep: 38,
            waist: 86,
            hips: 95,
            l_thigh: 59,
            r_thigh: 60,
          },
        },
        {
          date: '15/07/2024',
          weight: 78,
          calories: 2800,
          macros: { protein: 150, carbs: 300, fat: 88 },
        },
      ],
    },
    performanceLog: [
      // WEEK 1
      {
        date: '12/08/2024',
        week: 1,
        programName: 'Full Body Foundation',
        sessionName: 'Séance A',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Squat',
            loggedSets: [
              { reps: '12', load: '80', viewedByCoach: true },
              { reps: '11', load: '80', viewedByCoach: true },
              { reps: '10', load: '80', viewedByCoach: true },
            ],
          },
          {
            exerciseId: 2,
            exerciseName: 'Développé couché',
            loggedSets: [
              { reps: '10', load: '55', viewedByCoach: true },
              { reps: '10', load: '55', viewedByCoach: true },
              { reps: '9', load: '55', viewedByCoach: true },
            ],
          },
          {
            exerciseId: 3,
            exerciseName: 'Rowing barre',
            loggedSets: [
              { reps: '12', load: '45', viewedByCoach: true },
              { reps: '12', load: '45', viewedByCoach: true },
              { reps: '12', load: '45', viewedByCoach: true },
            ],
          },
        ],
      },
      {
        date: '14/08/2024',
        week: 1,
        programName: 'Full Body Foundation',
        sessionName: 'Séance B',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Soulevé de terre',
            loggedSets: [
              { reps: '8', load: '90', viewedByCoach: true },
              { reps: '8', load: '90', viewedByCoach: true },
              { reps: '8', load: '90', viewedByCoach: true },
            ],
          },
          {
            exerciseId: 2,
            exerciseName: 'Développé militaire',
            loggedSets: [
              { reps: '10', load: '35', viewedByCoach: true },
              { reps: '9', load: '35', viewedByCoach: true },
              { reps: '8', load: '35', viewedByCoach: true, comment: "C'était dur sur la fin !" },
            ],
          },
          {
            exerciseId: 3,
            exerciseName: 'Traction',
            loggedSets: [
              { reps: '6', load: '0', viewedByCoach: true },
              { reps: '5', load: '0', viewedByCoach: true },
              { reps: '5', load: '0', viewedByCoach: true },
            ],
          },
        ],
      },
      {
        date: '16/08/2024',
        week: 1,
        programName: 'Full Body Foundation',
        sessionName: 'Séance C',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Fentes',
            loggedSets: [
              { reps: '12', load: '10', viewedByCoach: true },
              { reps: '12', load: '10', viewedByCoach: true },
              { reps: '12', load: '10', viewedByCoach: true },
            ],
          },
          {
            exerciseId: 2,
            exerciseName: 'Élévations latérales',
            loggedSets: [
              { reps: '15', load: '6', viewedByCoach: true },
              { reps: '15', load: '6', viewedByCoach: true },
              { reps: '14', load: '6', viewedByCoach: true },
              { reps: '14', load: '6', viewedByCoach: true },
            ],
          },
          {
            exerciseId: 3,
            exerciseName: 'Planche',
            loggedSets: [
              { reps: '60s', load: '0', viewedByCoach: true },
              { reps: '60s', load: '0', viewedByCoach: true },
              { reps: '50s', load: '0', viewedByCoach: true },
            ],
          },
        ],
      },
      // WEEK 2
      {
        date: '19/08/2024',
        week: 2,
        programName: 'Full Body Foundation',
        sessionName: 'Séance A',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Squat',
            loggedSets: [
              { reps: '12', load: '82.5', viewedByCoach: false },
              { reps: '12', load: '82.5', viewedByCoach: false },
              { reps: '11', load: '82.5', viewedByCoach: false },
            ],
          },
          {
            exerciseId: 2,
            exerciseName: 'Développé couché',
            loggedSets: [
              { reps: '10', load: '57.5', viewedByCoach: false },
              { reps: '10', load: '57.5', viewedByCoach: false },
              { reps: '10', load: '57.5', viewedByCoach: false },
            ],
          },
          {
            exerciseId: 3,
            exerciseName: 'Rowing barre',
            loggedSets: [
              {
                reps: '12',
                load: '47.5',
                viewedByCoach: false,
                comment: 'Bonne progression ici !',
              },
              { reps: '12', load: '47.5', viewedByCoach: false },
              { reps: '12', load: '47.5', viewedByCoach: false },
            ],
          },
        ],
      },
    ],
    assignedPrograms: [FULL_BODY_FOUNDATION],
    assignedNutritionPlans: [SAMPLE_NUTRITION_PLAN],
  },
  {
    id: 'client-2',
    status: 'active',
    firstName: 'Marie',
    lastName: 'Curie',
    email: 'marie.curie@email.com',
    password: 'password',
    role: 'client',
    coachId: 'coach-1',
    phone: '0612345679',
    age: 28,
    sex: 'Femme',
    registrationDate: '2023-03-01',
    height: 165,
    weight: 64,
    energyExpenditureLevel: 'Actif',
    programWeek: 2,
    totalWeeks: 12,
    sessionProgress: 1,
    totalSessions: 4,
    viewed: false,
    objective: 'Perte de poids et tonification',
    notes: 'Très motivée, suit le plan à la lettre.',
    medicalInfo: { history: 'RAS', allergies: 'Aucune connue' },
    nutrition: {
      measurements: { waist: 70, hips: 98 },
      weightHistory: [
        { date: 'W1', value: 65 },
        { date: 'W2', value: 64.5 },
        { date: 'W3', value: 64 },
        { date: 'W4', value: 63.8 },
      ],
      calorieHistory: [
        { date: 'W1', value: 1800 },
        { date: 'W2', value: 1800 },
        { date: 'W3', value: 1750 },
        { date: 'W4', value: 1750 },
      ],
      macros: { protein: 120, carbs: 180, fat: 60 },
      historyLog: [],
    },
    performanceLog: [
      {
        date: '08/07/2024',
        week: 1,
        programName: 'Perte de poids et tonification',
        sessionName: 'Haut du corps A',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Développé couché',
            loggedSets: [
              { reps: '15', load: '18', viewedByCoach: true },
              { reps: '15', load: '18', viewedByCoach: true },
              { reps: '14', load: '18', viewedByCoach: true },
            ],
          },
          {
            exerciseId: 2,
            exerciseName: 'Élévations latérales',
            loggedSets: [
              { reps: '20', load: '4', viewedByCoach: true },
              { reps: '18', load: '4', viewedByCoach: true },
              { reps: '18', load: '4', viewedByCoach: true },
            ],
          },
        ],
      },
      {
        date: '10/07/2024',
        week: 1,
        programName: 'Perte de poids et tonification',
        sessionName: 'Bas du corps A',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Squat',
            loggedSets: [
              { reps: '15', load: '30', viewedByCoach: true },
              { reps: '15', load: '30', viewedByCoach: true },
              { reps: '15', load: '30', viewedByCoach: true },
            ],
          },
          {
            exerciseId: 2,
            exerciseName: 'Leg Curl',
            loggedSets: [
              { reps: '20', load: '20', viewedByCoach: true },
              { reps: '20', load: '20', viewedByCoach: true },
              { reps: '18', load: '20', viewedByCoach: true },
            ],
          },
        ],
      },
      {
        date: '15/07/2024',
        week: 2,
        programName: 'Perte de poids et tonification',
        sessionName: 'Haut du corps A',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Développé couché',
            loggedSets: [
              { reps: '15', load: '20', viewedByCoach: false },
              { reps: '14', load: '20', viewedByCoach: false },
              { reps: '12', load: '20', viewedByCoach: false },
            ],
          },
          {
            exerciseId: 2,
            exerciseName: 'Élévations latérales',
            loggedSets: [
              { reps: '18', load: '5', viewedByCoach: false },
              { reps: '16', load: '5', viewedByCoach: false },
              { reps: '15', load: '5', viewedByCoach: false, comment: 'Difficile sur la fin' },
            ],
          },
        ],
      },
    ],
    assignedPrograms: [TONING_PROGRAM],
    grantedFormationIds: ['form-1'],
    assignedNutritionPlans: [],
  },
  {
    id: 'client-3',
    status: 'active',
    firstName: 'Pierre',
    lastName: 'Martin',
    email: 'pierre.martin@email.com',
    password: 'password',
    role: 'client',
    coachId: 'coach-1',
    phone: '0687654321',
    age: 45,
    sex: 'Homme',
    registrationDate: '2022-11-05',
    height: 178,
    weight: 78,
    energyExpenditureLevel: 'Très actif',
    programWeek: 4,
    totalWeeks: 4,
    sessionProgress: 2,
    totalSessions: 2,
    viewed: false,
    objective: 'Amélioration cardio',
    notes: 'Augmenter les poids progressivement.',
    medicalInfo: { history: '', allergies: '' },
    nutrition: {
      measurements: {},
      weightHistory: [],
      calorieHistory: [],
      macros: { protein: 0, carbs: 0, fat: 0 },
      historyLog: [],
    },
    performanceLog: [
      {
        date: '16/07/2024',
        week: 1,
        programName: 'Amélioration Cardio',
        sessionName: 'Cardio A (HIIT)',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Tapis de course',
            loggedSets: [
              { reps: '30s sprint / 60s repos', load: '14', viewedByCoach: true },
              { reps: '30s sprint / 60s repos', load: '14', viewedByCoach: true },
              { reps: '30s sprint / 60s repos', load: '14.5', viewedByCoach: true },
              { reps: '30s sprint / 60s repos', load: '14.5', viewedByCoach: true },
              {
                reps: '30s sprint / 60s repos',
                load: '15',
                viewedByCoach: true,
                comment: 'Super séance !',
              },
            ],
          },
        ],
      },
      {
        date: '18/07/2024',
        week: 1,
        programName: 'Amélioration Cardio',
        sessionName: 'Cardio B (Endurance)',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Vélo elliptique',
            loggedSets: [{ reps: '30 min', load: '6', viewedByCoach: true }],
          },
        ],
      },
      {
        date: '23/07/2024',
        week: 2,
        programName: 'Amélioration Cardio',
        sessionName: 'Cardio A (HIIT)',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Tapis de course',
            loggedSets: [
              { reps: '30s sprint / 60s repos', load: '15', viewedByCoach: true },
              { reps: '30s sprint / 60s repos', load: '15', viewedByCoach: true },
              { reps: '30s sprint / 60s repos', load: '15', viewedByCoach: true },
              { reps: '30s sprint / 60s repos', load: '15.5', viewedByCoach: true },
              { reps: '30s sprint / 60s repos', load: '15.5', viewedByCoach: true },
            ],
          },
        ],
      },
      {
        date: '25/07/2024',
        week: 2,
        programName: 'Amélioration Cardio',
        sessionName: 'Cardio B (Endurance)',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Vélo elliptique',
            loggedSets: [{ reps: '32 min', load: '6', viewedByCoach: true }],
          },
        ],
      },
      {
        date: '30/07/2024',
        week: 3,
        programName: 'Amélioration Cardio',
        sessionName: 'Cardio A (HIIT)',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Tapis de course',
            loggedSets: [
              { reps: '30s sprint / 55s repos', load: '15.5', viewedByCoach: true },
              { reps: '30s sprint / 55s repos', load: '15.5', viewedByCoach: true },
              { reps: '30s sprint / 55s repos', load: '16', viewedByCoach: true },
              { reps: '30s sprint / 55s repos', load: '16', viewedByCoach: true },
              {
                reps: '30s sprint / 55s repos',
                load: '16',
                viewedByCoach: true,
                comment: 'Ça commence à piquer !',
              },
            ],
          },
        ],
      },
      {
        date: '01/08/2024',
        week: 3,
        programName: 'Amélioration Cardio',
        sessionName: 'Cardio B (Endurance)',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Vélo elliptique',
            loggedSets: [{ reps: '35 min', load: '6.5', viewedByCoach: true }],
          },
        ],
      },
      {
        date: '06/08/2024',
        week: 4,
        programName: 'Amélioration Cardio',
        sessionName: 'Cardio A (HIIT)',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Tapis de course',
            loggedSets: [
              { reps: '30s sprint / 50s repos', load: '16', viewedByCoach: true },
              { reps: '30s sprint / 50s repos', load: '16', viewedByCoach: true },
              { reps: '30s sprint / 50s repos', load: '16.5', viewedByCoach: true },
              { reps: '30s sprint / 50s repos', load: '16.5', viewedByCoach: true },
              { reps: '30s sprint / 50s repos', load: '17', viewedByCoach: true },
            ],
          },
        ],
      },
      {
        date: '08/08/2024',
        week: 4,
        programName: 'Amélioration Cardio',
        sessionName: 'Cardio B (Endurance)',
        exerciseLogs: [
          {
            exerciseId: 1,
            exerciseName: 'Vélo elliptique',
            loggedSets: [
              {
                reps: '40 min',
                load: '6.5',
                viewedByCoach: false,
                comment: 'Programme terminé ! Super sensations.',
              },
            ],
          },
        ],
      },
    ],
    assignedPrograms: [CARDIO_PROGRAM],
    assignedNutritionPlans: [],
  },
  {
    id: 'client-4',
    status: 'active',
    firstName: 'Lucas',
    lastName: 'Garcia',
    email: 'lucas.garcia@email.com',
    password: 'password',
    role: 'client',
    coachId: 'coach-1',
    phone: '0698765432',
    age: 25,
    sex: 'Homme',
    registrationDate: '2023-05-01',
    height: 175,
    weight: 72,
    energyExpenditureLevel: 'Légèrement actif',
    viewed: true,
    objective: 'Débuter la musculation',
    notes: 'Focus sur la technique.',
    medicalInfo: { history: '', allergies: '' },
    nutrition: {
      measurements: {},
      weightHistory: [],
      calorieHistory: [],
      macros: { protein: 0, carbs: 0, fat: 0 },
      historyLog: [],
    },
    performanceLog: [],
    assignedPrograms: [],
    assignedNutritionPlans: [],
  },
  // --- PROSPECTS ---
  {
    id: 'prospect-1',
    status: 'prospect',
    coachId: 'coach-1',
    firstName: 'Luc',
    lastName: 'Skywalker',
    email: 'l.skywalker@email.com',
    password: 'password',
    role: 'client',
    phone: '0601020304',
    age: 22,
    sex: 'Homme',
    registrationDate: '2023-05-10',
    objective: 'Devenir un Jedi.',
    notes: '',
    height: 170,
    weight: 68,
    energyExpenditureLevel: 'Actif',
    medicalInfo: { history: '', allergies: '' },
    nutrition: {
      measurements: {},
      weightHistory: [],
      calorieHistory: [],
      macros: { protein: 0, carbs: 0, fat: 0 },
      historyLog: [],
    },
    assignedNutritionPlans: [],
  },
  {
    id: 'prospect-2',
    status: 'prospect',
    coachId: 'coach-2',
    firstName: 'Leia',
    lastName: 'Organa',
    email: 'l.organa@email.com',
    password: 'password',
    role: 'client',
    phone: '0601020305',
    age: 22,
    sex: 'Femme',
    registrationDate: '2023-06-15',
    objective: 'Restaurer la République.',
    notes: 'Ancien client',
    height: 155,
    weight: 55,
    energyExpenditureLevel: 'Légèrement actif',
    medicalInfo: { history: '', allergies: '' },
    nutrition: {
      measurements: {},
      weightHistory: [],
      calorieHistory: [],
      macros: { protein: 0, carbs: 0, fat: 0 },
      historyLog: [],
    },
    assignedNutritionPlans: [],
  },
];

// --- PARTNERS, PRODUCTS, TECHNIQUES ---
export const INITIAL_PARTNERS: Partner[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_INTENSIFICATION_TECHNIQUES: IntensificationTechnique[] = [];
