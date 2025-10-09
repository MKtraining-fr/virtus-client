import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import { Client } from '../types';
import { ArrowLeftIcon } from '../constants/icons';
import { resetPassword } from '../services/authService';

const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'coach' | 'client'>('client');
  const [affiliationCode, setAffiliationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const { login, register, clients, isDataLoading, dataError } = useAuth();
  const location = useLocation();

  const isFormDisabled = isLoading || isDataLoading;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleFromQuery = params.get('role');
    if (roleFromQuery === 'coach' || roleFromQuery === 'client') {
      setIsLoginView(false);
      setRole(roleFromQuery);
    } else {
      setIsLoginView(true);
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    console.log('Formulaire soumis !');
    console.log('Email:', email);
    console.log('Password:', password ? '*****' : 'vide');
    console.log('FirstName:', firstName);
    console.log('LastName:', lastName);
    console.log('Role:', role);
    console.log('AffiliationCode:', affiliationCode);
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!forgotPasswordEmail) {
        throw new Error('Veuillez saisir votre adresse email.');
      }
      
      // Valider le format de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(forgotPasswordEmail)) {
        throw new Error('Veuillez saisir une adresse email valide.');
      }
      
      await resetPassword(forgotPasswordEmail);
      setForgotPasswordSuccess(true);
    } catch (err: any) {
      console.error('Erreur lors de la réinitialisation:', err);
      
      // Gérer les erreurs spécifiques
      let errorMessage = 'Une erreur est survenue.';
      
      if (err?.message) {
        if (err.message.includes('rate limit')) {
          errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
        } else if (err.message.includes('SMTP')) {
          errorMessage = 'Le service d\'envoi d\'emails n\'est pas configuré. Veuillez contacter l\'administrateur.';
        } else if (err.message.includes('not found')) {
          // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
          // On affiche quand même un message de succès
          setForgotPasswordSuccess(true);
          return;
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-light-bg">
      <div className="relative w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <Link to="/" className="absolute top-4 left-4 text-gray-500 hover:text-primary transition-colors" aria-label="Retour à l'accueil" title="Retour à l'accueil">
            <ArrowLeftIcon className="w-6 h-6" />
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isLoginView ? 'Connexion à Virtus' : 'Créer un compte'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isLoginView ? 'Pas encore de compte ?' : 'Vous avez déjà un compte ?'}{" "}
            <button
              onClick={() => { setIsLoginView(!isLoginView); setError(''); }}
              className="font-medium text-primary hover:underline"
            >
              {isLoginView ? 'Inscrivez-vous' : 'Connectez-vous'}
            </button>
          </p>
        </div>

        <div className="space-y-4">
          {isDataLoading && (
            <div className="p-3 text-sm text-blue-700 bg-blue-50 rounded-md">
              Chargement des données distantes...
            </div>
          )}
          {dataError && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
              {dataError}
            </div>
          )}
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {!isLoginView && (
            <>
              <div className="flex gap-4">
                <Input
                  label="Prénom"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isFormDisabled}
                />
                <Input
                  label="Nom"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isFormDisabled}
                />
              </div>
               <Select label="Je suis un" id="role" value={role} onChange={(e) => setRole(e.target.value as 'coach' | 'client')} disabled={isFormDisabled}>
                    <option value="client">Client / Pratiquant</option>
                    <option value="coach">Coach</option>
                </Select>
                 {role === 'client' && (
                    <Input
                        label="Code d'affiliation (optionnel)"
                        id="affiliationCode"
                        value={affiliationCode}
                        onChange={(e) => setAffiliationCode(e.target.value)}
                        placeholder="Code à 6 chiffres"
                        maxLength={6}
                        pattern="\\d{6}"
                        title="Le code doit contenir 6 chiffres."
                        disabled={isFormDisabled}
                    />
                 )}
            </>
          )}

          <Input
            label="Adresse Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isFormDisabled}
          />

          <Input
            label="Mot de passe"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isLoginView ? "current-password" : "new-password"}
            disabled={isFormDisabled}
          />

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
             {!isLoginView ? (
                <div className="flex items-center gap-4">
                    <Button type="button" variant="secondary" className="w-full" onClick={() => { setIsLoginView(true); setError(''); }} disabled={isFormDisabled}>
                        Retour
                    </Button>
                    <Button type="submit" className="w-full" disabled={isFormDisabled}>
                        {isLoading ? 'Chargement...' : "S'inscrire"}
                    </Button>
                </div>
            ) : (
                <>
                  <Button type="submit" className="w-full" disabled={isFormDisabled}>
                      {isLoading ? 'Chargement...' : 'Se connecter'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline mt-2 w-full text-center"
                  >
                    Mot de passe oublié ?
                  </button>
                </>
            )}
          </div>
        </form>

        {/* Modal Mot de passe oublié */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              {!forgotPasswordSuccess ? (
                <>
                  <h3 className="text-xl font-semibold mb-4">Réinitialiser le mot de passe</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                  </p>
                  <form onSubmit={handleForgotPassword}>
                    <Input
                      label="Adresse Email"
                      id="forgot-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                    <div className="flex gap-4 mt-6">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotPasswordEmail('');
                          setError('');
                        }}
                        disabled={isLoading}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Envoi...' : 'Envoyer'}
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-4 text-green-600">Email envoyé !</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Un email contenant un lien de réinitialisation a été envoyé à <strong>{forgotPasswordEmail}</strong>.
                  </p>
                  <p className="text-sm text-gray-600 mb-6">
                    Veuillez vérifier votre boîte de réception et suivre les instructions.
                  </p>
                  <Button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordSuccess(false);
                      setForgotPasswordEmail('');
                      setError('');
                    }}
                    className="w-full"
                  >
                    Fermer
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;

