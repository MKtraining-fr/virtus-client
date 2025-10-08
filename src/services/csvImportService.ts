import * as Papa from 'papaparse';
import { supabase } from './supabase';
import { logger } from '../utils/logger';
import { 
  Client, 
  Exercise, 
  FoodItem, 
  Product, 
  Partner, 
  IntensificationTechnique 
} from '../types';

export interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  total: number;
}

/**
 * Import des utilisateurs depuis un fichier CSV
 * Crée des comptes Auth Supabase ET des entrées dans la table clients
 */
export const importUsersFromCSV = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const result: ImportResult = { success: 0, errors: [], total: 0 };

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Garder tout en string pour validation manuelle
      complete: async (results) => {
        result.total = results.data.length;
        logger.info('Début import utilisateurs', { total: result.total });

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as any;
          const rowNumber = i + 2; // +2 car ligne 1 = en-têtes, index commence à 0

          try {
            // Validation des champs requis
            if (!row.firstName || !row.lastName || !row.email) {
              throw new Error('Champs requis manquants (firstName, lastName, email)');
            }

            // Validation de l'email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row.email)) {
              throw new Error('Format email invalide');
            }

            // Vérifier si l'utilisateur existe déjà
            const { data: existingUser } = await supabase
              .from('clients')
              .select('id, email')
              .eq('email', row.email.toLowerCase())
              .single();

            if (existingUser) {
              throw new Error(`Email déjà existant: ${row.email}`);
            }

            // Préparer les données utilisateur
            const userData: Partial<Client> = {
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              email: row.email.toLowerCase().trim(),
              phone: row.phone?.trim() || '',
              role: (row.role?.toLowerCase() || 'client') as 'admin' | 'coach' | 'client',
              status: (row.status?.toLowerCase() || 'prospect') as 'active' | 'archived' | 'prospect',
              sex: row.sex as 'Homme' | 'Femme',
              dob: row.dob || undefined,
              height: row.height ? Number(row.height) : undefined,
              weight: row.weight ? Number(row.weight) : undefined,
              objective: row.objective || '',
              notes: row.notes || '',
              coachId: row.coachId || undefined,
              affiliationCode: row.affiliationCode || undefined,
              registrationDate: new Date().toISOString().split('T')[0],
              medicalInfo: {
                history: row.medicalHistory || '',
                allergies: row.allergies || '',
              },
              nutrition: {
                measurements: {},
                weightHistory: [],
                calorieHistory: [],
                macros: { protein: 0, carbs: 0, fat: 0 },
                historyLog: [],
                foodJournal: {},
                foodAversions: row.foodAversions || '',
                generalHabits: row.generalHabits || '',
              },
            };

            // Si le statut est "active", créer un compte Auth
            if (userData.status === 'active') {
              // Générer un mot de passe temporaire
              const tempPassword = row.password || generateSecurePassword();

              // Créer le compte Auth
              const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: tempPassword,
                options: {
                  data: {
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    phone: userData.phone,
                    role: userData.role,
                  },
                },
              });

              if (authError) {
                throw new Error(`Erreur création compte Auth: ${authError.message}`);
              }

              // Utiliser l'ID Auth comme ID du profil
              userData.id = authData.user!.id;

              // Insérer le profil dans la table clients
              const { error: insertError } = await supabase
                .from('clients')
                .insert(userData as any);

              if (insertError) {
                throw new Error(`Erreur insertion profil: ${insertError.message}`);
              }

              logger.info('Utilisateur actif créé avec compte Auth', { 
                email: userData.email, 
                id: userData.id 
              });
            } else {
              // Pour les prospects, pas de compte Auth, juste un profil
              const { error: insertError } = await supabase
                .from('clients')
                .insert(userData as any);

              if (insertError) {
                throw new Error(`Erreur insertion prospect: ${insertError.message}`);
              }

              logger.info('Prospect créé sans compte Auth', { 
                email: userData.email 
              });
            }

            result.success++;
          } catch (error: any) {
            result.errors.push({
              row: rowNumber,
              error: error.message,
              data: row,
            });
            logger.error('Erreur import utilisateur', { 
              row: rowNumber, 
              error: error.message,
              data: row 
            });
          }
        }

        logger.info('Import utilisateurs terminé', { 
          success: result.success, 
          errors: result.errors.length,
          total: result.total 
        });
        resolve(result);
      },
      error: (error) => {
        logger.error('Erreur parsing CSV utilisateurs', { error: error.message });
        resolve({
          success: 0,
          errors: [{ row: 0, error: `Erreur parsing CSV: ${error.message}` }],
          total: 0,
        });
      },
    });
  });
};

