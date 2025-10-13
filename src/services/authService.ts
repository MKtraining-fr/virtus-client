import { supabase } from './supabase';
import type { Client } from '../types';
import { SignInSchema, SignUpSchema } from '../validation/schemas';
import { logger } from '../utils/logger';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'admin' | 'coach' | 'client';
  affiliationCode?: string;
  coachId?: string;
}

/**
 * Inscription d'un nouvel utilisateur
 */
export const signUp = async (userData: SignUpData): Promise<{ user: any; error: any }> => {
  // Valider les données
  const validation = SignUpSchema.safeParse(userData);
  if (!validation.success) {
    const errors = validation.error.errors;
    if (errors && errors.length > 0) {
      // Regrouper les erreurs de mot de passe
      const passwordErrors = errors.filter(e => e.path[0] === 'password');
      if (passwordErrors.length > 0) {
        const requirements = [
          '• Au moins 8 caractères',
          '• Au moins une majuscule',
          '• Au moins une minuscule',
          '• Au moins un chiffre',
          '• Au moins un caractère spécial'
        ];
        throw new Error('Le mot de passe ne respecte pas les exigences:\n' + requirements.join('\n'));
      }
      throw new Error(errors[0].message);
    }
    throw new Error('Données invalides');
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
        affiliation_code: userData.affiliationCode || null,
        coach_id: userData.coachId || null,
      },
    },
  });

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    logger.error("Échec de la création du compte, pas d'utilisateur retourné", { email: userData.email });
    throw new Error("Échec de la création du compte");
  }

  logger.info("Utilisateur Supabase créé avec succès, en attente de confirmation par e-mail", { userId: authData.user.id, email: userData.email });

  // Créer le profil client dans la base de données
  const clientProfile = {
    id: authData.user.id,
    email: userData.email,
    first_name: userData.firstName,
    last_name: userData.lastName,
    phone: userData.phone || '',
    role: userData.role || 'client',
    affiliation_code: userData.affiliationCode || null,
    coach_id: userData.coachId || null,
  };

  const { error: profileError } = await supabase
    .from('clients')
    .insert([clientProfile]);

  if (profileError) {
    logger.error("Erreur lors de la création du profil client:", { error: profileError, clientProfile });
    throw profileError; // Bloquer l'inscription si le profil échoue
  } else {
    logger.info("Profil client créé avec succès dans la base de données", { userId: clientProfile.id, email: clientProfile.email });
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
    redirectTo: `${window.location.origin}/set-password`,
  });

  if (error) {
    logger.error("Échec de l'envoi de l'e-mail de réinitialisation de mot de passe", { error, email });
    throw error;
  }
  logger.info("E-mail de réinitialisation de mot de passe envoyé avec succès", { email });
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

