
import { create } from 'zustand';
import { User, SignUpData, Client } from '../types';
import { SignUpSchema, SignInSchema } from '../validation/schemas';
import { logger } from '../utils/logger';
import { supabase } from '../services/supabase';
import { mapSupabaseClientToClient } from '../services/typeMappers';

// Fonctions qui étaient dans authService.ts
const getClientProfile = async (userId: string): Promise<Client | null> => {
  try {
    const { data, error } = await supabase.from('clients').select('*').eq('id', userId).single();
  
    if (error) {
      if (error.code !== 'PGRST116') { // Code pour 'The result contains 0 rows'
        logger.error('Erreur lors de la récupération du profil:', error);
      }
      return null;
    }
  
    return mapSupabaseClientToClient(data);
  } catch (error) {
    logger.error('Erreur inattendue lors de la récupération du profil:', error);
    return null;
  }
};

const onAuthStateChange = (callback: (user: any) => void) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });

  return () => subscription.unsubscribe();
};

// Définition de l'état et des actions
interface AuthState {
  user: User | null;
  originalUser: User | null;
  isAuthLoading: boolean;
  isDataLoading: boolean;
  dataError: string | null;
  theme: 'light' | 'dark';

  // Actions
  initializeAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: SignUpData) => Promise<void>;
  resendInvitation: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setOriginalUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  impersonate: (userId: string) => void;
  stopImpersonating: () => void;
}

