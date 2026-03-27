import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Button from '../components/Button';
import PasswordInput from '../components/PasswordInput';
import Card from '../components/Card';

// Scheme de l'app native MuscleFlow
const APP_SCHEME = 'manus20260303135554';

const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [redirectedToApp, setRedirectedToApp] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Récupérer les paramètres du hash (format Supabase BrowserRouter)
        // Format: /set-password#access_token=...&refresh_token=...&type=recovery
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        const tokenHash = params.get('token_hash');

        // Si on a des tokens de récupération → tenter de rediriger vers l'app native
        if (type === 'recovery' && (accessToken || tokenHash)) {
          // Construire le deep link vers l'app native avec les tokens
          // L'app native intercepte ce deep link et Supabase JS SDK traite les tokens automatiquement
          let deepLink: string;
          if (accessToken && refreshToken) {
            deepLink = `${APP_SCHEME}://reset-password#access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`;
          } else if (tokenHash) {
            deepLink = `${APP_SCHEME}://reset-password?token_hash=${tokenHash}&type=recovery`;
          } else {
            deepLink = `${APP_SCHEME}://reset-password`;
          }

          // Tenter d'ouvrir l'app native
          window.location.href = deepLink;
          setRedirectedToApp(true);

          // Fallback : si l'app n'est pas installée (après 2s), afficher le formulaire web
          setTimeout(async () => {
            // Si on est toujours sur cette page, l'app n'a pas été ouverte
            // Initialiser la session web comme fallback
            if (accessToken && refreshToken) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (!sessionError) {
                setIsValidSession(true);
              } else {
                setError('Lien invalide ou expiré. Veuillez demander un nouveau lien.');
              }
            } else if (tokenHash) {
              const { error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: 'recovery',
              });
              if (!verifyError) {
                setIsValidSession(true);
              } else {
                setError('Lien invalide ou expiré. Veuillez demander un nouveau lien.');
              }
            }
            setLoading(false);
          }, 2000);
          return;
        }

        // Pas de tokens dans l'URL — vérifier si une session existe déjà
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (session) {
          setIsValidSession(true);
          setLoading(false);
          return;
        }

        if (sessionError) {
          console.error('SetPassword - Erreur session:', sessionError);
        }

        // Écouter les événements d'authentification Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
            setIsValidSession(true);
            setLoading(false);
          }
        });

        // Attendre un peu pour voir si une session est établie
        setTimeout(async () => {
          const { data: { session: delayedSession } } = await supabase.auth.getSession();
          if (delayedSession) {
            setIsValidSession(true);
            setLoading(false);
          } else {
            setError('Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.');
            setLoading(false);
          }
        }, 2000);

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('SetPassword - Erreur lors de l\'initialisation:', err);
        setError('Une erreur est survenue. Veuillez réessayer.');
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push('Au moins 8 caractères');
    if (!/[A-Z]/.test(pwd)) errors.push('Au moins une majuscule');
    if (!/[a-z]/.test(pwd)) errors.push('Au moins une minuscule');
    if (!/[0-9]/.test(pwd)) errors.push('Au moins un chiffre');
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) errors.push('Au moins un caractère spécial');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(
        'Le mot de passe doit contenir :\n' + passwordErrors.map((e) => `• ${e}`).join('\n')
      );
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      await supabase.auth.updateUser({
        data: {
          password_changed: true,
          password_changed_at: new Date().toISOString(),
        }
      });

      setSuccess(true);

      setTimeout(() => {
        supabase.auth.signOut().then(() => {
          navigate('/login');
        });
      }, 3000);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Une erreur inconnue est survenue.');
      setError(error.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  // Redirection vers l'app en cours
  if (redirectedToApp && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Ouverture de l'application</h1>
            <p className="text-gray-600 mb-4">
              Vous allez être redirigé vers l'application MuscleFlow pour définir votre nouveau mot de passe.
            </p>
            <p className="text-sm text-gray-400">
              Si l'application ne s'ouvre pas automatiquement, le formulaire web s'affichera dans quelques secondes.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification du lien...</p>
        </Card>
      </div>
    );
  }

  // Succès
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Mot de passe défini !</h1>
            <p className="text-gray-600">
              Votre mot de passe a été défini avec succès. Vous allez être redirigé vers la page de connexion...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Erreur (lien invalide)
  if (!isValidSession && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Lien invalide</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Retour à la connexion
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Formulaire web (fallback si l'app n'est pas installée)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Définir votre mot de passe</h1>
          <p className="text-gray-600">
            Choisissez un mot de passe sécurisé pour accéder à votre compte
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm whitespace-pre-line">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <PasswordInput
            label="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <PasswordInput
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Exigences du mot de passe :</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className={password.length >= 8 ? 'text-green-600' : ''}>• Au moins 8 caractères</li>
              <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>• Au moins une majuscule</li>
              <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>• Au moins une minuscule</li>
              <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>• Au moins un chiffre</li>
              <li className={/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) ? 'text-green-600' : ''}>
                • Au moins un caractère spécial
              </li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Définir le mot de passe'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Vous avez déjà un compte ?{' '}
            <a href="/#/login" className="text-primary hover:underline font-medium">
              Se connecter
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SetPassword;
