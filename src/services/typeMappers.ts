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
    status: (supabaseClient as any).status || 'active', // Gérer le status (à ajouter dans Supabase)
    createdAt: supabaseClient.created_at,
    // Champs supplémentaires qui peuvent ne pas être dans Supabase
    age: 0,
    height: 0,
    weight: 0,
    goal: '',
    activityLevel: 'moderate',
    nutritionLogs: [],
    performanceLogs: [],
    assignedBilans: [],
  } as Client;
}

/**
 * Convertir un client de l'application vers le format Supabase
 */
export function mapClientToSupabaseClient(client: Partial<Client>): Partial<SupabaseClient> {
  const result: Partial<SupabaseClient> & { status?: string } = {
    email: client.email,
    first_name: client.firstName,
    last_name: client.lastName,
    phone: client.phone || null,
    role: client.role,
    coach_id: client.coachId || null,
    status: client.status || 'active', // Gérer le status
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
