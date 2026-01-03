/**
 * Schémas de validation avec Zod
 * Ces schémas valident les données avant leur enregistrement dans Firestore
 */

import { z } from 'zod';

// ---- VALIDATION DES UTILISATEURS ----

/**
 * Schéma de validation pour l'inscription
 */
export const SignUpSchema = z.object({
  email: z
    .string()
    .email('Adresse email invalide')
    .min(5, "L'email doit contenir au moins 5 caractères")
    .max(100, "L'email ne peut pas dépasser 100 caractères")
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial'),

  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .trim(),

  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .trim(),

  role: z.enum(['admin', 'coach', 'client'], {
    message: 'Le rôle doit être admin, coach ou client',
  }),

  phone: z
    .string()
    .regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Numéro de téléphone invalide (format français attendu)')
    .optional()
    .or(z.literal('')),

  age: z
    .number()
    .int("L'âge doit être un nombre entier")
    .min(13, "L'âge minimum est de 13 ans")
    .max(120, "L'âge maximum est de 120 ans")
    .optional(),

  sex: z.enum(['Homme', 'Femme']).optional(),

  coachId: z.string().optional(),

  affiliationCode: z
    .string()
    .regex(/^\d{6}$/, "Le code d'affiliation doit contenir 6 chiffres")
    .optional(),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

/**
 * Schéma de validation pour la connexion
 */
export const SignInSchema = z.object({
  email: z.string().email('Adresse email invalide').toLowerCase().trim(),

  password: z.string().min(1, 'Le mot de passe est requis'),
});

export type SignInInput = z.infer<typeof SignInSchema>;

/**
 * Schéma de validation pour la mise à jour du profil client
 */
export const UpdateClientProfileSchema = z.object({
  firstName: z.string().min(2).max(50).trim().optional(),
  lastName: z.string().min(2).max(50).trim().optional(),
  phone: z
    .string()
    .regex(/^(\+33|0)[1-9](\d{2}){4}$/)
    .optional()
    .or(z.literal('')),
  age: z.number().int().min(13).max(120).optional(),
  sex: z.enum(['Homme', 'Femme']).optional(),
  address: z.string().max(200).optional(),
  objective: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  height: z.number().positive().max(300).optional(),
  weight: z.number().positive().max(500).optional(),
  energyExpenditureLevel: z
    .enum(['Sédentaire', 'Légèrement actif', 'Actif', 'Très actif'])
    .optional(),
});

export type UpdateClientProfileInput = z.infer<typeof UpdateClientProfileSchema>;

// ---- VALIDATION DES EXERCICES ----

/**
 * Schéma de validation pour la création d'un exercice
 */
export const CreateExerciseSchema = z.object({
  name: z
    .string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),

  category: z.enum(['Musculation', 'Mobilité', 'Échauffement'], {
    message: 'La catégorie doit être Musculation, Mobilité ou Échauffement',
  }),

  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .trim(),

  videoUrl: z.string().url('URL de vidéo invalide').optional().or(z.literal('')),

  illustrationUrl: z.string().url("URL d'illustration invalide").optional().or(z.literal('')),

  equipment: z.string().max(100).optional(),

  muscleGroups: z.array(z.string().max(50)).optional(),

  alternativeIds: z.array(z.string()).optional(),

  coachId: z.string().optional(),
});

export type CreateExerciseInput = z.infer<typeof CreateExerciseSchema>;

// ---- VALIDATION DES PROGRAMMES ----

/**
 * Schéma de validation pour la création d'un programme d'entraînement
 */
export const CreateProgramSchema = z.object({
  name: z
    .string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),

  objective: z
    .string()
    .min(10, "L'objectif doit contenir au moins 10 caractères")
    .max(500, "L'objectif ne peut pas dépasser 500 caractères")
    .trim(),

  weekCount: z
    .number()
    .int('Le nombre de semaines doit être un entier')
    .min(1, 'Le programme doit durer au moins 1 semaine')
    .max(52, 'Le programme ne peut pas dépasser 52 semaines'),

  clientId: z.string().optional(),
});

export type CreateProgramInput = z.infer<typeof CreateProgramSchema>;

// ---- VALIDATION DES PLANS NUTRITIONNELS ----

/**
 * Schéma de validation pour la création d'un plan nutritionnel
 */
