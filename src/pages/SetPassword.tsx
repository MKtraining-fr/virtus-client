import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  // Fonction pour extraire les paramètres de l'URL avec HashRouter
  // Format: /#/set-password?token=xxx&type=recovery&email=xxx
  const getHashParams = (): { token: string | null; type: string | null; email: string | null } => {
    const hash = window.location.hash; // Ex: #/set-password?token=xxx&type=recovery&email=xxx
    console.log('SetPassword - Hash complet:', hash);
    
    // Extraire la partie après le ? dans le hash
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) {
      console.log('SetPassword - Pas de paramètres dans le hash');
      return { token: null, type: null, email: null };
    }
    
    const queryString = hash.substring(queryIndex + 1);
    console.log('SetPassword - Query string:', queryString);
    
    const params = new URLSearchParams(queryString);
    const token = params.get('token');
    const type = params.get('type');
    const email = params.get('email');
    
    console.log('SetPassword - Paramètres extraits:', { 
      token: token ? `${token.substring(0, 10)}...` : null, 
      type, 
      email 
    });
    
    return { token, type, email };
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log('SetPassword - Initialisation...');
        console.log('SetPassword - URL complète:', window.location.href);
        console.log('SetPassword - Hash:', window.location.hash);

        // Récupérer les paramètres depuis le hash (format HashRouter)
        const { token, type, email } = getHashParams();

        console.log('SetPassword - Token présent:', !!token);
        console.log('SetPassword - Type:', type);
        console.log('SetPassword - Email:', email);

        // Si on a un token de récupération, le vérifier via verifyOtp
        if (token && type === 'recovery') {
          console.log('SetPassword - Vérification du token via verifyOtp...');
          console.log('SetPassword - Token (premiers caractères):', token.substring(0, 20));
          
          try {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'recovery',
            });

            console.log('SetPassword - Résultat verifyOtp:', { 
              hasData: !!data, 
              hasSession: !!data?.session,
              hasUser: !!data?.user,
              error: verifyError?.message 
            });

            if (verifyError) {
              console.error('SetPassword - Erreur verifyOtp:', verifyError);
              // Ne pas afficher l'erreur immédiatement, essayer d'autres méthodes
            } else if (data?.session) {
              console.log('SetPassword - Session établie via verifyOtp');
              setIsValidSession(true);
              setLoading(false);
              return;
            }
          } catch (verifyErr) {
            console.error('SetPassword - Exception verifyOtp:', verifyErr);
          }
        }

        // Vérifier si une session existe déjà (cas où l'utilisateur est déjà connecté)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('SetPassword - Session existante:', !!session, 'Erreur:', sessionError?.message);

        if (session) {
          console.log('SetPassword - Session valide trouvée');
          setIsValidSession(true);
          setLoading(false);
          return;
        }

        // Écouter les événements d'authentification Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('SetPassword - Auth event:', event, 'Session:', !!session);
          
          if (event === 'PASSWORD_RECOVERY' && session) {
            console.log('SetPassword - Événement PASSWORD_RECOVERY détecté');
            setIsValidSession(true);
            setLoading(false);
          } else if (event === 'SIGNED_IN' && session) {
            console.log('SetPassword - Utilisateur connecté via SIGNED_IN');
            setIsValidSession(true);
            setLoading(false);
          }
        });

        // Attendre un peu pour voir si une session est établie
        setTimeout(async () => {
          const { data: { session: delayedSession } } = await supabase.auth.getSession();
          
          if (delayedSession) {
            console.log('SetPassword - Session trouvée après délai');
            setIsValidSession(true);
            setLoading(false);
          } else if (!isValidSession) {
            console.log('SetPassword - Aucune session trouvée après délai');
            setError('Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.');
            setLoading(false);
          }
        }, 2000);

        // Cleanup subscription on unmount
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

  // Affichage de l'erreur (lien invalide) - seulement si pas de session valide
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
