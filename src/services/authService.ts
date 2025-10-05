import { supabase } from './supabase';
import type { Client } from '../types';
import { SignInSchema, SignUpSchema } from '../validation/schemas';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'admin' | 'coach' | 'client';
}

/**
 * Inscription d'un nouvel utilisateur
 */
export const signUp = async (userData: SignUpData): Promise<{ user: any; error: any }> => {
  // Valider les données
  const validation = SignUpSchema.safeParse(userData);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    throw new Error(firstError.message);
  }

  // Créer l'utilisateur dans Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone || '',
        role: userData.role || 'client',
      },
    },
  });

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    throw new Error('Échec de la création du compte');
  }

  // Créer le profil client dans la base de données
  const clientProfile: Partial<Client> = {
    id: authData.user.id,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone || '',
    role: userData.role || 'client',
    createdAt: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from('clients')
    .insert([clientProfile]);

  if (profileError) {
    console.error('Erreur lors de la création du profil:', profileError);
    // Ne pas bloquer l'inscription si le profil échoue
  }

  return { user: authData.user, error: null };
};

/**
 * Connexion d'un utilisateur
 */
export const signIn = async (email: string, password: string): Promise<{ user: any; error: any }> => {
  // Valider les données
  const validation = SignInSchema.safeParse({ email, password });
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    throw new Error(firstError.message);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return { user: data.user, error: null };
};

/**
 * Déconnexion de l'utilisateur
 */
export const signOutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

/**
 * Écouter les changements d'authentification
 */
export const onAuthStateChange = (callback: (user: any) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });

  return () => subscription.unsubscribe();
};

/**
 * Récupérer le profil client depuis la base de données
 */
export const getClientProfile = async (userId: string): Promise<Client | null> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return null;
  }

  return data as Client;
};

/**
 * Réinitialiser le mot de passe
 */
export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw error;
  }
};

/**
 * Mettre à jour le mot de passe
 */
export const updatePassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }
};