const THEME_KEY = 'virtus_theme';
const ORIGINAL_USER_SESSION_KEY = 'virtus_original_user';

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === 'dark' ? 'dark' : 'light';
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  originalUser: (() => {
    try {
      const stored = sessionStorage.getItem(ORIGINAL_USER_SESSION_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  })(),
  isAuthLoading: true,
  isDataLoading: true,
  dataError: null,
  theme: getInitialTheme(),

  initializeAuth: () => {
    onAuthStateChange(async (supabaseUser) => {
      try {
        if (supabaseUser) {
          const clientProfile = await getClientProfile(supabaseUser.id);
          if (clientProfile) {
            set({ user: clientProfile, isAuthLoading: false });
          } else {
            set({ user: null, isAuthLoading: false });
          }
        } else {
          set({ user: null, isAuthLoading: false });
        }
      } catch (error) {
        logger.error("Erreur lors de l'initialisation de l'auth", { error });
        set({ user: null, isAuthLoading: false });
      }
    });
  },

  setUser: (user) => set({ user }),
  setOriginalUser: (originalUser) => {
    set({ originalUser });
    try {
      if (originalUser) {
        sessionStorage.setItem(ORIGINAL_USER_SESSION_KEY, JSON.stringify(originalUser));
      } else {
        sessionStorage.removeItem(ORIGINAL_USER_SESSION_KEY);
      }
    } catch (error) {
      logger.error('Échec de la persistance de la session', { error });
    }
  },
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(THEME_KEY, theme);
      } catch (error) {
        logger.error('Échec de la persistance du thème', { error });
      }
    }
  },

  login: async (email, password) => {
    set({ isAuthLoading: true });
    try {
      const validation = SignInSchema.safeParse({ email, password });
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        throw new Error(firstError.message);
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      logger.error('Erreur de connexion', { error });
      throw error;
    } finally {
      set({ isAuthLoading: false });
    }
  },

  logout: async () => {
    set({ isAuthLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, originalUser: null });
      sessionStorage.removeItem(ORIGINAL_USER_SESSION_KEY);
    } catch (error) {
      logger.error('Erreur de déconnexion', { error });
      throw error;
    } finally {
      set({ isAuthLoading: false });
    }
  },

  register: async (userData: SignUpData) => {
    set({ isAuthLoading: true });
    try {
      const validation = SignUpSchema.safeParse(userData);
      if (!validation.success) {
        const errors = validation.error.errors;
        if (errors && errors.length > 0) {
          const passwordErrors = errors.filter((e) => e.path[0] === 'password');
          if (passwordErrors.length > 0) {
            const requirements = [
              '• Au moins 8 caractères',
              '• Au moins une majuscule',
              '• Au moins une minuscule',
              '• Au moins un chiffre',
              '• Au moins un caractère spécial',
            ];
            throw new Error(
              'Le mot de passe ne respecte pas les exigences:\n' + requirements.join('\n')
            );
          }
          throw new Error(errors[0].message);
        }
        throw new Error('Données invalides');
      }

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

      if (authError) throw authError;

      if (!authData.user) {
        logger.error("Échec de la création du compte, pas d'utilisateur retourné", {
          email: userData.email,
        });
        throw new Error('Échec de la création du compte');
      }

      logger.info('Utilisateur Supabase créé avec succès, en attente de confirmation par e-mail', {
        userId: authData.user.id,
        email: userData.email,
      });

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

      const { error: profileError } = await supabase.from('clients').insert([clientProfile]);

      if (profileError) {
        logger.error('Erreur lors de la création du profil client:', {
          error: profileError,
          clientProfile,
        });
        throw profileError;
      } else {
        logger.info('Profil client créé avec succès dans la base de données', {
          userId: clientProfile.id,
          email: clientProfile.email,
        });
      }
    } catch (error) {
      logger.error("Erreur d'inscription", { error });
      throw error;
    } finally {
      set({ isAuthLoading: false });
    }
  },

  resendInvitation: async (email: string) => {
    logger.info("Renvoi de l'invitation", { email });
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/set-password`,
        },
      });
      if (error) throw error;
      logger.info('Invitation renvoyée avec succès', { email });
    } catch (error) {
      logger.error("Erreur lors du renvoi de l'invitation", { error });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/set-password`,
      });

      if (error) {
        logger.error("Échec de l'envoi de l'e-mail de réinitialisation de mot de passe", {
          error,
          email,
        });
        throw error;
      }
      logger.info('E-mail de réinitialisation de mot de passe envoyé avec succès', { email });
    } catch (error) {
      logger.error('Erreur lors de la réinitialisation du mot de passe', { error });
      throw error;
    }
  },

  updatePassword: async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        logger.error('Échec de la mise à jour du mot de passe', { error });
        throw error;
      }
      logger.info('Mot de passe mis à jour avec succès');
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du mot de passe', { error });
      throw error;
    }
  },

  impersonate: async (userId: string) => {
    logger.info("Impersonation de l'utilisateur", { userId });
    try {
      const {
        data: { user: adminUser },
      } = await supabase.auth.getUser();
      if (adminUser) {
        get().setOriginalUser(mapSupabaseClientToClient(adminUser as any));
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'supabase',
        token: userId,
      });

      if (error) throw error;
      if (data.user) {
        const clientProfile = await getClientProfile(data.user.id);
        if (clientProfile) {
          set({ user: clientProfile });
        } else {
          throw new Error("Profil client introuvable pour l'utilisateur impersonné");
        }
      }
    } catch (error) {
      logger.error("Erreur lors de l'impersonation de l'utilisateur", { error });
      throw error;
    }
  },

  stopImpersonating: async () => {
    logger.info("Arrêt de l'impersonation");
    try {
      const originalUser = get().originalUser;
      if (!originalUser) {
        throw new Error("Aucun utilisateur original trouvé pour arrêter l'impersonation.");
      }

      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'supabase',
        token: originalUser.id,
      });

      if (error) throw error;

      if (data.user) {
        const adminProfile = await getClientProfile(data.user.id);
        if (adminProfile) {
          set({ user: adminProfile, originalUser: null });
          sessionStorage.removeItem(ORIGINAL_USER_SESSION_KEY);
        } else {
          await supabase.auth.signOut();
          sessionStorage.removeItem(ORIGINAL_USER_SESSION_KEY);
          set({ user: null, originalUser: null });
          throw new Error("Échec de la reconnexion à l'administrateur. Déconnexion forcée.");
        }
      }
    } catch (error) {
      logger.error("Erreur lors de l'arrêt de l'impersonation", { error });
      throw error;
    }
  },
}));