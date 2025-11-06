import React from 'react';

// ---- GENERAL ----
export type UserRole = 'admin' | 'coach' | 'client';

export interface Notification {
  id: string;
  userId: string;
  fromName: string;
  type: 'assignment' | 'session_completed' | 'message';
  message: string;
  link: string;
  isRead: boolean;
  timestamp: string;
}

// ---- BILAN TEMPLATES ----
export type BilanFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'radio_yes_no'
  | 'scale'
  | 'date';

export interface BilanField {
  id: string;
  label: string;
  type: BilanFieldType;
  placeholder?: string;
  options?: string[];
  hasOther?: boolean;
  otherFieldId?: string;
  conditionalOn?: string;
  conditionalValue?: string;
}

export interface BilanSection {
  id: string;
  title: string;
  isRemovable: boolean;
  fields: BilanField[];
  isCivility?: boolean;
}

export interface BilanTemplate {
  id: string;
  name: string;
  coachId: 'system' | string;
  sections: BilanSection[];
}

export interface BilanAssignment {
  id: string;
  clientId: string;
  coachId: string;
  templateId: string;
  templateName: string;
  status: 'pending' | 'completed';
  assignedAt: string;
  completedAt?: string;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextAssignmentDate?: string;
  // Les réponses seront stockées dans une autre table ou directement dans la table client.bilans[]
}

export interface BilanResult {
  id: string;
  templateId: string;
  templateName: string;
  status: 'pending' | 'completed';
  assignedAt: string;
  completedAt?: string;
  answers?: Record<string, unknown>;
}

// ---- CLIENTS / USERS ----
export interface Measurement {
  neck?: number;
  chest?: number;
  l_bicep?: number;
  r_bicep?: number;
  waist?: number;
  hips?: number;
  l_thigh?: number;
  r_thigh?: number;
}

export interface DataPoint {
  date: string;
  value: number;
}

export interface MacroData {
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionLogEntry {
  date: string;
  weight: number | null;
  calories: number;
  macros: MacroData;
  measurements?: Measurement;
}

export interface PerformanceSet {
  reps: string;
  load: string;
  comment?: string;
  viewedByCoach?: boolean;
  restTime?: string;
}

export interface ExerciseLog {
  exerciseId: number;
  exerciseName: string;
  loggedSets: PerformanceSet[];
}

export interface PerformanceLog {
  date: string;
  week: number;
  programName: string;
  sessionName: string;
  exerciseLogs: ExerciseLog[];
}

export interface SharedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileContent: string; // base64
  uploadedAt: string;
  size: number; // in bytes
}

export interface Client {
  id: string;
  status: 'active' | 'archived' | 'prospect';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  sex: 'Homme' | 'Femme' | 'Autre';
  address?: string;
  dob?: string;
  registrationDate: string;
  role: UserRole;
  coachId?: string;
  affiliationCode?: string;
  avatar?: string;

  height?: number;
  weight?: number;
  energyExpenditureLevel?: 'Sédentaire' | 'Légèrement actif' | 'Actif' | 'Très actif';

  // For Dashboard view
  programWeek?: number;
  totalWeeks?: number;
  sessionProgress?: number;
  totalSessions?: number;
  viewed?: boolean;

  // For Profile View
  objective: string;
  notes: string;
  medicalInfo: {
    history: string;
    allergies: string;
  };
  lifestyle?: {
    profession: string;
  };
  bilans?: BilanResult[];
  nutrition: {
    measurements: Measurement;
    weightHistory: DataPoint[];
    calorieHistory: DataPoint[];
    macros: MacroData;
    foodAversions?: string;
    generalHabits?: string;
    historyLog: NutritionLogEntry[];
    foodJournal?: Record<string, Meal[]>; // Key: "YYYY-MM-DD"
  };
  assignedPrograms?: WorkoutProgram[];
  savedPrograms?: WorkoutProgram[];
  performanceLog?: PerformanceLog[];
  assignedNutritionPlans?: NutritionPlan[];
  grantedFormationIds?: string[];
  sharedFiles?: SharedFile[];
  canUseWorkoutBuilder?: boolean;
  shopAccess?: {
    adminShop: boolean;
    coachShop: boolean;
  };
}

// ---- WORKOUT ----
export interface Exercise {
  id: string;
  name: string;
  category: 'Musculation' | 'Mobilité' | 'Échauffement';
  description: string;
  videoUrl: string;
  illustrationUrl: string;
  equipment?: string;
  alternativeIds?: string[];
  muscleGroups?: string[]; // Groupes musculaires principaux
  secondaryMuscleGroups?: string[]; // Groupes musculaires secondaires
  coachId?: 'system' | string;
}

export interface WorkoutExercise {
  id: number;
  exerciseId: string; // Ref to Exercise DB
  name: string;
  illustrationUrl: string;
  sets: string;
  isDetailed: boolean;
  details?: {
    reps: string;
    load: { value: string; unit: 'kg' | '%' | 'RPE' | 'km/h' | 'W' | 'lvl' };
    tempo: string;
    rest: string;
  }[];
  intensification: { id: number; value: string }[];
  alternatives?: { id: string; name: string; illustrationUrl: string }[];
  notes?: string | null;
}

export interface WorkoutSession {
  id: number;
  name: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutProgram {
  id: string;
  name: string;
  objective: string;
  weekCount: number;
  clientId?: string;
  sessionsByWeek: Record<number, WorkoutSession[]>;
}

// ---- MESSAGING ----
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  isVoice: boolean;
  voiceUrl?: string;
  seenBySender: boolean;
  seenByRecipient: boolean;
}

// ---- NUTRITION ----
export interface FoodItem {
  name: string;
  category: string;
  calories: number; // per 100g/ml
  protein: number; // per 100g/ml
  carbs: number; // per 100g/ml
  fat: number; // per 100g/ml
}

export interface MealItem {
  id: string; // unique id for this item in the meal
  food: FoodItem; // a copy of the food item data
  quantity: number; // in grams or ml
  unit: 'g' | 'ml';
}

export interface Meal {
  id: string; // e.g. 'breakfast', 'lunch'
  name: string; // 'Petit-déjeuner'
  items: MealItem[];
  // FIX: Add optional steps, coachId, and type properties to support recipes.
  steps?: string[];
  coachId?: string;
  type?: 'Recette' | 'Repas';
}

export interface NutritionDay {
  id: number; // Day number e.g. 1
  name: string; // "Jour 1"
  meals: Meal[];
}

export interface NutritionPlan {
  id: string;
  name: string;
  objective: string;
  clientId?: string;
  coachId?: string;
  weekCount: number;
  daysByWeek: Record<number, NutritionDay[]>;
}

// ---- FORMATIONS ----
export interface ClientFormation {
  id: string;
  title: string;
  coachId: string;
  type: 'file' | 'link';
  url?: string;
  fileName?: string;
  fileContent?: string; // base64
}

export interface ProfessionalFormation {
  id: string;
  title: string;
  description: string;
  price: number;
  coverImageUrl: string;
  accessType: 'purchase' | 'subscription';
}

export interface IntensificationTechnique {
  id: string;
  name: string;
  description: string;
}

// ---- SHOP ----
export interface Partner {
  id: string;
  ownerId: string; // 'admin' or coachId
  name: string;
  logoUrl: string;
  description: string;
  offerUrl: string;
}

export interface Product {
  id: string;
  ownerId: string; // 'admin' or coachId
  name: string;
  description: string;
  imageUrl: string;
  productUrl: string;
  price: number;
  category: string;
}

// ---- UI TYPES ----
export interface ClientNav {
  path: string;
  name: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
}
