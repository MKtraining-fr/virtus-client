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
  sex?: 'Homme' | 'Femme';
  height?: number;
  weight?: number;
  address?: string;
  energyExpenditureLevel?: string;
  objective?: string;
  notes?: string;
  status?: 'active' | 'prospect' | 'archived';
  archived_at?: string; // Date d'archivage (ISO string) pour gérer le délai de grâce de 7 jours
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

export interface ExercisePerformanceData {
  setNumber: number;
  repsAchieved: number | null;
  loadAchieved: string | null;
  rpe: number | null;
  notes: string | null;
  performedAt: string | null;
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
  performanceData?: ExercisePerformanceData[];
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
  completedAt?: string | null;
  viewedByCoach?: boolean;
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
export type MessageType = 'text' | 'voice' | 'document';

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  // Type de message
  messageType: MessageType;
  // Indicateur de lecture
  readAt?: string; // Horodatage de lecture par le destinataire
  isRead: boolean; // Alias pour compatibilité
  // Champs vocaux
  isVoice: boolean; // Deprecated, utiliser messageType === 'voice'
  voiceUrl?: string;
  voiceDuration?: number; // Durée en secondes
  // Champs pièces jointes
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string; // Type MIME
  // Champs legacy
  seenBySender: boolean;
  seenByRecipient: boolean;
  seenByCoach?: boolean; // Pour compatibilité avec l'ancien code
  subject?: string;
  text?: string; // Alias pour content
  clientId?: string; // Pour compatibilité
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

// ---- PERFORMANCE & TRAINING INFO TYPES ----

export interface ForbiddenMovement {
  exerciseId: string;
  exerciseName: string;
  reason: string;
}

export interface ClientTrainingInfo {
  id: string;
  clientId: string;
  experience?: string;
  trainingSince?: string;
  sessionsPerWeek?: number;
  sessionDuration?: number;
  trainingType?: string;
  issues?: string;
  forbiddenMovements: ForbiddenMovement[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ExerciseRecord {
  id: string;
  clientId: string;
  exerciseId: string;
  exerciseName?: string; // Jointure optionnelle
  exerciseEquipment?: string; // Jointure optionnelle
  weight: number;
  reps: number;
  sets: number;
  rir: number;
  oneRmCalculated?: number;
  source: 'manual' | 'session' | 'initial_assessment';
  sessionId?: string;
  notes?: string;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ExerciseProjection {
  id: string;
  clientId: string;
  exerciseId: string;
  exerciseName?: string; // Jointure optionnelle
  targetReps: number;
  projectedWeight: number;
  basedOnPerformanceId: string;
  actualWeight?: number;
  actualPerformanceId?: string;
  difference?: number;
  differencePercent?: number;
  nervousProfile?: 'force' | 'endurance' | 'balanced';
  createdAt: string;
  updatedAt: string;
}


// ---- INJURY & PAIN TYPES ----

/**
 * Type de blessure ou douleur
 */
export type InjuryType = 'injury' | 'chronic_pain' | 'surgery' | 'limitation';

/**
 * Sévérité de la blessure ou douleur
 */
export type InjurySeverity = 'mild' | 'moderate' | 'severe';

/**
 * Statut actuel de la blessure
 */
export type InjuryStatus = 'active' | 'recovering' | 'healed' | 'chronic';

/**
 * Parties du corps supportées par react-body-highlighter
 */
export type BodyPart =
  | 'head'
  | 'neck'
  | 'trapezius'
  | 'upper-back'
  | 'lower-back'
  | 'chest'
  | 'abs'
  | 'obliques'
  | 'front-deltoids'
  | 'back-deltoids'
  | 'biceps'
  | 'triceps'
  | 'forearm'
  | 'gluteal'
  | 'adductor'
  | 'abductors'
  | 'quadriceps'
  | 'hamstring'
  | 'calves';

/**
 * Données d'une blessure ou douleur chronique
 */
export interface InjuryData {
  id: string;
  bodyPart: BodyPart;
  type: InjuryType;
  description: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  since?: string; // Date de début (ISO string)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Informations médicales étendues avec blessures
 */
export interface MedicalInfoExtended {
  history?: string;
  allergies?: string;
  injuries?: InjuryData[];
}
