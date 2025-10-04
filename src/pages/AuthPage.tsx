import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

    try {
      if (!isLoginView) {
        if (isDataLoading) {
          throw new Error('Les données nécessaires sont encore en cours de chargement. Veuillez patienter.');
        }
        if (dataError) {
          throw new Error("La création de compte est momentanément indisponible. Veuillez réessayer plus tard.");
        }
      }

      if (isLoginView) {
        await login(email, password);
        // La navigation est gérée dans la fonction de connexion
      } else {
        // Validation de base
        if (!firstName || !lastName || !email || !password) {
            throw new Error("Tous les champs sont requis.");
        }
        const newUser: Omit<Client, 'id'> = {
            firstName,
            lastName,
            email,
            password,
            role,
            status: 'active', // Statut par défaut
            age: 0, // Devrait être collecté dans un formulaire plus détaillé
            sex: 'Homme',
            phone: '',
            registrationDate: new Date().toISOString().split('T')[0],
            objective: '',
            notes: '',
            medicalInfo: { history: '', allergies: '' },
            nutrition: { measurements: {}, weightHistory: [], calorieHistory: [], macros: { protein: 0, carbs: 0, fat: 0 }, historyLog: [] },
            performanceLog: [],
            assignedPrograms: [],
        };
        
        if (role === 'client' && affiliationCode) {
             if (!/^\d{6}$/.test(affiliationCode)) {
                throw new Error("Le code d'affiliation doit être composé de 6 chiffres.");
            }
            const coach = clients.find(
              (user) => user.role === 'coach' && user.affiliationCode === affiliationCode
            );
            if (coach) {
              newUser.coachId = coach.id;
            } else {
              throw new Error("Code d'affiliation invalide.");
            }
        }
        
        await register(newUser);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
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
            {isLoginView ? 'Pas encore de compte ?' : 'Vous avez déjà un compte ?'}{' '}
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
                <Button type="submit" className="w-full" disabled={isFormDisabled}>
                    {isLoading ? 'Chargement...' : 'Se connecter'}
                </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;