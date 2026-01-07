import { supabase } from './supabase';

export interface ClientGeneralInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dob?: string;
  sex?: 'male' | 'female';
  height?: number;
  weight?: number;
  energyExpenditureLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
}

/**
 * Récupère les informations générales d'un client
 */
export const getClientGeneralInfo = async (clientId: string): Promise<ClientGeneralInfo | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('first_name, last_name, email, phone, dob, sex, height, weight, energy_expenditure_level')
      .eq('id', clientId)
      .single();

    if (error) {
      console.error('Error fetching client general info:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      email: data.email || '',
      phone: data.phone || '',
      dob: data.dob || '',
      sex: data.sex || undefined,
      height: data.height || undefined,
      weight: data.weight || undefined,
      energyExpenditureLevel: data.energy_expenditure_level || undefined,
    };
  } catch (error) {
    console.error('Error in getClientGeneralInfo:', error);
    return null;
  }
};

/**
 * Met à jour les informations générales d'un client
 */
export const updateClientGeneralInfo = async (
  clientId: string,
  info: ClientGeneralInfo
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('clients')
      .update({
        first_name: info.firstName,
        last_name: info.lastName,
        email: info.email,
        phone: info.phone || null,
        dob: info.dob || null,
        sex: info.sex || null,
        height: info.height || null,
        weight: info.weight || null,
        energy_expenditure_level: info.energyExpenditureLevel || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (error) {
      console.error('Error updating client general info:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateClientGeneralInfo:', error);
    throw error;
  }
};
