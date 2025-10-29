import React, { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useDataStore } from '../stores/useDataStore';
import { logger } from '../utils/logger';

// Le nouveau AuthProvider est un composant "léger" qui gère les effets de bord
// comme la navigation, mais ne fournit pas de contexte directement.
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { user, isAuthLoading, initializeAuth } = useAuthStore(); // Ajout de initializeAuth

  // Initialisation de l'écouteur d'authentification au montage du composant
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthLoading) return;

    const currentPath = window.location.hash.substring(1); // Utilise le hash pour HashRouter

    if (user) {
      const targetPath =
        user.role === 'admin'
          ? '/app/admin/dashboard'
          : user.role === 'coach'
            ? '/app/coach/dashboard'
            : '/app/client/dashboard';

      if (
        currentPath === '/login' ||
        currentPath === '/set-password' ||
        currentPath === '/app' ||
        currentPath === '/app/'
      ) {
        navigate(targetPath, { replace: true });
      }
    } else {
      const publicPaths = ['/', '/login', '/set-password'];
      if (!publicPaths.includes(currentPath)) {
        navigate('/login', { replace: true });
      }
    }
  }, [user, isAuthLoading, navigate]);

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

  const stopImpersonating = async () => {
    try {
      await authStore.stopImpersonating();
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      logger.error("Erreur lors de l'arrêt de l'impersonation avec navigation", { error });
      throw error;
    }
  };

  return {
    ...authStore,
    ...dataStore,
    logout, // Utiliser la version surchargée avec navigation
    stopImpersonating, // Utiliser la version surchargée avec navigation
  };
};
