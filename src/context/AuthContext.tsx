import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Client,
  Exercise,
  WorkoutProgram,
  WorkoutSession,
  NutritionPlan,
  Message,
  ClientFormation,
  ProfessionalFormation,
  Notification,
  FoodItem,
  BilanTemplate,
  Partner,
  Product,
  IntensificationTechnique,
  Meal,
} from '../types';
import { db } from '../services/firebase';
import {
  signIn,
  signUp,
  signOutUser,
  onAuthStateChange,
  getClientProfile,
  SignUpData,
} from '../services/authService';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  DocumentData,
  Unsubscribe,
  QuerySnapshot,
} from 'firebase/firestore';

export type User = Client;

interface AuthContextType {
  user: User | null;
  originalUser: User | null;
  theme: 'light' | 'dark';
  clients: Client[];
  exercises: Exercise[];
  programs: WorkoutProgram[];
  sessions: WorkoutSession[];
  nutritionPlans: NutritionPlan[];
  messages: Message[];
  clientFormations: ClientFormation[];
  professionalFormations: ProfessionalFormation[];
  notifications: Notification[];
  foodItems: FoodItem[];
  bilanTemplates: BilanTemplate[];
  partners: Partner[];
  products: Product[];
  intensificationTechniques: IntensificationTechnique[];
  recipes: Meal[];
  meals: Meal[];
  isDataLoading: boolean;
  dataError: string | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: SignUpData) => Promise<void>;
  addUser: (userData: Partial<Client>) => Promise<Client>;
  setClients: (clients: Client[]) => void;
  setExercises: (exercises: Exercise[]) => void;
  setPrograms: (programs: WorkoutProgram[]) => void;
  setSessions: (sessions: WorkoutSession[]) => void;
  setNutritionPlans: (plans: NutritionPlan[]) => void;
  setMessages: (messages: Message[]) => void;
  setClientFormations: (formations: ClientFormation[]) => void;
  setProfessionalFormations: (formations: ProfessionalFormation[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setFoodItems: (foodItems: FoodItem[]) => void;
  setBilanTemplates: (templates: BilanTemplate[]) => void;
  setPartners: (partners: Partner[]) => void;
  setProducts: (products: Product[]) => void;
  setIntensificationTechniques: (techniques: IntensificationTechnique[]) => void;
  setRecipes: (recipes: Meal[]) => void;
  setMeals: (meals: Meal[]) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => Promise<void>;
  impersonate: (userId: string) => void;
  stopImpersonating: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const THEME_KEY = 'virtus_theme';
const ORIGINAL_USER_SESSION_KEY = 'virtus_original_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem(ORIGINAL_USER_SESSION_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === 'light' ? 'light' : 'dark';
  });

  const [clients, setClientsState] = useState<Client[]>([]);
  const [exercises, setExercisesState] = useState<Exercise[]>([]);
  const [programs, setProgramsState] = useState<WorkoutProgram[]>([]);
  const [sessions, setSessionsState] = useState<WorkoutSession[]>([]);
  const [nutritionPlans, setNutritionPlansState] = useState<NutritionPlan[]>([]);
  const [messages, setMessagesState] = useState<Message[]>([]);
  const [clientFormations, setClientFormationsState] = useState<ClientFormation[]>([]);
  const [professionalFormations, setProfessionalFormationsState] = useState<ProfessionalFormation[]>([]);
  const [notifications, setNotificationsState] = useState<Notification[]>([]);
  const [foodItems, setFoodItemsState] = useState<FoodItem[]>([]);
  const [bilanTemplates, setBilanTemplatesState] = useState<BilanTemplate[]>([]);
  const [partners, setPartnersState] = useState<Partner[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);
  const [intensificationTechniques, setIntensificationTechniquesState] = useState<IntensificationTechnique[]>([]);
  const [recipes, setRecipesState] = useState<Meal[]>([]);
  const [meals, setMealsState] = useState<Meal[]>([]);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Écouter les changements d'authentification Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setIsAuthLoading(true);
      if (firebaseUser) {
        // Récupérer le profil complet depuis Firestore
        const clientProfile = await getClientProfile(firebaseUser.uid);
        if (clientProfile) {
          setUser(clientProfile);
        } else {
          console.error('Profil client introuvable pour l\'utilisateur:', firebaseUser.uid);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      if (originalUser) {
        sessionStorage.setItem(ORIGINAL_USER_SESSION_KEY, JSON.stringify(originalUser));
      } else {
        sessionStorage.removeItem(ORIGINAL_USER_SESSION_KEY);
      }
    } catch (error) {
      console.error('Failed to persist session state', error);
    }
  }, [originalUser]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.error('Failed to persist theme preference', error);
    }
  }, [theme]);

  const persistCollectionChanges = useCallback(
    async <T extends { id?: string }>(collectionName: string, previousItems: T[], nextItems: T[]) => {
      const validNextItems = nextItems.filter((item): item is T & { id: string } => Boolean(item.id));
      const collectionRef = collection(db, collectionName);
      const batch = writeBatch(db);

      const nextIds = new Set(validNextItems.map((item) => item.id));
      validNextItems.forEach((item) => {
        batch.set(doc(collectionRef, item.id), item as unknown as DocumentData);
      });

      previousItems.forEach((item) => {
        const itemId = item.id;
        if (itemId && !nextIds.has(itemId)) {
          batch.delete(doc(collectionRef, itemId));
        }
      });

      await batch.commit();
    },
    [],
  );

  useEffect(() => {
    let isActive = true;
    const unsubscribers: Unsubscribe[] = [];

    const mapSnapshot = <T,>(snapshot: QuerySnapshot<DocumentData>) =>
      snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as T) })) as T[];

    const loadCollection = async <T,>(collectionName: string, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
      const collectionRef = collection(db, collectionName);
      const initialSnapshot = await getDocs(collectionRef);
      if (isActive) {
        setter(mapSnapshot<T>(initialSnapshot));
      }
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          if (!isActive) {
            return;
          }
          setter(mapSnapshot<T>(snapshot));
        },
        (error) => {
          console.error(`Failed to subscribe to Firestore collection "${collectionName}"`, error);
          if (isActive) {
            setDataError(error.message ?? 'Une erreur inattendue est survenue lors du chargement des données.');
          }
        },
      );
      unsubscribers.push(unsubscribe);
    };

    const initialize = async () => {
      try {
        setIsDataLoading(true);
        setDataError(null);
        await Promise.all([
          loadCollection<Client>('clients', setClientsState),
          loadCollection<Exercise>('exercises', setExercisesState),
          loadCollection<WorkoutProgram>('programs', setProgramsState),
          loadCollection<WorkoutSession>('sessions', setSessionsState),
          loadCollection<NutritionPlan>('nutritionPlans', setNutritionPlansState),
          loadCollection<Message>('messages', setMessagesState),
          loadCollection<ClientFormation>('clientFormations', setClientFormationsState),
          loadCollection<ProfessionalFormation>('professionalFormations', setProfessionalFormationsState),
          loadCollection<Notification>('notifications', setNotificationsState),
          loadCollection<FoodItem>('foodItems', setFoodItemsState),
          loadCollection<BilanTemplate>('bilanTemplates', setBilanTemplatesState),
          loadCollection<Partner>('partners', setPartnersState),
          loadCollection<Product>('products', setProductsState),
          loadCollection<IntensificationTechnique>('intensificationTechniques', setIntensificationTechniquesState),
          loadCollection<Meal>('recipes', setRecipesState),
          loadCollection<Meal>('meals', setMealsState),
        ]);
      } catch (error) {
        console.error('Failed to load data from Firestore', error);
        if (isActive) {
          setDataError(error instanceof Error ? error.message : 'Une erreur inattendue est survenue.');
        }
      } finally {
        if (isActive) {
          setIsDataLoading(false);
          setIsInitialized(true);
        }
      }
    };

    void initialize();

    return () => {
      isActive = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  }, []);

  const setClients = useCallback(
    (updatedClients: Client[]) => {
      setClientsState(updatedClients);
      void persistCollectionChanges('clients', clients, updatedClients);
      if (user) {
        const updatedUser = updatedClients.find((client) => client.id === user.id) || null;
        setUser(updatedUser);
      }
      if (originalUser) {
        const updatedOriginalUser = updatedClients.find((client) => client.id === originalUser.id) || null;
        setOriginalUser(updatedOriginalUser);
      }
    },
    [clients, persistCollectionChanges, user, originalUser],
  );

  const setExercises = useCallback(
    (updatedExercises: Exercise[]) => {
      setExercisesState(updatedExercises);
      void persistCollectionChanges('exercises', exercises, updatedExercises);
    },
    [exercises, persistCollectionChanges],
  );

  const setPrograms = useCallback(
    (updatedPrograms: WorkoutProgram[]) => {
      setProgramsState(updatedPrograms);
      void persistCollectionChanges('programs', programs, updatedPrograms);
    },
    [programs, persistCollectionChanges],
  );

  const setSessions = useCallback(
    (updatedSessions: WorkoutSession[]) => {
      setSessionsState(updatedSessions);
      void persistCollectionChanges('sessions', sessions, updatedSessions);
    },
    [sessions, persistCollectionChanges],
  );

  const setNutritionPlans = useCallback(
    (updatedPlans: NutritionPlan[]) => {
      setNutritionPlansState(updatedPlans);
      void persistCollectionChanges('nutritionPlans', nutritionPlans, updatedPlans);
    },
    [nutritionPlans, persistCollectionChanges],
  );

  const setMessages = useCallback(
    (updatedMessages: Message[]) => {
      setMessagesState(updatedMessages);
      void persistCollectionChanges('messages', messages, updatedMessages);
    },
    [messages, persistCollectionChanges],
  );

  const setClientFormations = useCallback(
    (updatedFormations: ClientFormation[]) => {
      setClientFormationsState(updatedFormations);
      void persistCollectionChanges('clientFormations', clientFormations, updatedFormations);
    },
    [clientFormations, persistCollectionChanges],
  );

  const setProfessionalFormations = useCallback(
    (updatedFormations: ProfessionalFormation[]) => {
      setProfessionalFormationsState(updatedFormations);
      void persistCollectionChanges('professionalFormations', professionalFormations, updatedFormations);
    },
    [professionalFormations, persistCollectionChanges],
  );

  const setNotifications = useCallback(
    (updatedNotifications: Notification[]) => {
      setNotificationsState(updatedNotifications);
      void persistCollectionChanges('notifications', notifications, updatedNotifications);
    },
    [notifications, persistCollectionChanges],
  );

  const setFoodItems = useCallback(
    (updatedFoodItems: FoodItem[]) => {
      setFoodItemsState(updatedFoodItems);
      void persistCollectionChanges('foodItems', foodItems, updatedFoodItems);
    },
    [foodItems, persistCollectionChanges],
  );

  const setBilanTemplates = useCallback(
    (updatedTemplates: BilanTemplate[]) => {
      setBilanTemplatesState(updatedTemplates);
      void persistCollectionChanges('bilanTemplates', bilanTemplates, updatedTemplates);
    },
    [bilanTemplates, persistCollectionChanges],
  );

  const setPartners = useCallback(
    (updatedPartners: Partner[]) => {
      setPartnersState(updatedPartners);
      void persistCollectionChanges('partners', partners, updatedPartners);
    },
    [partners, persistCollectionChanges],
  );

  const setProducts = useCallback(
    (updatedProducts: Product[]) => {
      setProductsState(updatedProducts);
      void persistCollectionChanges('products', products, updatedProducts);
    },
    [products, persistCollectionChanges],
  );

  const setIntensificationTechniques = useCallback(
    (updatedTechniques: IntensificationTechnique[]) => {
      setIntensificationTechniquesState(updatedTechniques);
      void persistCollectionChanges('intensificationTechniques', intensificationTechniques, updatedTechniques);
    },
    [intensificationTechniques, persistCollectionChanges],
  );

  const setRecipes = useCallback(
    (updatedRecipes: Meal[]) => {
      setRecipesState(updatedRecipes);
      void persistCollectionChanges('recipes', recipes, updatedRecipes);
    },
    [recipes, persistCollectionChanges],
  );

  const setMeals = useCallback(
    (updatedMeals: Meal[]) => {
      setMealsState(updatedMeals);
      void persistCollectionChanges('meals', meals, updatedMeals);
    },
    [meals, persistCollectionChanges],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        setIsAuthLoading(true);
        await signIn(email, password);
        // L'utilisateur sera automatiquement défini par onAuthStateChange
        navigate('/app');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
        console.error('Erreur lors de la connexion:', error);
        throw new Error(errorMessage);
      } finally {
        setIsAuthLoading(false);
      }
    },
    [navigate],
  );

  const register = useCallback(
    async (userData: SignUpData): Promise<void> => {
      try {
        setIsAuthLoading(true);
        await signUp(userData);
        // L'utilisateur sera automatiquement défini par onAuthStateChange
        navigate('/app');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'inscription';
        console.error('Erreur lors de l\'inscription:', error);
        throw new Error(errorMessage);
      } finally {
        setIsAuthLoading(false);
      }
    },
    [navigate],
  );

  const addUser = useCallback(
    async (userData: Partial<Client>): Promise<Client> => {
      if (!userData.email || !userData.firstName || !userData.lastName || !userData.role) {
        throw new Error("Le Prénom, le Nom, l'Email et le Rôle sont requis pour créer un utilisateur.");
      }

      // Pour créer un utilisateur depuis l'admin, on utilise un mot de passe temporaire
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      
      const signUpData: SignUpData = {
        email: userData.email,
        password: tempPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        phone: userData.phone,
        age: userData.age,
        sex: userData.sex,
        coachId: userData.coachId,
        affiliationCode: userData.affiliationCode,
      };

      const newClient = await signUp(signUpData);
      
      // TODO: Envoyer un email de réinitialisation de mot de passe au nouvel utilisateur
      
      return newClient;
    },
    [],
  );

  const addNotification = useCallback(
    async (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => {
      const notificationsRef = collection(db, 'notifications');
      const notificationDoc = doc(notificationsRef);
      const newNotification: Notification = {
        ...notification,
        id: notificationDoc.id,
        isRead: false,
        timestamp: new Date().toISOString(),
      };
      await setDoc(notificationDoc, newNotification);
    },
    [],
  );

  const impersonate = useCallback(
    (userId: string) => {
      const targetUser = clients.find((client) => client.id === userId);
      if (targetUser && user && user.role === 'admin' && user.id !== targetUser.id) {
        setOriginalUser(user);
        setUser(targetUser);
      }
    },
    [clients, user],
  );

  const stopImpersonating = useCallback(() => {
    if (originalUser) {
      setUser(originalUser);
      setOriginalUser(null);
    }
  }, [originalUser]);

  const logout = useCallback(async () => {
    try {
      await signOutUser();
      setUser(null);
      setOriginalUser(null);
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      originalUser,
      theme,
      clients,
      exercises,
      programs,
      sessions,
      nutritionPlans,
      messages,
      clientFormations,
      professionalFormations,
      notifications,
      foodItems,
      bilanTemplates,
      partners,
      products,
      intensificationTechniques,
      recipes,
      meals,
      isDataLoading,
      dataError,
      isAuthLoading,
      login,
      logout,
      register,
      addUser,
      setClients,
      setExercises,
      setPrograms,
      setSessions,
      setNutritionPlans,
      setMessages,
      setClientFormations,
      setProfessionalFormations,
      setNotifications,
      setFoodItems,
      setBilanTemplates,
      setPartners,
      setProducts,
      setIntensificationTechniques,
      setRecipes,
      setMeals,
      addNotification,
      impersonate,
      stopImpersonating,
      setTheme,
    }),
    [
      user,
      originalUser,
      theme,
      clients,
      exercises,
      programs,
      sessions,
      nutritionPlans,
      messages,
      clientFormations,
      professionalFormations,
      notifications,
      foodItems,
      bilanTemplates,
      partners,
      products,
      intensificationTechniques,
      recipes,
      meals,
      isDataLoading,
      dataError,
      isAuthLoading,
      login,
      logout,
      register,
      addUser,
      setClients,
      setExercises,
      setPrograms,
      setSessions,
      setNutritionPlans,
      setMessages,
      setClientFormations,
      setProfessionalFormations,
      setNotifications,
      setFoodItems,
      setBilanTemplates,
      setPartners,
      setProducts,
      setIntensificationTechniques,
      setRecipes,
      setMeals,
      addNotification,
      impersonate,
      stopImpersonating,
      setTheme,
    ],
  );

  return <AuthContext.Provider value={value}>{isInitialized && !isAuthLoading ? children : null}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
