import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal'; // Importation du composant Modal
import { SignUpSchema } from '../validation/schemas'; // Importation du schéma de validation pour les exigences de mot de passe
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import { Client } from '../types';
import { ArrowLeftIcon } from '../constants/icons';


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
  const [showSignUpSuccess, setShowSignUpSuccess] = useState(false); // État pour la modale de succès d'inscription
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
    setError("");
    setIsLoading(true);

    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        const signUpData = {
          email,
          password,
          firstName,
          lastName,
          role,
          affiliationCode: affiliationCode.trim() ? affiliationCode : undefined,
          coachId: undefined, // Ajout explicite de coachId comme undefined pour les inscriptions directes
        };
        await register(signUpData);
        setShowSignUpSuccess(true); // Afficher la modale de succès après l'inscription
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setAffiliationCode('');
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Une erreur inconnue est survenue.');
      console.error("Erreur lors de la soumission du formulaire:", error);
      setError(error.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
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
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Une erreur inconnue est survenue.');
      console.error('Erreur lors de la réinitialisation:', error);
      
      // Gérer les erreurs spécifiques
      let errorMessage = 'Une erreur est survenue.';
      
      if (error.message) {
        if (error.message.includes('rate limit')) {
          errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
        } else if (error.message.includes('SMTP')) {
          errorMessage = 'Le service d\'envoi d\'emails n\'est pas configuré. Veuillez contacter l\'administrateur.';
        } else if (error.message.includes('not found')) {
          // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
          // On affiche quand même un message de succès
          setForgotPasswordSuccess(true);
          return;
        } else {
          errorMessage = error.message;
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
                        pattern="^$|\\d{6}" // Permet un champ vide ou 6 chiffres
                        title="Le code doit contenir 6 chiffres ou être vide."
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
	          
	          {!isLoginView && (
	            <div className="text-sm text-gray-500 mt-[-10px] p-2 bg-gray-50 rounded-md border border-gray-200">
	              <p className="font-semibold mb-1 text-gray-700">Exigences du mot de passe :</p>
	              <ul className="list-disc list-inside ml-2 grid grid-cols-2 gap-x-4 text-xs">
	                <li className={password.length >= 8 ? "text-green-600" : "text-red-500"}>Au moins 8 caractères</li>
	                <li className={/[A-Z]/.test(password) ? "text-green-600" : "text-red-500"}>Au moins une majuscule</li>
	                <li className={/[a-z]/.test(password) ? "text-green-600" : "text-red-500"}>Au moins une minuscule</li>
	                <li className={/[0-9]/.test(password) ? "text-green-600" : "text-red-500"}>Au moins un chiffre</li>
	                <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-600" : "text-red-500"}>Au moins un caractère spécial</li>
	              </ul>
	            </div>
	          )}

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
	
	        {/* Modale de succès d'inscription */}
	        <Modal isOpen={showSignUpSuccess} onClose={() => setShowSignUpSuccess(false)} title="Inscription réussie !">
	            <div className="text-center p-4">
	                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
	                <p className="text-lg font-semibold text-gray-800 mb-2">Bienvenue chez Virtus !</p>
	                <p className="text-sm text-gray-600 mb-4">
	                    Un email de confirmation a été envoyé à <strong>{email}</strong>.
	                    Veuillez cliquer sur le lien dans cet email pour valider votre compte.
	                </p>
	                <Button onClick={() => { setShowSignUpSuccess(false); setIsLoginView(true); setEmail(''); setPassword(''); setFirstName(''); setLastName(''); setAffiliationCode(''); }}>
	                    Se connecter
	                </Button>
	            </div>
	        </Modal>

          <div>
             {!isLoginView ? (
                <div className="flex items-center gap-4">
                    <Button type="button" variant="secondary" className="w-full" onClick={() => { setIsLoginView(true); setError(''); }} disabled={isFormDisabled}>
                        Retour
                    </Button>
                    <Button type="submit" className="w-full" disabled={isFormDisabled}>
                        {isFormDisabled ? 'Bouton désactivé' : (isLoading ? 'Chargement...' : "S'inscrire")}
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
