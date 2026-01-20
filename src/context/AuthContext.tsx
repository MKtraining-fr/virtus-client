import React, { ReactNode, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useDataStore, initializeMessagesRealtime } from '../stores/useDataStore';
import { logger } from '../utils/logger';

// Le nouveau AuthProvider est un composant "léger" qui gère les effets de bord
// comme la navigation, mais ne fournit pas de contexte directement.
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthLoading, initializeAuth, currentViewRole, originalUser, theme } = useAuthStore();
  const lastNavigationRef = useRef<string>('');

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
  }, [user?.id, isAuthLoading, currentViewRole, originalUser?.id]);

  // Effet séparé pour gérer les redirections avec protection contre les boucles
  useEffect(() => {
    if (isAuthLoading) return;

    const currentPath = location.pathname;
    
    logger.info('Navigation check', { currentPath, hasUser: !!user, currentViewRole, userRole: user?.role });

    if (user) {
      // Vérifier si le client archivé a dépassé le délai de grâce de 7 jours
      if (user.role === 'client' && user.status === 'archived' && !originalUser) {
        if (user.archived_at) {
          const archivedDate = new Date(user.archived_at);
          const now = new Date();
          const daysSinceArchived = Math.floor((now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceArchived >= 7) {
            logger.warn('Accès refusé : délai de grâce dépassé', { userId: user.id, daysSinceArchived });
            useAuthStore.getState().logout();
            navigate('/login', { 
              replace: true, 
              state: { error: "Votre compte a été archivé et le délai de 7 jours est expiré. Vous n'avez plus accès à votre interface." } 
            });
            return;
          }
        }
      }

      // Déterminer le currentViewRole basé sur le rôle réel de l'utilisateur si non défini
      let effectiveViewRole = currentViewRole;
      
      // Si currentViewRole est 'admin' mais que l'utilisateur n'est pas admin, corriger
      if (currentViewRole === 'admin' && user.role !== 'admin') {
        effectiveViewRole = user.role as 'coach' | 'client';
        // Mettre à jour le store avec le bon rôle
        useAuthStore.setState({ currentViewRole: effectiveViewRole });
        logger.info('Correction du currentViewRole', { from: currentViewRole, to: effectiveViewRole });
      }

      // Si l'utilisateur est déjà connecté, on le redirige vers son tableau de bord
      // uniquement s'il est sur une page publique (login, set-password, ou la page d'accueil '/')
      const targetPath =
        effectiveViewRole === 'admin'
          ? '/app/admin/dashboard'
          : effectiveViewRole === 'coach'
            ? '/app/coach/dashboard'
            : '/app/client/dashboard';

      // Protection contre les boucles de redirection
      if (lastNavigationRef.current === targetPath) {
        logger.info('Navigation déjà effectuée vers', { targetPath });
        return;
      }

      // Vérifier si le pathname contient set-password (avec ou sans slash final)
      const isOnSetPasswordPage = currentPath === '/set-password' || currentPath.endsWith('/set-password');

      // NE JAMAIS rediriger depuis /set-password
      // L'utilisateur doit pouvoir accéder à cette page pour changer son mot de passe,
      // qu'il soit connecté ou non (flux de récupération de mot de passe)
      if (isOnSetPasswordPage) {
        logger.info('On /set-password page, not redirecting');
        return;
      }

      if (currentPath === '/' || currentPath === '/login') {
        logger.info('Redirecting authenticated user', { from: currentPath, to: targetPath });
        lastNavigationRef.current = targetPath;
        navigate(targetPath, { replace: true });
      }
    } else {
      const publicPaths = ['/', '/login', '/set-password', '/demo/irontrack'];
      if (!publicPaths.includes(currentPath)) {
        logger.info('Redirecting unauthenticated user to login', { from: currentPath });
        lastNavigationRef.current = '/login';
        navigate('/login', { replace: true });
      }
    }
  }, [user?.id, user?.role, isAuthLoading, navigate, currentViewRole, location.pathname]);

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
