import type { Database } from '../types/database';
import type { Client, Exercise, WorkoutProgram, NutritionPlan, Message, Notification } from '../types';

type SupabaseClient = Database['public']['Tables']['clients']['Row'];
type SupabaseExercise = Database['public']['Tables']['exercises']['Row'];
type SupabaseProgram = Database['public']['Tables']['programs']['Row'];
type SupabaseNutritionPlan = Database['public']['Tables']['nutrition_plans']['Row'];
type SupabaseMessage = Database['public']['Tables']['messages']['Row'];
type SupabaseNotification = Database['public']['Tables']['notifications']['Row'];

/**
 * Convertir un client Supabase vers le format de l'application
 */
export function mapSupabaseClientToClient(supabaseClient: SupabaseClient): Client {
  return {
    id: supabaseClient.id,
    email: supabaseClient.email,
    firstName: supabaseClient.first_name,
    lastName: supabaseClient.last_name,
    phone: supabaseClient.phone || '',
    role: supabaseClient.role as 'admin' | 'coach' | 'client',
    coachId: supabaseClient.coach_id || undefined,
    status: supabaseClient.status || 'active',
    createdAt: supabaseClient.created_at,
    // Informations générales
    dob: supabaseClient.dob || undefined,
    age: supabaseClient.age || 0,
    sex: supabaseClient.sex as Client['sex'] || undefined,
    height: supabaseClient.height || 0,
    weight: supabaseClient.weight || 0,
    address: supabaseClient.address || undefined,
    energyExpenditureLevel: supabaseClient.energy_expenditure_level as Client['energyExpenditureLevel'] || 'moderately_active',
    // Objectifs et notes
    objective: supabaseClient.objective || '',
    notes: supabaseClient.notes || '',
    // Données JSON
    lifestyle: (supabaseClient.lifestyle as any) || { profession: '' },
    medicalInfo: (supabaseClient.medical_info as any) || { history: '', allergies: '' },
    nutrition: (supabaseClient.nutrition as any) || {
      measurements: {},
      weightHistory: [],
      calorieHistory: [],
      macros: { protein: 0, carbs: 0, fat: 0 },
      foodAversions: '',
      generalHabits: '',
      historyLog: [],
    },
    bilans: (supabaseClient.bilans as any) || [],
    assignedBilans: (supabaseClient.assigned_bilans as any) || [],
    nutritionLogs: (supabaseClient.nutrition_logs as any) || [],
    performanceLogs: (supabaseClient.performance_logs as any) || [],
    assignedNutritionPlans: (supabaseClient.assigned_nutrition_plans as any) || [],
    // Champs legacy pour compatibilité
    goal: supabaseClient.objective || '',
    activityLevel: 'moderate',
  } as Client;
}

/**
 * Convertir un client de l'application vers le format Supabase
 */
export function mapClientToSupabaseClient(client: Partial<Client>): Partial<SupabaseClient> {
  const result: Partial<SupabaseClient> = {
    // Champs de base
    email: client.email,
    first_name: client.firstName,
    last_name: client.lastName,
    phone: client.phone || null,
    role: client.role,
    coach_id: client.coachId || null,
    status: client.status || 'active',
    // Informations générales
    dob: client.dob || null,
    age: client.age || null,
    sex: client.sex || null,
    height: client.height || null,
    weight: client.weight || null,
    address: client.address || null,
    energy_expenditure_level: client.energyExpenditureLevel || null,
    // Objectifs et notes
    objective: client.objective || null,
    notes: client.notes || null,
    // Données JSON
    lifestyle: client.lifestyle as any || null,
    medical_info: client.medicalInfo as any || null,
    nutrition: client.nutrition as any || null,
    bilans: client.bilans as any || null,
    assigned_bilans: client.assignedBilans as any || null,
    nutrition_logs: client.nutritionLogs as any || null,
    performance_logs: client.performanceLogs as any || null,
    assigned_nutrition_plans: client.assignedNutritionPlans as any || null,
  };
  
  // N'inclure l'ID que s'il est défini (pour les mises à jour)
  if (client.id) {
    result.id = client.id;
  }
  
  return result;
}

/**
 * Convertir un exercice Supabase vers le format de l'application
 */
export function mapSupabaseExerciseToExercise(supabaseExercise: SupabaseExercise): Exercise {
  return {
    id: supabaseExercise.id,
    name: supabaseExercise.name,
    description: supabaseExercise.description || '',
    category: supabaseExercise.category || '',
    muscleGroup: supabaseExercise.muscle_group || '',
    equipment: supabaseExercise.equipment || '',
    difficulty: supabaseExercise.difficulty || '',
    videoUrl: supabaseExercise.video_url || '',
    imageUrl: supabaseExercise.image_url || '',
  } as Exercise;
}

/**
 * Convertir un exercice de l'application vers le format Supabase
 */
export function mapExerciseToSupabaseExercise(exercise: Partial<Exercise>): Partial<SupabaseExercise> {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description || null,
    category: exercise.category || null,
    muscle_group: exercise.muscleGroup || null,
    equipment: exercise.equipment || null,
    difficulty: exercise.difficulty || null,
    video_url: exercise.videoUrl || null,
    image_url: exercise.imageUrl || null,
  };
}

