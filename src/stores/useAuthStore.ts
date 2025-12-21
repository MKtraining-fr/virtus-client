// Fichier corrigé : src/stores/useAuthStore.ts
// Modifications apportées pour résoudre les problèmes d'authentification

import { create } from 'zustand';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { User, SignUpData, Client } from '../types';
import { SignUpSchema, SignInSchema } from '../validation/schemas';
import { logger } from '../utils/logger';
import { supabase } from '../services/supabase';
import { mapSupabaseClientToClient } from '../services/typeMappers';
import { getClientAssignedPrograms } from '../services/clientProgramService';

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
  
    const client = mapSupabaseClientToClient(data);
    
    // Charger les programmes assignés si l'utilisateur est un client
    if (client && client.role === 'client') {
      try {
        const assignedPrograms = await getClientAssignedPrograms(userId);
        const activeProgram =
          assignedPrograms.find((p) => p.status === 'active') || assignedPrograms[0] || null;

        client.assignedPrograms = assignedPrograms;
        client.assignedProgram = activeProgram;

        if (activeProgram) {
          client.programWeek = activeProgram.currentWeek || 1;
          client.sessionProgress = activeProgram.currentSession || 1;
        }

        logger.info('Programme actif chargé', { name: activeProgram?.name || 'Aucun' });
      } catch (programError) {
        logger.error('Erreur lors du chargement des programmes assignés:', programError);
        // Ne pas bloquer la connexion si le chargement des programmes échoue
        client.assignedProgram = null;
        client.assignedPrograms = [];
      }
    }
    
    return client;
  } catch (error) {
    logger.error('Erreur inattendue lors de la récupération du profil:', error);
    return null;
  }
};

let unsubscribeFromAuthListener: (() => void) | null = null;

// Définition de l'état et des actions
interface AuthState {
  user: User | null;
  originalUser: User | null;
  currentViewRole: 'admin' | 'coach' | 'client';
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
  setViewRole: (role: 'coach' | 'client') => void;
  resetViewRole: () => void;
  impersonate: (userId: string) => Promise<void>;
}

const THEME_KEY = 'virtus_theme';
const ORIGINAL_USER_SESSION_KEY = 'virtus_original_user';

// Fonction pour récupérer le thème d'un utilisateur spécifique
const getUserTheme = (userId: string | null): 'light' | 'dark' => {
  if (typeof window === 'undefined' || !userId) {
    return 'light';
  }
  const stored = window.localStorage.getItem(`${THEME_KEY}_${userId}`);
  return stored === 'dark' ? 'dark' : 'light';
};

