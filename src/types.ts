import type { Json } from './types/database';

// ---- USER ROLES ----
export type UserRole = 'admin' | 'coach' | 'client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  createdAt: string;
}

// ---- BILAN TYPES ----
export type BilanFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'yesno'
  | 'scale'
  | 'multiselect'
  | 'file'
  | 'photo'
  | 'measurement';

export interface BilanField {
  id: string;
  label: string;
  type: BilanFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  unit?: string;
  measurementType?: string;
}

export interface BilanSection {
  id: string;
  title: string;
  fields: BilanField[];
  isCivility?: boolean;
}

export interface BilanTemplate {
  id: string;
  name: string;
  coachId: string;
  sections: BilanSection[];
}

export interface BilanAssignment {
  id: string;
  bilanTemplateId: string;
  clientId: string;
  coachId: string;
  assignedAt: string;
  dueDate?: string;
  status: 'pending' | 'completed' | 'overdue';
  completedAt?: string;
  responses?: Record<string, any>;
}

export interface BilanResult {
  id: string;
  bilanAssignmentId: string;
  templateId?: string;
  templateName?: string;
  clientId: string;
  coachId: string;
  responses?: Record<string, any>;
  answers?: Record<string, any>;
  status?: 'pending' | 'completed' | 'overdue';
  assignedAt?: string;
  completedAt?: string;
}

// ---- NUTRITION TYPES ----
export interface Measurement {
  date: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  [key: string]: string | number | undefined;
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
  meals?: any[];
  totalCalories?: number;
  calories?: number;
  weight?: number | null;
  macros?: MacroData;
  measurements?: Record<string, number>;
}

export interface PerformanceSet {
  reps: string;
  load: string;
  comment?: string;
  restTime?: string;
  viewedByCoach?: boolean;
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
  name: string;
  fileName?: string;
  url: string;
  fileContent?: string;
  type: string;
  fileType?: string;
  size?: number;
  uploadedBy: string;
  uploadedAt: string;
}

// ---- CLIENT TYPES ----
// Interface pour les permissions d'accès du client
export interface ClientAccessPermissions {
  canUseWorkoutBuilder: boolean;
  grantedFormationIds: string[];
  shopAccess: {
    adminShop: boolean;
    coachShop: boolean;
  };
}

export interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  coachId?: string;
  affiliationCode?: string;
  dob?: string;
  age?: number;
  sex?: string;
  height?: number;
  weight?: number;
  address?: string;
  energyExpenditureLevel?: string;
  objective?: string;
  notes?: string;
  status?: 'active' | 'prospect' | 'archived';
  lifestyle?: Json;
  medicalInfo?: Json;
  nutrition?: Json;
  bilans?: Json;
  assignedBilans?: Json;
  nutritionLogs?: Json;
  performanceLogs?: Json;
  assignedNutritionPlans?: Json;
  createdAt: string;
  updatedAt: string;
  programName?: string;
  programWeek?: number;
  assignedProgram?: WorkoutProgram | null;
  assignedPrograms?: WorkoutProgram[];
  savedPrograms?: WorkoutProgram[];
  // Propriétés d'accès et permissions (extraites de lifestyle.access)
  canUseWorkoutBuilder?: boolean;
  grantedFormationIds?: string[];
  shopAccess?: {
    adminShop: boolean;
    coachShop: boolean;
  };
  // Champs legacy pour compatibilité
  goal?: string;
  activityLevel?: string;
  sessionProgress?: number;
}

// Alias User pour compatibilité avec le code existant
export type User = Client;

// ---- EXERCISE TYPES ----
export interface Exercise {
  id: string;
  name: string;
  description?: string;
  category?: string;
  muscleGroups?: string[];  // Array de groupes musculaires principaux
  secondaryMuscleGroups?: string[];  // Array de groupes musculaires secondaires
  equipment?: string;
  difficulty?: string;
  videoUrl?: string;
  illustrationUrl?: string;  // URL de l'illustration (renommé de imageUrl)
  type?: string;
  alternativeIds?: string[];  // IDs des exercices alternatifs (max 2)
  coachId?: string;  // ID du coach créateur (null pour exercices système)
  isPublic?: boolean;  // Visibilité publique
  isArchived?: boolean;  // Exercice archivé
}