export const CreateNutritionPlanSchema = z.object({
  name: z
    .string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),

  objective: z
    .string()
    .min(10, "L'objectif doit contenir au moins 10 caractères")
    .max(500, "L'objectif ne peut pas dépasser 500 caractères")
    .trim(),

  weekCount: z
    .number()
    .int('Le nombre de semaines doit être un entier')
    .min(1, 'Le plan doit durer au moins 1 semaine')
    .max(52, 'Le plan ne peut pas dépasser 52 semaines'),

  clientId: z.string().optional(),
  coachId: z.string().optional(),
});

export type CreateNutritionPlanInput = z.infer<typeof CreateNutritionPlanSchema>;

// ---- VALIDATION DES MESSAGES ----

/**
 * Schéma de validation pour l'envoi d'un message
 */
export const SendMessageSchema = z.object({
  text: z
    .string()
    .min(1, 'Le message ne peut pas être vide')
    .max(2000, 'Le message ne peut pas dépasser 2000 caractères')
    .trim(),

  clientId: z.string().min(1, "L'ID du client est requis"),

  isVoice: z.boolean().default(false),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

// ---- VALIDATION DES ALIMENTS ----

/**
 * Schéma de validation pour l'ajout d'un aliment
 */
export const AddFoodItemSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),

  category: z
    .string()
    .min(2, 'La catégorie doit contenir au moins 2 caractères')
    .max(50, 'La catégorie ne peut pas dépasser 50 caractères')
    .trim(),

  calories: z
    .number()
    .nonnegative('Les calories ne peuvent pas être négatives')
    .max(10000, 'Les calories ne peuvent pas dépasser 10000 pour 100g'),

  protein: z
    .number()
    .nonnegative('Les protéines ne peuvent pas être négatives')
    .max(100, 'Les protéines ne peuvent pas dépasser 100g pour 100g'),

  carbs: z
    .number()
    .nonnegative('Les glucides ne peuvent pas être négatifs')
    .max(100, 'Les glucides ne peuvent pas dépasser 100g pour 100g'),

  fat: z
    .number()
    .nonnegative('Les lipides ne peuvent pas être négatifs')
    .max(100, 'Les lipides ne peuvent pas dépasser 100g pour 100g'),
});

export type AddFoodItemInput = z.infer<typeof AddFoodItemSchema>;

// ---- VALIDATION DES MENSURATIONS ----

/**
 * Schéma de validation pour les mensurations corporelles
 */
export const MeasurementSchema = z.object({
  neck: z.number().positive().max(100).optional(),
  chest: z.number().positive().max(200).optional(),
  l_bicep: z.number().positive().max(100).optional(),
  r_bicep: z.number().positive().max(100).optional(),
  waist: z.number().positive().max(200).optional(),
  hips: z.number().positive().max(200).optional(),
  l_thigh: z.number().positive().max(150).optional(),
  r_thigh: z.number().positive().max(150).optional(),
});

export type MeasurementInput = z.infer<typeof MeasurementSchema>;

// ---- VALIDATION DES LOGS DE NUTRITION ----

/**
 * Schéma de validation pour l'ajout d'une entrée de journal nutritionnel
 */
export const NutritionLogEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD attendu)'),
  weight: z.number().positive().max(500).nullable(),
  calories: z.number().nonnegative().max(10000),
  macros: z.object({
    protein: z.number().nonnegative().max(1000),
    carbs: z.number().nonnegative().max(2000),
    fat: z.number().nonnegative().max(500),
  }),
  measurements: MeasurementSchema.optional(),
});

export type NutritionLogEntryInput = z.infer<typeof NutritionLogEntrySchema>;

// ---- UTILITAIRES DE VALIDATION ----

/**
 * Valide des données avec un schéma Zod et retourne les erreurs formatées
 */
export const validateWithSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  if (!result.error || !result.error.issues) {
    return { success: false, errors: ['Erreur de validation inconnue'] };
  }

  const errors = result.error.issues.map((err) => {
    const path = err.path.join('.');
    return `${path ? path + ': ' : ''}${err.message}`;
  });

  return { success: false, errors };
};

/**
 * Sanitize une chaîne de caractères pour éviter les injections XSS
 */
export const sanitizeString = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Valide et sanitize un email
 */
export const validateAndSanitizeEmail = (email: string): string | null => {
  const result = z.string().email().safeParse(email.toLowerCase().trim());
  return result.success ? result.data : null;
};
