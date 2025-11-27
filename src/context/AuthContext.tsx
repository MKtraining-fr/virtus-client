import React, { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useDataStore, initializeMessagesRealtime } from '../stores/useDataStore';
import { logger } from '../utils/logger';

// Le nouveau AuthProvider est un composant "léger" qui gère les effets de bord
// comme la navigation, mais ne fournit pas de contexte directement.
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { user, isAuthLoading, initializeAuth, currentViewRole, originalUser, theme } = useAuthStore(); // Déstructuration de tout l'état du store ici pour un accès direct

  // Initialisation de l'écouteur d'authentification au montage du composant
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Synchroniser le thème avec le DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (isAuthLoading) {
      logger.info('Auth loading...');
      return;
    }

    logger.info('Auth state changed', { 
      userEmail: user?.email, 
      userRole: user?.role, 
      currentViewRole,
      hasOriginalUser: !!originalUser
    });

    // Récupération de loadData du store de données
    const { loadData } = useDataStore.getState();
    const targetUserId = currentViewRole === 'admin' ? user?.id : (originalUser?.id || user?.id);
    loadData(targetUserId || null);

    // Initialiser l'écoute en temps réel des messages si l'utilisateur est connecté
    let realtimeChannel: any = null;
    if (user?.id) {
      realtimeChannel = initializeMessagesRealtime(user.id);
    }

    // Nettoyage lors du démontage ou changement d'utilisateur
    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
      }
    };
  }, [user, isAuthLoading, currentViewRole, originalUser]);

  // Effet séparé pour gérer les redirections
  useEffect(() => {
    if (isAuthLoading) return;

    const currentPath = window.location.hash.substring(1) || '/'; // Utilise le hash pour HashRouter. Si vide, on considère la racine '/'
    
    logger.info('Navigation check', { currentPath, hasUser: !!user, currentViewRole });

    if (user) {
      // Si l'utilisateur est déjà connecté, on le redirige vers son tableau de bord
      // uniquement s'il est sur une page publique (login, set-password, ou la page d'accueil '/')
      const targetPath =
        currentViewRole === 'admin'
          ? '/app/admin/dashboard'
          : currentViewRole === 'coach'
            ? '/app/coach/dashboard'
            : '/app/client/dashboard';

      if (
        currentPath === '/' ||
        currentPath === '/login' ||
        currentPath === '/set-password'
      ) {
        logger.info('Redirecting authenticated user', { from: currentPath, to: targetPath });
        navigate(targetPath, { replace: true });
      }
    } else {
      const publicPaths = ['/', '/login', '/set-password'];
      if (!publicPaths.includes(currentPath)) {
        logger.info('Redirecting unauthenticated user to login', { from: currentPath });
        navigate('/login', { replace: true });
      }
    }
  }, [user, isAuthLoading, navigate, currentViewRole]);

  return <>{children}</>;
};

// Le nouveau hook `useAuth` combine les deux stores pour une migration transparente.
// Les composants qui utilisent `useAuth` n'auront pas besoin d'être modifiés
// pour accéder à l'état, car ce hook recrée l'API de l'ancien AuthContext.
export const useAuth = () => {
  const authStore = useAuthStore();
  const dataStore = useDataStore();
  const navigate = useNavigate();

  // Surcharger les fonctions qui nécessitent une navigation
  const logout = async () => {
    try {
      await authStore.logout();
      navigate('/login', { replace: true });
    } catch (error) {
      logger.error('Erreur lors de la déconnexion avec navigation', { error });
      throw error;
    }
  };

  const resetViewRole = async () => {
    try {
      await authStore.resetViewRole();
      navigate('/app/admin/dashboard', { replace: true });
    } catch (error) {
      logger.error("Erreur lors de l'arrêt de l'impersonation avec navigation", { error });
      throw error;
    }
  };

  return {
    ...authStore,
    ...dataStore,
    logout, // Utiliser la version surchargée avec navigation
    resetViewRole, // Utiliser la version surchargée avec navigation
    setViewRole: authStore.setViewRole,
    impersonate: async (userId: string) => {
      try {
        await authStore.impersonate(userId);
        const impersonatedRole = authStore.getState().user?.role;
        if (impersonatedRole === 'coach') {
          navigate('/app/coach/dashboard', { replace: true });
        } else if (impersonatedRole === 'client') {
          navigate('/app/client/dashboard', { replace: true });
        } else {
          // Si l'usurpation a réussi mais le rôle n'est ni coach ni client (improbable), on va à l'admin dashboard
          navigate('/app/admin/dashboard', { replace: true });
        }
      } catch (error) {
        logger.error("Erreur lors de l'usurpation d'identité avec navigation", { error });
        throw error;
      }
    },
  };
};
