/**
 * Service d'authentification avec validation Zod intégrée
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Client, UserRole } from '../types';
import { SignUpSchema, SignInSchema, validateWithSchema } from '../validation/schemas';

/**
 * Interface pour les données d'inscription
 */
export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  age?: number;
  sex?: 'Homme' | 'Femme' | 'Autre';
  coachId?: string;
  affiliationCode?: string;
}

/**
 * Interface pour les erreurs d'authentification traduites
 */
export interface AuthErrorTranslated {
  code: string;
  message: string;
}

/**
 * Traduit les erreurs Firebase Auth en français
 */
const translateAuthError = (error: AuthError): AuthErrorTranslated => {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/operation-not-allowed': 'Opération non autorisée.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/user-not-found': 'Email ou mot de passe incorrect.',
    'auth/wrong-password': 'Email ou mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion internet.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  };

  return {
    code: error.code,
    message: errorMessages[error.code] || 'Une erreur inattendue est survenue.',
  };
};

/**
 * Crée un profil client par défaut
 */
const createDefaultClientProfile = (
  uid: string,
  email: string,
  firstName: string,
  lastName: string,
  role: UserRole,
  additionalData?: Partial<SignUpData>
): Omit<Client, 'id'> => {
  return {
    status: 'active',
    firstName,
    lastName,
    email,
    phone: additionalData?.phone || '',
    age: additionalData?.age || 0,
    sex: additionalData?.sex || 'Autre',
    registrationDate: new Date().toISOString().split('T')[0],
    role,
    coachId: additionalData?.coachId,
    affiliationCode: additionalData?.affiliationCode,
    objective: '',
    notes: '',
    medicalInfo: {
      history: '',
      allergies: '',
    },
    nutrition: {
      measurements: {},
      weightHistory: [],
      calorieHistory: [],
      macros: { protein: 0, carbs: 0, fat: 0 },
      historyLog: [],
      foodJournal: {},
    },
    bilans: [],
    performanceLog: [],
    assignedPrograms: [],
    savedPrograms: [],
    assignedNutritionPlans: [],
    grantedFormationIds: [],
    canUseWorkoutBuilder: role === 'coach' || role === 'admin',
  };
};

/**
 * Génère un code d'affiliation unique pour les coachs
 */
const generateAffiliationCode = async (): Promise<string> => {
  const clientsRef = collection(db, 'clients');
  let code: string;
  let exists = true;

  while (exists) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const q = query(clientsRef, where('affiliationCode', '==', code));
    const snapshot = await getDocs(q);
    exists = !snapshot.empty;
  }

  return code!;
};

/**
 * Inscription d'un nouvel utilisateur avec validation
 */
export const signUp = async (data: SignUpData): Promise<Client> => {
  // Validation des données avec Zod
  const validation = validateWithSchema(SignUpSchema, data);
  
  if (!validation.success) {
    throw new Error('errors' in validation ? validation.errors.join('\n') : 'Erreur de validation');
  }

  const validatedData = validation.data;

  try {
    // Créer l'utilisateur dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      validatedData.email,
      validatedData.password
    );

    const user = userCredential.user;

    // Mettre à jour le profil Firebase avec le nom
    await updateProfile(user, {
      displayName: `${validatedData.firstName} ${validatedData.lastName}`,
    });

    // Générer un code d'affiliation si c'est un coach
    let affiliationCode = validatedData.affiliationCode;
    if (validatedData.role === 'coach' && !affiliationCode) {
      affiliationCode = await generateAffiliationCode();
    }

    // Créer le profil client dans Firestore
    const clientProfile = createDefaultClientProfile(
      user.uid,
      validatedData.email,
      validatedData.firstName,
      validatedData.lastName,
      validatedData.role,
      { ...validatedData, affiliationCode }
    );

    const clientData: Client = {
      id: user.uid,
      ...clientProfile,
    };

    // Sauvegarder dans Firestore
    await setDoc(doc(db, 'clients', user.uid), clientData);

    return clientData;
  } catch (error) {
    const authError = error as AuthError;
    const translatedError = translateAuthError(authError);
    throw new Error(translatedError.message);
  }
};

/**
 * Connexion d'un utilisateur existant avec validation
 */
export const signIn = async (email: string, password: string): Promise<Client> => {
  // Validation des données avec Zod
  const validation = validateWithSchema(SignInSchema, { email, password });
  
  if (!validation.success) {
    throw new Error('errors' in validation ? validation.errors.join('\n') : 'Erreur de validation');
  }

  const validatedData = validation.data;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      validatedData.email,
      validatedData.password
    );
    const user = userCredential.user;

    // Récupérer le profil client depuis Firestore
    const clientDoc = await getDoc(doc(db, 'clients', user.uid));

    if (!clientDoc.exists()) {
      throw new Error('Profil utilisateur introuvable.');
    }

    return { id: clientDoc.id, ...clientDoc.data() } as Client;
  } catch (error) {
    const authError = error as AuthError;
    const translatedError = translateAuthError(authError);
    throw new Error(translatedError.message);
  }
};

/**
 * Déconnexion de l'utilisateur
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    const authError = error as AuthError;
    const translatedError = translateAuthError(authError);
    throw new Error(translatedError.message);
  }
};

/**
 * Écoute les changements d'état d'authentification
 */
export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Récupère le profil client complet depuis Firestore
 */
export const getClientProfile = async (uid: string): Promise<Client | null> => {
  try {
    const clientDoc = await getDoc(doc(db, 'clients', uid));
    if (!clientDoc.exists()) {
      return null;
    }
    return { id: clientDoc.id, ...clientDoc.data() } as Client;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return null;
  }
};

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    const authError = error as AuthError;
    const translatedError = translateAuthError(authError);
    throw new Error(translatedError.message);
  }
};

/**
 * Met à jour l'email de l'utilisateur
 */
export const updateUserEmail = async (newEmail: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Aucun utilisateur connecté.');
    }
    await updateEmail(auth.currentUser, newEmail);
  } catch (error) {
    const authError = error as AuthError;
    const translatedError = translateAuthError(authError);
    throw new Error(translatedError.message);
  }
};

/**
 * Met à jour le mot de passe de l'utilisateur
 */
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Aucun utilisateur connecté.');
    }
    await updatePassword(auth.currentUser, newPassword);
  } catch (error) {
    const authError = error as AuthError;
    const translatedError = translateAuthError(authError);
    throw new Error(translatedError.message);
  }
};

/**
 * Récupère l'utilisateur Firebase actuellement connecté
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};
