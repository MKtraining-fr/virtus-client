import React, { useState } from 'react';
import Button from './Button';
import PasswordInput from './PasswordInput';
import { supabase } from '../services/supabase';

interface FirstLoginPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordChanged: () => void;
  userEmail: string;
  userFirstName?: string;
}

/**
 * Modal de changement de mot de passe à la première connexion
 * S'affiche automatiquement pour les utilisateurs créés par un coach/admin
 * avec un mot de passe temporaire généré automatiquement.
 */
const FirstLoginPasswordModal: React.FC<FirstLoginPasswordModalProps> = ({
  isOpen,
  onClose,
  onPasswordChanged,
  userEmail,
  userFirstName,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Règles de validation du mot de passe
  const passwordRules = {
    minLength: 8,
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/,
  };

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < passwordRules.minLength) {
      errors.push(`Au moins ${passwordRules.minLength} caractères`);
    }
    if (!passwordRules.hasUppercase.test(password)) {
      errors.push('Au moins une majuscule');
    }
    if (!passwordRules.hasLowercase.test(password)) {
      errors.push('Au moins une minuscule');
    }
    if (!passwordRules.hasNumber.test(password)) {
      errors.push('Au moins un chiffre');
    }
    if (!passwordRules.hasSpecial.test(password)) {
      errors.push('Au moins un caractère spécial (!@#$%^&*...)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const getPasswordStrength = (password: string): { level: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= passwordRules.minLength) score++;
    if (passwordRules.hasUppercase.test(password)) score++;
    if (passwordRules.hasLowercase.test(password)) score++;
    if (passwordRules.hasNumber.test(password)) score++;
    if (passwordRules.hasSpecial.test(password)) score++;

    if (score <= 2) return { level: score, label: 'Faible', color: 'bg-red-500' };
    if (score <= 3) return { level: score, label: 'Moyen', color: 'bg-yellow-500' };
    if (score <= 4) return { level: score, label: 'Fort', color: 'bg-green-400' };
    return { level: score, label: 'Très fort', color: 'bg-green-600' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation du mot de passe
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError('Le mot de passe ne respecte pas les critères de sécurité.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      // IMPORTANT: Récupérer le token AVANT de changer le mot de passe
      // car après le changement, le token sera invalidé
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const userId = sessionData.session?.user?.id;

      // Mettre à jour le mot de passe via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          password_changed: true,
          password_changed_at: new Date().toISOString(),
        },
      });

      if (updateError) {
        throw updateError;
      }

      // Mettre à jour le flag must_change_password dans la table clients
      if (userId) {
        await supabase
          .from('clients')
          .update({ must_change_password: false })
          .eq('id', userId);
      }

      // Envoyer l'email de confirmation avec le nouveau mot de passe
      // On utilise le token récupéré AVANT le changement de mot de passe
      if (accessToken) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-confirmation`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                email: userEmail,
                firstName: userFirstName || 'Utilisateur',
                newPassword: newPassword,
              }),
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Erreur lors de l\'envoi de l\'email de confirmation:', response.status, errorData);
          } else {
            console.log('Email de confirmation envoyé avec succès');
          }
        } catch (emailError) {
          // Ne pas bloquer si l'email échoue
          console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
        }
      } else {
        console.warn('Pas de token d\'accès disponible pour envoyer l\'email de confirmation');
      }

      // Succès
      onPasswordChanged();
      onClose();
    } catch (err) {
      console.error('Erreur lors du changement de mot de passe:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors du changement de mot de passe.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    // Marquer que l'utilisateur a choisi de ne pas changer son mot de passe maintenant
    // Il pourra le faire plus tard dans ses paramètres
    try {
      await supabase.auth.updateUser({
        data: {
          password_change_skipped: true,
          password_change_skipped_at: new Date().toISOString(),
        },
      });

      // Mettre à jour le flag must_change_password dans la table clients
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('clients')
          .update({ must_change_password: false })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour des métadonnées:', err);
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const passwordValidation = validatePassword(newPassword);
  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay - non cliquable pour forcer l'interaction */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Bienvenue sur Virtus !
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Pour sécuriser votre compte, nous vous recommandons de définir votre propre mot de passe.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {/* Email (lecture seule) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  {userEmail}
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Règles de mot de passe */}
              <div className="rounded-md bg-blue-50 p-3">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Votre mot de passe doit contenir :
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                    {newPassword.length >= 8 ? '✓' : '○'} Au moins 8 caractères
                  </li>
                  <li className={passwordRules.hasUppercase.test(newPassword) ? 'text-green-600' : ''}>
                    {passwordRules.hasUppercase.test(newPassword) ? '✓' : '○'} Une lettre majuscule
                  </li>
                  <li className={passwordRules.hasLowercase.test(newPassword) ? 'text-green-600' : ''}>
                    {passwordRules.hasLowercase.test(newPassword) ? '✓' : '○'} Une lettre minuscule
                  </li>
                  <li className={passwordRules.hasNumber.test(newPassword) ? 'text-green-600' : ''}>
                    {passwordRules.hasNumber.test(newPassword) ? '✓' : '○'} Un chiffre
                  </li>
                  <li className={passwordRules.hasSpecial.test(newPassword) ? 'text-green-600' : ''}>
                    {passwordRules.hasSpecial.test(newPassword) ? '✓' : '○'} Un caractère spécial
                  </li>
                </ul>
              </div>

              <PasswordInput
                label="Nouveau mot de passe"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Entrez votre nouveau mot de passe"
                required
              />

              {/* Indicateur de force du mot de passe */}
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level <= passwordStrength.level ? passwordStrength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength.color.replace('bg-', 'text-')}`}>
                    Force : {passwordStrength.label}
                  </p>
                </div>
              )}

              <PasswordInput
                label="Confirmer le mot de passe"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                required
              />

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-600">Les mots de passe ne correspondent pas.</p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Plus tard
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !passwordValidation.isValid || newPassword !== confirmPassword}
              >
                {isLoading ? 'Modification...' : 'Définir mon mot de passe'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginPasswordModal;
