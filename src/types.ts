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
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'textarea'
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
  clientId: string;
  coachId: string;
  responses: Record<string, any>;
  completedAt: string;
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
  meals: any[];
  totalCalories: number;
  macros: MacroData;
}

export interface PerformanceSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: PerformanceSet[];
}

export interface PerformanceLog {
  id: string;
  clientId: string;
  sessionId: string;
  date: string;
  exercises: ExerciseLog[];
}

export interface SharedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

// ---- CLIENT TYPES ----
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
  assignedPrograms?: WorkoutProgram[];
  savedPrograms?: WorkoutProgram[];
}

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
}

export interface WorkoutProgram {
  id: string;
  name: string;
  objective: string;
  weekCount: number;
  clientId?: string;
  sessionsByWeek: Record<number, WorkoutSession[]>;
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
export interface NutritionPlan {
  id: string;
  clientId?: string;
  name: string;
  description?: string;
  caloriesTarget?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  meals?: Json;
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
