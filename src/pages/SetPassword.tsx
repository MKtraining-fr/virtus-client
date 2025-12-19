import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Récupérer les paramètres depuis l'URL complète (avant le hash router)
        const fullUrl = window.location.href;
        const hashIndex = fullUrl.indexOf('#');
        
        // Chercher les paramètres dans différents endroits possibles
        let accessToken: string | null = null;
        let refreshToken: string | null = null;
        let type: string | null = null;

        // Option 1: Paramètres dans l'URL avant le hash (ex: /set-password?access_token=...#/)
        const urlBeforeHash = hashIndex > -1 ? fullUrl.substring(0, hashIndex) : fullUrl;
        const urlParams = new URL(urlBeforeHash);
        accessToken = urlParams.searchParams.get('access_token');
        refreshToken = urlParams.searchParams.get('refresh_token');
        type = urlParams.searchParams.get('type');

        // Option 2: Paramètres dans le hash après la route (ex: /#/set-password?access_token=...)
        if (!accessToken && location.search) {
          const searchParams = new URLSearchParams(location.search);
          accessToken = searchParams.get('access_token');
          refreshToken = searchParams.get('refresh_token');
          type = searchParams.get('type');
        }

        // Option 3: Vérifier si les paramètres sont dans le fragment après le hash de la route
        // Format: /#/set-password#access_token=...
        if (!accessToken && hashIndex > -1) {
          const afterHash = fullUrl.substring(hashIndex + 1);
          const secondHashIndex = afterHash.indexOf('#');
          if (secondHashIndex > -1) {
            const fragmentParams = new URLSearchParams(afterHash.substring(secondHashIndex + 1));
            accessToken = fragmentParams.get('access_token');
            refreshToken = fragmentParams.get('refresh_token');
            type = fragmentParams.get('type');
          }
        }

        console.log('SetPassword - Tokens trouvés:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

        // Si on a un token de récupération, établir la session
        if (accessToken && (type === 'recovery' || type === 'signup' || type === 'invite')) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            console.error('Erreur lors de la création de la session:', sessionError);
            setError('Lien invalide ou expiré. Veuillez demander un nouveau lien.');
            setLoading(false);
            return;
          }

          if (data.session) {
            console.log('Session établie avec succès');
            setIsValidSession(true);
            setLoading(false);
            return;
          }
        }

        // Vérifier si une session existe déjà (cas où l'utilisateur est déjà connecté via le lien)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Vérifier si c'est une session de récupération
          const isRecoverySession = session.user?.aud === 'authenticated';
          if (isRecoverySession) {
            console.log('Session de récupération détectée');
            setIsValidSession(true);
            setLoading(false);
            return;
          }
        }

        // Aucune session valide trouvée
        setError('Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.');
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de l\'initialisation:', err);
        setError('Une erreur est survenue. Veuillez réessayer.');
        setLoading(false);
      }
    };

    initializeSession();
  }, [location]);

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

    // Validation
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
      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Mettre à jour les métadonnées pour indiquer que le mot de passe a été changé
      await supabase.auth.updateUser({
        data: {
          password_changed: true,
          password_changed_at: new Date().toISOString(),
        }
      });

      setSuccess(true);

      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        // Se déconnecter pour forcer une nouvelle connexion avec le nouveau mot de passe
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

  // Affichage du chargement
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

  // Affichage du succès
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Mot de passe défini !</h1>
            <p className="text-gray-600">
              Votre mot de passe a été défini avec succès. Vous allez être redirigé vers la page de
              connexion...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Affichage de l'erreur (lien invalide)
  if (!isValidSession && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
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

  // Formulaire de définition du mot de passe
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
          <Input
            label="Nouveau mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Exigences du mot de passe :</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className={password.length >= 8 ? 'text-green-600' : ''}>
                • Au moins 8 caractères
              </li>
              <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                • Au moins une majuscule
              </li>
              <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                • Au moins une minuscule
              </li>
              <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                • Au moins un chiffre
              </li>
              <li
                className={/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) ? 'text-green-600' : ''}
              >
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
            <a href="#/login" className="text-primary hover:underline font-medium">
              Se connecter
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SetPassword;
