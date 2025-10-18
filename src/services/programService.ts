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
export const getProgramsByCoachId = async (coachId: string): Promise<Program[]> => {
  try {
    // L'authentification de l'utilisateur est gérée par l'appelant qui fournit le coachId.
    // Pas besoin de vérifier l'authentification ici, car coachId est passé en argument.
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching programs by coach ID:', error);
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



// Types pour les sessions
export interface Session {
  id: string;
  program_id: string;
  name: string;
  week_number: number;
  session_order: number;
  created_at: string;
  updated_at: string;
}

export interface SessionInput {
  program_id: string;
  name: string;
  week_number: number;
  session_order: number;
}

// Créer une nouvelle session
export const createSession = async (sessionData: SessionInput): Promise<Session | null> => {
  try {
    const { data, error } = await supabase
      .from("sessions")
      .insert(sessionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating session:", error);
    return null;
  }
};

// Récupérer les sessions par ID de programme
export const getSessionsByProgramId = async (programId: string): Promise<Session[]> => {
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("program_id", programId)
      .order("week_number", { ascending: true })
      .order("session_order", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching sessions by program ID:", error);
    return [];
  }
};

// Mettre à jour une session
export const updateSession = async (
  sessionId: string,
  updates: Partial<SessionInput>
): Promise<Session | null> => {
  try {
    const { data, error } = await supabase
      .from("sessions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating session:", error);
    return null;
  }
};

// Supprimer une session
export const deleteSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting session:", error);
    return false;
  }
};

// Types pour les exercices de session
export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  order: number;
    sets: number;
    details?: { 
        reps: string; 
        load: string; 
        tempo: string; 
        rest: string; 
    }[];
  reps: number;
  rpe?: number;
  tempo?: string;
  rest?: number;
    notes?: string;
    alternatives?: { id: string, name: string, illustrationUrl: string }[];
  created_at: string;
  updated_at: string;
}

export interface SessionExerciseInput {
  session_id: string;
  exercise_id: string;
  order: number;
  sets: number;
  reps: number;
  rpe?: number;
  tempo?: string;
  rest?: number;
  notes?: string;
}

// Créer un exercice de session
export const createSessionExercise = async (
  exerciseData: SessionExerciseInput
): Promise<SessionExercise | null> => {
  try {
    const { data, error } = await supabase
      .from("session_exercises")
      .insert(exerciseData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating session exercise:", error);
    return null;
  }
};

// Récupérer les exercices d'une session
export const getSessionExercisesBySessionId = async (
  sessionId: string
): Promise<SessionExercise[]> => {
  try {
    const { data, error } = await supabase
      .from("session_exercises")
      .select("*")
      .eq("session_id", sessionId)
      .order("order", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching session exercises:", error);
    return [];
  }
};

// Mettre à jour un exercice de session
export const updateSessionExercise = async (
  sessionExerciseId: string,
  updates: Partial<SessionExerciseInput>
): Promise<SessionExercise | null> => {
  try {
    const { data, error } = await supabase
      .from("session_exercises")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionExerciseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating session exercise:", error);
    return null;
  }
};

// Supprimer un exercice de session
export const deleteSessionExercise = async (
  sessionExerciseId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("session_exercises")
      .delete()
      .eq("id", sessionExerciseId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting session exercise:", error);
    return false;
  }
};

// Types pour les exercices de la base de données
export interface ExerciseDB {
  id: string;
  name: string;
  illustration_url?: string;
  coach_id?: string;
  created_at: string;
}

// Récupérer les détails des exercices par leurs IDs
export const getExercisesByIds = async (exerciseIds: string[]): Promise<ExerciseDB[]> => {
  try {
    const { data, error } = await supabase
      .from("exercises")
      .select("id, name, illustration_url")
      .in("id", exerciseIds);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching exercises by IDs:", error);
    return [];
  }
};