/**
 * Convertir un programme Supabase vers le format de l'application
 */
export function mapSupabaseProgramToProgram(supabaseProgram: SupabaseProgram): WorkoutProgram {
  return {
    id: supabaseProgram.id,
    name: supabaseProgram.name,
    description: supabaseProgram.description || '',
    clientId: supabaseProgram.client_id || '',
    coachId: supabaseProgram.coach_id || '',
    durationWeeks: supabaseProgram.duration_weeks || 0,
    goal: supabaseProgram.goal || '',
    sessions: [], // À charger séparément
  } as WorkoutProgram;
}

/**
 * Convertir un programme de l'application vers le format Supabase
 */
export function mapProgramToSupabaseProgram(program: Partial<WorkoutProgram>): Partial<SupabaseProgram> {
  return {
    id: program.id,
    name: program.name,
    description: program.description || null,
    client_id: program.clientId || null,
    coach_id: program.coachId || null,
    duration_weeks: program.durationWeeks || null,
    goal: program.goal || null,
  };
}

/**
 * Convertir un plan nutritionnel Supabase vers le format de l'application
 */
export function mapSupabaseNutritionPlanToNutritionPlan(supabasePlan: SupabaseNutritionPlan): NutritionPlan {
  return {
    id: supabasePlan.id,
    clientId: supabasePlan.client_id || '',
    name: supabasePlan.name,
    description: supabasePlan.description || '',
    caloriesTarget: supabasePlan.calories_target || 0,
    proteinTarget: supabasePlan.protein_target || 0,
    carbsTarget: supabasePlan.carbs_target || 0,
    fatTarget: supabasePlan.fat_target || 0,
    meals: (supabasePlan.meals as any) || [],
  } as NutritionPlan;
}

/**
 * Convertir un plan nutritionnel de l'application vers le format Supabase
 */
export function mapNutritionPlanToSupabaseNutritionPlan(plan: Partial<NutritionPlan>): Partial<SupabaseNutritionPlan> {
  return {
    id: plan.id,
    client_id: plan.clientId || null,
    name: plan.name,
    description: plan.description || null,
    calories_target: plan.caloriesTarget || null,
    protein_target: plan.proteinTarget || null,
    carbs_target: plan.carbsTarget || null,
    fat_target: plan.fatTarget || null,
    meals: (plan.meals as any) || null,
  };
}

/**
 * Convertir un message Supabase vers le format de l'application
 */
export function mapSupabaseMessageToMessage(supabaseMessage: SupabaseMessage): Message {
  return {
    id: supabaseMessage.id,
    senderId: supabaseMessage.sender_id || '',
    recipientId: supabaseMessage.recipient_id || '',
    subject: supabaseMessage.subject || '',
    content: supabaseMessage.content,
    isRead: supabaseMessage.read,
    timestamp: supabaseMessage.created_at,
  } as Message;
}

/**
 * Convertir un message de l'application vers le format Supabase
 */
export function mapMessageToSupabaseMessage(message: Partial<Message>): Partial<SupabaseMessage> {
  return {
    id: message.id,
    sender_id: message.senderId || null,
    recipient_id: message.recipientId || null,
    subject: message.subject || null,
    content: message.content || '',
    read: message.isRead || false,
  };
}

/**
 * Convertir une notification Supabase vers le format de l'application
 */
export function mapSupabaseNotificationToNotification(supabaseNotification: SupabaseNotification): Notification {
  return {
    id: supabaseNotification.id,
    userId: supabaseNotification.user_id || '',
    fromName: '', // À enrichir depuis les données utilisateur
    type: (supabaseNotification.type as any) || 'message',
    message: supabaseNotification.message,
    title: supabaseNotification.title,
    link: '',
    isRead: supabaseNotification.read,
    timestamp: supabaseNotification.created_at,
  } as Notification;
}

/**
 * Convertir une notification de l'application vers le format Supabase
 */
export function mapNotificationToSupabaseNotification(notification: Partial<Notification>): Partial<SupabaseNotification> {
  return {
    id: notification.id,
    user_id: notification.userId || null,
    title: notification.title || '',
    message: notification.message || '',
    type: notification.type || null,
    read: notification.isRead || false,
  };
}


// ============================================================
// BILAN TEMPLATES MAPPERS
// ============================================================

/**
 * Convertir un template de bilan Supabase vers le format de l'application
 */
export function mapSupabaseBilanTemplateToTemplate(supabaseTemplate: any): BilanTemplate {
  return {
    id: supabaseTemplate.id,
    name: supabaseTemplate.name,
    coachId: supabaseTemplate.coach_id || 'system',
    sections: supabaseTemplate.sections || [],
  };
}

/**
 * Convertir un template de bilan de l'application vers le format Supabase
 */
export function mapBilanTemplateToSupabaseTemplate(template: Partial<BilanTemplate>): any {
  const supabaseTemplate: any = {};
  
  if (template.id !== undefined) supabaseTemplate.id = template.id;
  if (template.name !== undefined) supabaseTemplate.name = template.name;
  if (template.coachId !== undefined) {
    supabaseTemplate.coach_id = template.coachId === 'system' ? null : template.coachId;
  }
  if (template.sections !== undefined) supabaseTemplate.sections = template.sections;
  
  return supabaseTemplate;
}