export interface WorkoutExercise {
  id: number;
  dbId?: string;
  exerciseId: string;
  name: string;
  illustrationUrl?: string;
  sets: number | string;
  reps: string;
  load: string;
  tempo: string;
  restTime: string;
  intensification: { id: number; value: string }[];
  alternatives?: { id: string; name: string; illustrationUrl: string }[];
  notes?: string | null;
  isDetailed?: boolean;
  details?: Array<{
    reps: string;
    load: { value: string; unit: 'kg' | 'lbs' | '%' };
    tempo: string;
    rest: string;
  }>;
}

export interface WorkoutSession {
  id: number;
  name: string;
  exercises: WorkoutExercise[];
  dbId?: string;
  programId?: string;
  status?: 'pending' | 'completed' | 'skipped';
  weekNumber?: number;
  sessionOrder?: number;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  objective: string;
  weekCount: number;
  clientId?: string;
  sessionsByWeek: Record<number, WorkoutSession[]>;
  status?: 'active' | 'completed' | 'archived';
}

// ---- PROGRAM TYPES (Supabase) ----
/**
 * Type représentant un programme dans la base de données Supabase
 * Correspond à la table `programs`
 */
export interface Program {
  id: string;
  coach_id: string | null;
  name: string;
  objective: string | null;
  week_count: number;
  created_at: string;
  updated_at: string;
  sessions_per_week: number | null;
}

/**
 * Type représentant une session dans la base de données Supabase
 * Correspond à la table `sessions`
 */
export interface Session {
  id: string;
  program_id: string | null;
  created_by: string | null;
  coach_id?: string | null;
  name: string;
  week_number: number;
  session_order: number;
  day_of_week?: number | null;
  exercises: Json;
  notes: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Type représentant un exercice de session dans la base de données Supabase
 * Correspond à la table `session_exercises`
 */
export interface SessionExercise {
  id: string;
  session_id: string | null;
  exercise_id: string | null;
  coach_id: string | null;
  exercise_order: number;
  sets: number | null;
  reps: string | null;
  load: string | null;
  tempo: string | null;
  rest_time: string | null;
  intensification: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
  subject?: string;
}

// ---- NUTRITION PLAN TYPES ----
export interface MealItem {
  id: string;
  food?: FoodItem;
  quantity?: number;
  unit?: string;
}

export interface Meal {
  id: string;
  name: string;
  items: MealItem[];
}

export interface NutritionDay {
  id?: string;
  dayName?: string;
  meals?: Meal[];
}

export interface NutritionPlan {
  id: string;
  clientId?: string;
  name: string;
  description?: string;
  objective?: string;
  weekCount?: number;
  caloriesTarget?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  meals?: Json;
  daysByWeek?: Record<string, NutritionDay[]>;
  createdAt: string;
  updatedAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  // Nouveaux champs nutritionnels (Ciqual)
  sugar?: number;
  fiber?: number;
  salt?: number;
  // Champs de classification Ciqual
  ciqualCode?: string;
  subcategory?: string;
  subsubcategory?: string;
  // Champs Open Food Facts
  barcode?: string;
  brand?: string;
  nutriScore?: string; // A, B, C, D, E
  novaGroup?: number; // 1-4
  ecoScore?: string; // A-E
  allergens?: string;
  ingredients?: string;
  quantity?: string; // ex: "400g"
  // Classification par type
  foodType?: 'brut' | 'autre';
  // Métadonnées
  source?: 'ciqual' | 'openfoodfacts' | 'manual';
  servingSize?: string;
  foodFamily?: string;
  micronutrients?: Json;
  createdBy?: string;
  isPublic?: boolean;
  createdAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients?: Json;
  instructions?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  imageUrl?: string;
  createdBy?: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- INTENSIFICATION TECHNIQUES ----
export interface IntensificationTechnique {
  id: string;
  name: string;
  description?: string;
  addsSubSeries?: boolean;
  subSeriesConfig?: Json;
  createdBy?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
