import { supabase } from './supabase';

export interface NutritionHabits {
  dietType?: string;
  mealsPerDay?: string;
  hydration?: number;
  juiceSoda?: number;
  teaCoffee?: number;
  alcohol?: number;
  digestiveIssues?: string;
  generalHabits?: string;
}

/**
 * Récupère les habitudes alimentaires d'un client
 */
export const getClientNutritionHabits = async (clientId: string): Promise<NutritionHabits | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('nutrition')
      .eq('id', clientId)
      .single();

    if (error) {
      console.error('Error fetching nutrition habits:', error);
      throw error;
    }

    if (!data || !data.nutrition) {
      return null;
    }

    const nutrition = data.nutrition as any;
    
    return {
      dietType: nutrition.dietType || '',
      mealsPerDay: nutrition.mealsPerDay || '',
      hydration: nutrition.hydration || undefined,
      juiceSoda: nutrition.juiceSoda || undefined,
      teaCoffee: nutrition.teaCoffee || undefined,
      alcohol: nutrition.alcohol || undefined,
      digestiveIssues: nutrition.digestiveIssues || '',
      generalHabits: nutrition.generalHabits || '',
    };
  } catch (error) {
    console.error('Error in getClientNutritionHabits:', error);
    return null;
  }
};

/**
 * Met à jour les habitudes alimentaires d'un client
 */
export const updateClientNutritionHabits = async (
  clientId: string,
  habits: NutritionHabits
): Promise<void> => {
  try {
    // Récupérer les données nutrition actuelles
    const { data: currentData, error: fetchError } = await supabase
      .from('clients')
      .select('nutrition')
      .eq('id', clientId)
      .single();

    if (fetchError) {
      console.error('Error fetching current nutrition data:', fetchError);
      throw fetchError;
    }

    const currentNutrition = (currentData?.nutrition as any) || {};

    // Fusionner avec les nouvelles données
    const updatedNutrition = {
      ...currentNutrition,
      dietType: habits.dietType || currentNutrition.dietType || '',
      mealsPerDay: habits.mealsPerDay || currentNutrition.mealsPerDay || '',
      hydration: habits.hydration !== undefined ? habits.hydration : currentNutrition.hydration,
      juiceSoda: habits.juiceSoda !== undefined ? habits.juiceSoda : currentNutrition.juiceSoda,
      teaCoffee: habits.teaCoffee !== undefined ? habits.teaCoffee : currentNutrition.teaCoffee,
      alcohol: habits.alcohol !== undefined ? habits.alcohol : currentNutrition.alcohol,
      digestiveIssues: habits.digestiveIssues || currentNutrition.digestiveIssues || '',
      generalHabits: habits.generalHabits || currentNutrition.generalHabits || '',
    };

    // Mettre à jour dans la base de données
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        nutrition: updatedNutrition,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('Error updating nutrition habits:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Error in updateClientNutritionHabits:', error);
    throw error;
  }
};