/**
 * Import des exercices depuis un fichier CSV
 */
export const importExercisesFromCSV = async (file: File, coachId: string): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const result: ImportResult = { success: 0, errors: [], total: 0 };

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        result.total = results.data.length;
        logger.info('Début import exercices', { total: result.total });

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as any;
          const rowNumber = i + 2;

          try {
            // Validation des champs requis
            if (!row.name || !row.category) {
              throw new Error('Champs requis manquants (name, category)');
            }

            // Vérifier si l'exercice existe déjà
            const { data: existing } = await supabase
              .from('exercises')
              .select('id')
              .eq('name', row.name.trim())
              .eq('coach_id', coachId)
              .single();

            if (existing) {
              throw new Error(`Exercice déjà existant: ${row.name}`);
            }

            // Préparer les données (format Supabase snake_case)
            const exerciseData = {
              name: row.name.trim(),
              category: row.category.trim(),
              description: row.description?.trim() || null,
              video_url: row.videoUrl?.trim() || null,
              image_url: row.illustrationUrl?.trim() || null,
              equipment: row.equipment?.trim() || null,
              muscle_group: row.muscleGroups ? row.muscleGroups.split('|').map((m: string) => m.trim()).join('|') : null,
              difficulty: row.difficulty?.trim() || null,
              coach_id: coachId,
            };

            // Insérer dans Supabase
            const { error } = await supabase
              .from('exercises')
              .insert(exerciseData as any);

            if (error) {
              throw new Error(`Erreur insertion: ${error.message}`);
            }

            result.success++;
          } catch (error: any) {
            result.errors.push({
              row: rowNumber,
              error: error.message,
              data: row,
            });
            logger.error('Erreur import exercice', { 
              row: rowNumber, 
              error: error.message 
            });
          }
        }

        logger.info('Import exercices terminé', { 
          success: result.success, 
          errors: result.errors.length 
        });
        resolve(result);
      },
      error: (error) => {
        logger.error('Erreur parsing CSV exercices', { error: error.message });
        resolve({
          success: 0,
          errors: [{ row: 0, error: `Erreur parsing CSV: ${error.message}` }],
          total: 0,
        });
      },
    });
  });
};

/**
 * Import des aliments (Ciqual) depuis un fichier CSV
 */
export const importFoodItemsFromCSV = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const result: ImportResult = { success: 0, errors: [], total: 0 };

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        result.total = results.data.length;
        logger.info('Début import aliments', { total: result.total });

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as any;
          const rowNumber = i + 2;

          try {
            // Validation des champs requis
            if (!row.name || !row.category) {
              throw new Error('Champs requis manquants (name, category)');
            }

            // Vérifier si l'aliment existe déjà
            const { data: existing } = await supabase
              .from('food_items')
              .select('name')
              .eq('name', row.name.trim())
              .single();

            if (existing) {
              throw new Error(`Aliment déjà existant: ${row.name}`);
            }

            // Préparer les données
            const foodData = {
              name: row.name.trim(),
              category: row.category.trim(),
              calories: parseFloat(row.calories) || 0,
              protein: parseFloat(row.protein) || 0,
              carbs: parseFloat(row.carbs) || 0,
              fat: parseFloat(row.fat) || 0,
            };

            // Insérer dans Supabase
            const { error } = await supabase
              .from('food_items')
              .insert(foodData as any);

            if (error) {
              throw new Error(`Erreur insertion: ${error.message}`);
            }

            result.success++;
          } catch (error: any) {
            result.errors.push({
              row: rowNumber,
              error: error.message,
              data: row,
            });
            logger.error('Erreur import aliment', { 
              row: rowNumber, 
              error: error.message 
            });
          }
        }

        logger.info('Import aliments terminé', { 
          success: result.success, 
          errors: result.errors.length 
        });
        resolve(result);
      },
      error: (error) => {
        logger.error('Erreur parsing CSV aliments', { error: error.message });
        resolve({
          success: 0,
          errors: [{ row: 0, error: `Erreur parsing CSV: ${error.message}` }],
          total: 0,
        });
      },
    });
  });
};

/**
 * Génère un mot de passe sécurisé aléatoire
 */
function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
