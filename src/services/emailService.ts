import { supabase } from './supabase';
import { logger } from '../utils/logger';

/**
 * Service de gestion des emails
 */

export interface EmailResult {
  success: boolean;
  message: string;
  error?: any;
}

/**
 * Envoyer un email d'invitation à un client
 * Utilise la fonctionnalité de réinitialisation de mot de passe de Supabase
 * pour permettre au client de définir son propre mot de passe
 */
export const sendClientInvitation = async (email: string): Promise<EmailResult> => {
  try {
    logger.info("Envoi d'invitation client", { email });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/set-password`,
    });

    if (error) {
      logger.error("Erreur lors de l'envoi de l'invitation", { error, email });

      // Gérer les erreurs spécifiques
      if (error.message.includes('rate limit')) {
        return {
          success: false,
          message: "Trop de tentatives d'envoi. Veuillez réessayer dans quelques minutes.",
          error,
        };
      }

      if (error.message.includes('not found')) {
        return {
          success: false,
          message: "Cette adresse email n'est pas enregistrée dans le système.",
          error,
        };
      }

      if (error.message.includes('SMTP')) {
        return {
          success: false,
          message: "Erreur de configuration email. Veuillez contacter l'administrateur.",
          error,
        };
      }

      return {
        success: false,
        message: error.message || "Erreur lors de l'envoi de l'email",
        error,
      };
    }

    logger.info('Invitation envoyée avec succès', { email });
    return {
      success: true,
      message: "Email d'invitation envoyé avec succès",
    };
  } catch (error) {
    logger.error("Exception lors de l'envoi de l'invitation", { error, email });
    return {
      success: false,
      message: "Une erreur inattendue s'est produite",
      error,
    };
  }
};

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
export const sendPasswordReset = async (email: string): Promise<EmailResult> => {
  try {
    logger.info('Envoi de réinitialisation de mot de passe', { email });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/set-password`,
    });

    if (error) {
      logger.error("Erreur lors de l'envoi de la réinitialisation", { error, email });

      if (error.message.includes('rate limit')) {
        return {
          success: false,
          message: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
          error,
        };
      }

      return {
        success: false,
        message: error.message || "Erreur lors de l'envoi de l'email",
        error,
      };
    }

    logger.info('Email de réinitialisation envoyé avec succès', { email });
    return {
      success: true,
      message: 'Email de réinitialisation envoyé avec succès',
    };
  } catch (error) {
    logger.error("Exception lors de l'envoi de la réinitialisation", { error, email });
    return {
      success: false,
      message: "Une erreur inattendue s'est produite",
      error,
    };
  }
};

/**
 * Vérifier si un email existe dans le système
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('clients').select('id').eq('email', email).single();

    if (error) {
      logger.error("Erreur lors de la vérification de l'email", { error, email });
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error("Exception lors de la vérification de l'email", { error, email });
    return false;
  }
};

/**
 * Enregistrer l'envoi d'un email dans les logs
 */
export const logEmailSent = async (
  recipientEmail: string,
  emailType: 'invitation' | 'password_reset' | 'welcome',
  success: boolean,
  errorMessage?: string
): Promise<void> => {
  try {
    // On pourrait créer une table email_logs pour tracer tous les emails envoyés
    logger.info('Email log', {
      recipientEmail,
      emailType,
      success,
      errorMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Erreur lors de l'enregistrement du log email", { error });
  }
};

/**
 * Obtenir le statut de configuration SMTP
 */
export const getSmtpStatus = async (): Promise<{
  configured: boolean;
  message: string;
}> => {
  try {
    // Tenter d'envoyer un email de test à une adresse fictive
    // Si SMTP n'est pas configuré, Supabase retournera une erreur spécifique
    const { error } = await supabase.auth.resetPasswordForEmail('test@example.com', {
      redirectTo: `${window.location.origin}/set-password`,
    });

    if (error) {
      if (error.message.includes('SMTP')) {
        return {
          configured: false,
          message: "SMTP n'est pas configuré. Veuillez configurer Brevo SMTP dans Supabase.",
        };
      }
      // Si l'erreur est "user not found", cela signifie que SMTP est configuré
      if (error.message.includes('not found')) {
        return {
          configured: true,
          message: 'SMTP est configuré correctement.',
        };
      }
    }

    return {
      configured: true,
      message: 'SMTP est configuré correctement.',
    };
  } catch (error) {
    logger.error('Erreur lors de la vérification du statut SMTP', { error });
    return {
      configured: false,
      message: 'Impossible de vérifier le statut SMTP.',
    };
  }
};
