import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';

interface FirstLoginState {
  isFirstLogin: boolean;
  isLoading: boolean;
  userEmail: string;
}

/**
 * Hook pour détecter si c'est la première connexion de l'utilisateur
 * et s'il doit changer son mot de passe.
 * 
 * Un utilisateur est considéré comme "première connexion" si :
 * - Il a été créé par un admin/coach (via create-user-admin)
 * - Il n'a pas encore changé son mot de passe (password_changed !== true)
 * - Il n'a pas choisi de sauter cette étape (password_change_skipped !== true)
 */
export const useFirstLogin = (userId: string | undefined): FirstLoginState => {
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const checkFirstLogin = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Récupérer les informations de l'utilisateur depuis Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          logger.error('Erreur lors de la récupération des métadonnées utilisateur', { error });
          setIsLoading(false);
          return;
        }

        setUserEmail(user.email || '');

        const userMetadata = user.user_metadata || {};

        // Vérifier si l'utilisateur a été créé par un admin/coach
        // et s'il n'a pas encore changé son mot de passe
        const wasCreatedByAdmin = userMetadata.created_by_admin === true;
        const hasChangedPassword = userMetadata.password_changed === true;
        const hasSkippedPasswordChange = userMetadata.password_change_skipped === true;

        // L'utilisateur doit changer son mot de passe si :
        // - Il a été créé par un admin/coach
        // - Il n'a pas encore changé son mot de passe
        // - Il n'a pas choisi de sauter cette étape
        const shouldChangePassword = wasCreatedByAdmin && !hasChangedPassword && !hasSkippedPasswordChange;

        logger.info('Vérification première connexion', {
          userId,
          wasCreatedByAdmin,
          hasChangedPassword,
          hasSkippedPasswordChange,
          shouldChangePassword,
        });

        setIsFirstLogin(shouldChangePassword);
      } catch (error) {
        logger.error('Erreur lors de la vérification de première connexion', { error });
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstLogin();
  }, [userId]);

  return { isFirstLogin, isLoading, userEmail };
};

export default useFirstLogin;
