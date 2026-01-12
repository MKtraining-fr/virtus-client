import * as Papa from 'papaparse';
import { supabase } from './supabase';
import { logger } from '../utils/logger';
import { Client, Exercise, FoodItem, Product, Partner, IntensificationTechnique } from '../types';

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
              status: (row.status?.toLowerCase() || 'prospect') as
                | 'active'
                | 'archived'
                | 'prospect',
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
              const { error: insertError } = await supabase.from('clients').insert(userData as any);

              if (insertError) {
                throw new Error(`Erreur insertion profil: ${insertError.message}`);
              }

              logger.info('Utilisateur actif créé avec compte Auth', {
                email: userData.email,
                id: userData.id,
              });
            } else {
              // Pour les prospects, pas de compte Auth, juste un profil
              const { error: insertError } = await supabase.from('clients').insert(userData as any);

              if (insertError) {
                throw new Error(`Erreur insertion prospect: ${insertError.message}`);
              }

              logger.info('Prospect créé sans compte Auth', {
                email: userData.email,
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
              data: row,
            });
          }
        }

        logger.info('Import utilisateurs terminé', {
          success: result.success,
          errors: result.errors.length,
          total: result.total,
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
export const importExercisesFromCSV = async (
  file: File,
  coachId: string
): Promise<ImportResult> => {
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

            // Vérifier si l'exercice existe déjà (par nom ET équipement)
            // Cela permet d'avoir plusieurs exercices avec le même nom mais des équipements différents
            const equipment = row.equipment?.trim() || null;
            
            let query = supabase
              .from('exercises')
              .select('id')
              .eq('name', row.name.trim());
            
            // Ajouter le filtre d'équipement s'il existe
            if (equipment) {
              query = query.eq('equipment', equipment);
            } else {
              query = query.is('equipment', null);
            }
            
            const { data: existing } = await query.single();

            if (existing) {
              throw new Error(`Exercice déjà existant: ${row.name}${equipment ? ` (${equipment})` : ''}`);
            }

            // Préparer les données (format Supabase snake_case)
            // Note: coach_id n'existe pas dans la table exercises, les exercices sont globaux
            const exerciseData = {
              name: row.name.trim(),
              category: row.category.trim(),
              description: row.description?.trim() || null,
              video_url: row.videoUrl?.trim() || null,
              image_url: row.illustrationUrl?.trim() || null,
              equipment: row.equipment?.trim() || null,
              muscle_group: row.muscleGroups
                ? row.muscleGroups
                    .split('|')
                    .map((m: string) => m.trim())
                    .join('|')
                : null,
              secondary_muscle_groups: row.secondaryMuscleGroups
                ? row.secondaryMuscleGroups.split('|').map((m: string) => m.trim())
                : null,
              difficulty: row.difficulty?.trim() || null,
            };

            // Insérer dans Supabase
            const { error } = await supabase.from('exercises').insert(exerciseData as any);

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
              error: error.message,
            });
          }
        }

        logger.info('Import exercices terminé', {
          success: result.success,
          errors: result.errors.length,
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
 * Convertit une valeur numérique française (virgule) en nombre
 * Gère les cas spéciaux: "-", "< 0,2", valeurs vides, "traces"
 */
function parseNumericValue(value: string | undefined | null): number | null {
  if (!value || value === '-' || value.toLowerCase() === 'traces') {
    return null;
  }
  
  // Gérer les valeurs "< X" (traces)
  if (value.startsWith('<') || value.startsWith('< ')) {
    return 0;
  }
  
  // Remplacer la virgule par un point pour le parsing
  const normalized = value.replace(',', '.').trim();
  const parsed = parseFloat(normalized);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Détecte si le fichier est au format Ciqual officiel
 * en vérifiant la présence des colonnes caractéristiques
 */
function isCiqualFormat(headers: string[]): boolean {
  const ciqualHeaders = ['alim_code', 'alim_nom_fr', 'alim_grp_nom_fr'];
  return ciqualHeaders.every(h => headers.some(header => header.includes(h)));
}

/**
 * Import des aliments depuis un fichier CSV
 * Supporte deux formats:
 * 1. Format Ciqual officiel (séparateur ;, colonnes alim_*)
 * 2. Format simplifié Virtus (séparateur ,, colonnes name, category, etc.)
 */
export const importFoodItemsFromCSV = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const result: ImportResult = { success: 0, errors: [], total: 0 };

    // Première passe pour détecter le format
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 1, // Lire seulement la première ligne pour détecter le format
      complete: (previewResults) => {
        const headers = Object.keys(previewResults.data[0] || {});
        const isCiqual = isCiqualFormat(headers);
        
        logger.info('Format détecté', { 
          isCiqual, 
          headers: headers.slice(0, 10),
          delimiter: isCiqual ? ';' : ','
        });

        // Deuxième passe avec le bon délimiteur
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          delimiter: isCiqual ? ';' : ',',
          complete: async (results) => {
            result.total = results.data.length;
            logger.info('Début import aliments', { 
              total: result.total,
              format: isCiqual ? 'Ciqual' : 'Virtus'
            });

            // Import par lots pour de meilleures performances
            const BATCH_SIZE = 100;
            const batches: any[][] = [];
            
            for (let i = 0; i < results.data.length; i += BATCH_SIZE) {
              batches.push(results.data.slice(i, i + BATCH_SIZE));
            }

            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
              const batch = batches[batchIndex];
              const foodDataBatch: any[] = [];
              
              for (let i = 0; i < batch.length; i++) {
                const row = batch[i] as any;
                const rowNumber = batchIndex * BATCH_SIZE + i + 2;

                try {
                  let foodData: any;

                  if (isCiqual) {
                    // Format Ciqual officiel
                    const name = row['alim_nom_fr']?.trim();
                    if (!name) {
                      throw new Error('Nom de l\'aliment manquant (alim_nom_fr)');
                    }

                    // Trouver les colonnes par leur contenu (les noms contiennent des retours à la ligne)
                    const findColumn = (keyword: string): string | undefined => {
                      return Object.keys(row).find(k => 
                        k.toLowerCase().replace(/\n/g, ' ').includes(keyword.toLowerCase())
                      );
                    };

                    const kcalCol = findColumn('kcal');
                    const proteinCol = findColumn('protéines, n x 6.25') || findColumn('protéines');
                    const carbsCol = findColumn('glucides');
                    const fatCol = findColumn('lipides');
                    const sugarCol = findColumn('sucres');
                    const fiberCol = findColumn('fibres');
                    const saltCol = findColumn('sel chlorure');

                    foodData = {
                      name: name,
                      ciqual_code: row['alim_code']?.toString().trim() || null,
                      category: row['alim_grp_nom_fr']?.trim() || 'Non classé',
                      subcategory: row['alim_ssgrp_nom_fr']?.trim() || null,
                      subsubcategory: row['alim_ssssgrp_nom_fr']?.trim() || null,
                      calories: kcalCol ? parseNumericValue(row[kcalCol]) : null,
                      protein: proteinCol ? parseNumericValue(row[proteinCol]) : null,
                      carbs: carbsCol ? parseNumericValue(row[carbsCol]) : null,
                      fat: fatCol ? parseNumericValue(row[fatCol]) : null,
                      sugar: sugarCol ? parseNumericValue(row[sugarCol]) : null,
                      fiber: fiberCol ? parseNumericValue(row[fiberCol]) : null,
                      salt: saltCol ? parseNumericValue(row[saltCol]) : null,
                      source: 'ciqual',
                      is_public: true,
                    };
                  } else {
                    // Format simplifié Virtus
                    if (!row.name || !row.category) {
                      throw new Error('Champs requis manquants (name, category)');
                    }

                    foodData = {
                      name: row.name.trim(),
                      category: row.category.trim(),
                      subcategory: row.subcategory?.trim() || null,
                      ciqual_code: row.ciqual_code?.trim() || null,
                      calories: parseNumericValue(row.calories),
                      protein: parseNumericValue(row.protein),
                      carbs: parseNumericValue(row.carbs),
                      fat: parseNumericValue(row.fat),
                      sugar: parseNumericValue(row.sugar),
                      fiber: parseNumericValue(row.fiber),
                      salt: parseNumericValue(row.salt),
                      barcode: row.barcode?.trim() || null,
                      brand: row.brand?.trim() || null,
                      nutri_score: row.nutri_score?.trim()?.toUpperCase() || null,
                      source: row.source?.trim() || 'manual',
                      is_public: true,
                    };
                  }

                  foodDataBatch.push({ data: foodData, rowNumber });
                } catch (error: any) {
                  result.errors.push({
                    row: rowNumber,
                    error: error.message,
                    data: row,
                  });
                }
              }

              // Insérer le lot dans Supabase
              if (foodDataBatch.length > 0) {
                const dataToInsert = foodDataBatch.map(item => item.data);
                
                const { error } = await supabase
                  .from('food_items')
                  .insert(dataToInsert);

                if (error) {
                  // En cas d'erreur de lot, essayer un par un pour identifier les problèmes
                  logger.warn('Erreur insertion lot, tentative individuelle', { 
                    error: error.message,
                    batchSize: dataToInsert.length 
                  });
                  
                  for (const item of foodDataBatch) {
                    const { error: singleError } = await supabase
                      .from('food_items')
                      .insert(item.data);
                    
                    if (singleError) {
                      result.errors.push({
                        row: item.rowNumber,
                        error: singleError.message,
                        data: item.data,
                      });
                    } else {
                      result.success++;
                    }
                  }
                } else {
                  result.success += foodDataBatch.length;
                }
              }

              // Log de progression
              if ((batchIndex + 1) % 10 === 0 || batchIndex === batches.length - 1) {
                logger.info('Progression import', {
                  processed: Math.min((batchIndex + 1) * BATCH_SIZE, result.total),
                  total: result.total,
                  success: result.success,
                  errors: result.errors.length,
                });
              }
            }

            logger.info('Import aliments terminé', {
              success: result.success,
              errors: result.errors.length,
              total: result.total,
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
      },
      error: (error) => {
        logger.error('Erreur détection format CSV', { error: error.message });
        resolve({
          success: 0,
          errors: [{ row: 0, error: `Erreur détection format: ${error.message}` }],
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
