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
 * - Le flag must_change_password est true dans la table clients
 * - OU il a été créé par un admin/coach (via create-user-admin) et n'a pas encore changé son mot de passe
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
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          logger.error('Erreur lors de la récupération des métadonnées utilisateur', { error: authError });
          setIsLoading(false);
          return;
        }

        setUserEmail(user.email || '');

        // Vérifier le flag must_change_password dans la table clients
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('must_change_password')
          .eq('id', userId)
          .single();

        if (clientError) {
          logger.error('Erreur lors de la récupération du profil client', { error: clientError });
          // Fallback sur les métadonnées si la requête échoue
        }

        // Vérifier d'abord le flag dans la table clients
        const mustChangePasswordFromDB = clientData?.must_change_password === true;

        // Fallback sur les métadonnées utilisateur
        const userMetadata = user.user_metadata || {};
        const wasCreatedByAdmin = userMetadata.created_by_admin === true;
        const hasChangedPassword = userMetadata.password_changed === true;
        const hasSkippedPasswordChange = userMetadata.password_change_skipped === true;

        // L'utilisateur doit changer son mot de passe si :
        // - Le flag must_change_password est true dans la DB
        // - OU (il a été créé par un admin/coach ET n'a pas encore changé son mot de passe ET n'a pas sauté)
        const shouldChangePassword = mustChangePasswordFromDB || 
          (wasCreatedByAdmin && !hasChangedPassword && !hasSkippedPasswordChange);

        logger.info('Vérification première connexion', {
          userId,
          mustChangePasswordFromDB,
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
