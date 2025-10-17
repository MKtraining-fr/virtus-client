import { supabase } from './supabase';

// Types pour les programmes (matrices)
export interface Program {
  id: string;
  coach_id: string;
  name: string;
  objective?: string;
  week_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramInput {
  name: string;
  objective?: string;
  week_count: number;
}

// Créer un nouveau programme (matrice)
export const createProgram = async (programData: ProgramInput): Promise<Program | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('programs')
      .insert({
        coach_id: user.id,
        ...programData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating program:', error);
    return null;
  }
};

// Récupérer tous les programmes d'un coach
export const getCoachPrograms = async (): Promise<Program[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching coach programs:', error);
    return [];
  }
};

// Récupérer un programme par ID
export const getProgramById = async (programId: string): Promise<Program | null> => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching program:', error);
    return null;
  }
};

// Mettre à jour un programme
export const updateProgram = async (
  programId: string,
  updates: Partial<ProgramInput>
): Promise<Program | null> => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', programId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating program:', error);
    return null;
  }
};

// Supprimer un programme
export const deleteProgram = async (programId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting program:', error);
    return false;
  }
};