// Toujours démarrer en mode clair (sera mis à jour après connexion)
const getInitialTheme = (): 'light' | 'dark' => {
  return 'light';
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
  currentViewRole: (() => {
    try {
      const stored = sessionStorage.getItem('virtus_current_view_role');
      return stored === 'coach' || stored === 'client' ? stored : 'admin';
    } catch {
      return 'admin';
    }
  })(),
  isAuthLoading: true,
  isDataLoading: true,
  dataError: null,
  theme: getInitialTheme(),

  initializeAuth: () => {
    if (unsubscribeFromAuthListener) {
      return;
    }

    const handleSupabaseUser = async (supabaseUser: SupabaseAuthUser | null) => {
      try {
        if (supabaseUser) {
          const clientProfile = await getClientProfile(supabaseUser.id);
          if (clientProfile) {
            // Charger le thème de l'utilisateur
            const userTheme = getUserTheme(clientProfile.id);
            set({ user: clientProfile, theme: userTheme, isAuthLoading: false });
            logger.info('Utilisateur connecté avec thème', { userId: clientProfile.id, theme: userTheme });
          } else {
            set({ user: null, theme: 'light', isAuthLoading: false });
          }
        } else {
          // Réinitialiser le thème en mode clair lors de la déconnexion
          set({ user: null, theme: 'light', isAuthLoading: false });
        }
      } catch (error) {
        logger.error("Erreur lors de l'initialisation de l'auth", { error });
        set({ user: null, theme: 'light', isAuthLoading: false });
      }
    };

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        await handleSupabaseUser(data.session?.user ?? null);
      } catch (error) {
        logger.error('Erreur lors de la récupération de la session active', { error });
        set({ user: null, isAuthLoading: false });
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void handleSupabaseUser(session?.user ?? null);
    });

    unsubscribeFromAuthListener = () => subscription.unsubscribe();
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
    const { user } = get();
    set({ theme });
    if (typeof window !== 'undefined' && user?.id) {
      try {
        // Sauvegarder le thème avec l'ID de l'utilisateur
        window.localStorage.setItem(`${THEME_KEY}_${user.id}`, theme);
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

  // ========== FONCTION LOGOUT CORRIGÉE ==========
  logout: async () => {
    set({ isAuthLoading: true });
    try {
      // Vérifier si une session existe avant de tenter la déconnexion
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logger.warn('Erreur lors de la récupération de la session', { error: sessionError });
      }
      
      // Ne tenter la déconnexion que si une session valide existe
      if (session) {
        const { error } = await supabase.auth.signOut();
        
        // Gérer les erreurs de session manquante
        if (error) {
          if (error.message === 'Session not found' || 
              error.message.includes('Auth session missing') ||
              error.message.includes('session_not_found')) {
            logger.warn('Session déjà expirée ou inexistante', { error });
          } else {
            throw error;
          }
        }
      } else {
        logger.info('Aucune session active à déconnecter');
      }
      
      // Nettoyer l'état local dans tous les cas et réinitialiser le thème
      set({ user: null, originalUser: null, currentViewRole: 'admin', theme: 'light' });
      sessionStorage.removeItem(ORIGINAL_USER_SESSION_KEY);
      sessionStorage.removeItem('virtus_current_view_role');
      
      logger.info('Déconnexion réussie et état nettoyé (thème réinitialisé)');
    } catch (error) {
      logger.error('Erreur de déconnexion', { error });
      
      // Forcer le nettoyage de l'état local même en cas d'erreur et réinitialiser le thème
      set({ user: null, originalUser: null, currentViewRole: 'admin', theme: 'light' });
      sessionStorage.removeItem(ORIGINAL_USER_SESSION_KEY);
      sessionStorage.removeItem('virtus_current_view_role');
      
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

      // Le profil client est créé automatiquement par le trigger 'on_auth_user_created_sync_clients'
      // qui s'exécute lors de l'insertion dans auth.users
      // Pas besoin d'insérer manuellement dans la table clients
      logger.info('Le profil client sera créé automatiquement par le trigger de base de données', {
        userId: authData.user.id,
        email: userData.email,
      });
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

  setViewRole: (role: 'coach' | 'client') => {
    const user = get().user;
    if (user?.role !== 'admin') {
      logger.error("Seul un administrateur peut changer de vue.");
      return;
    }
    set({ currentViewRole: role, originalUser: user });
    sessionStorage.setItem('virtus_current_view_role', role);
    sessionStorage.setItem(ORIGINAL_USER_SESSION_KEY, JSON.stringify(user));
  },

  // ========== FONCTION RESETVIEWROLE AMÉLIORÉE ==========
  resetViewRole: () => {
    const originalUser = get().originalUser;
    if (!originalUser || originalUser.role !== 'admin') {
      logger.error("Impossible de réinitialiser la vue : pas d'utilisateur admin original.");
      return;
    }
    
    // Restaurer l'utilisateur admin original
    set({ 
      user: originalUser,
      currentViewRole: 'admin', 
      originalUser: null 
    });
    sessionStorage.removeItem('virtus_current_view_role');
    sessionStorage.removeItem(ORIGINAL_USER_SESSION_KEY);
    
    logger.info('Vue réinitialisée vers admin');
  },

  // ========== FONCTION IMPERSONATE AMÉLIORÉE ==========
  impersonate: async (userId: string) => {
    const adminUser = get().user;
    if (adminUser?.role !== 'admin') {
      logger.error("Seul un administrateur peut usurper l'identité.");
      throw new Error("Seul un administrateur peut usurper l'identité.");
    }
    
    set({ isAuthLoading: true });
    try {
      const impersonatedProfile = await getClientProfile(userId);
      if (!impersonatedProfile) {
        throw new Error("Profil utilisateur à usurper introuvable.");
      }

      // Important : Ne pas modifier la session Supabase
      // L'admin reste connecté avec sa propre session
      // On change uniquement l'état local pour afficher les données de l'utilisateur impersonné
      set({
        user: impersonatedProfile,
        originalUser: adminUser,
        currentViewRole: impersonatedProfile.role as 'coach' | 'client',
      });

      // Persistance de l'état d'usurpation dans sessionStorage
      sessionStorage.setItem(ORIGINAL_USER_SESSION_KEY, JSON.stringify(adminUser));
      sessionStorage.setItem('virtus_current_view_role', impersonatedProfile.role);

      logger.info(`Usurpation réussie de l'utilisateur ${userId} en tant que ${impersonatedProfile.role}`, {
        adminId: adminUser.id,
        impersonatedId: userId,
        impersonatedRole: impersonatedProfile.role,
      });
    } catch (error) {
      logger.error("Échec de l'usurpation d'identité", { error });
      throw error;
    } finally {
      set({ isAuthLoading: false });
    }
  },
}));
