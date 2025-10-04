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
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (user: Omit<Client, 'id'>) => Promise<void>;
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
const USER_SESSION_KEY = 'virtus_user';
const ORIGINAL_USER_SESSION_KEY = 'virtus_original_user';

const createDefaultClient = (id: string): Client => ({
  id,
  status: 'prospect',
  firstName: '',
  lastName: '',
  email: '',
  password: undefined,
  phone: '',
  age: 0,
  sex: 'Autre',
  registrationDate: new Date().toISOString().split('T')[0],
  role: 'client',
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
  canUseWorkoutBuilder: true,
});

const mergeClient = (base: Client, overrides: Partial<Client>): Client => ({
  ...base,
  ...overrides,
  medicalInfo: {
    ...base.medicalInfo,
    ...(overrides.medicalInfo ?? {}),
  },
  nutrition: {
    ...base.nutrition,
    ...(overrides.nutrition ?? {}),
    measurements: {
      ...base.nutrition.measurements,
      ...(overrides.nutrition?.measurements ?? {}),
    },
    macros: {
      ...base.nutrition.macros,
      ...(overrides.nutrition?.macros ?? {}),
    },
    historyLog: overrides.nutrition?.historyLog ?? base.nutrition.historyLog,
    foodJournal: {
      ...base.nutrition.foodJournal,
      ...(overrides.nutrition?.foodJournal ?? {}),
    },
  },
  bilans: overrides.bilans ?? base.bilans,
  performanceLog: overrides.performanceLog ?? base.performanceLog,
  assignedPrograms: overrides.assignedPrograms ?? base.assignedPrograms,
  savedPrograms: overrides.savedPrograms ?? base.savedPrograms,
  assignedNutritionPlans: overrides.assignedNutritionPlans ?? base.assignedNutritionPlans,
  grantedFormationIds: overrides.grantedFormationIds ?? base.grantedFormationIds,
  canUseWorkoutBuilder: overrides.canUseWorkoutBuilder ?? base.canUseWorkoutBuilder,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem(USER_SESSION_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });
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
  const [dataError, setDataError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(USER_SESSION_KEY);
      }
      if (originalUser) {
        sessionStorage.setItem(ORIGINAL_USER_SESSION_KEY, JSON.stringify(originalUser));
      } else {
        sessionStorage.removeItem(ORIGINAL_USER_SESSION_KEY);
      }
    } catch (error) {
      console.error('Failed to persist session state', error);
    }
  }, [user, originalUser]);

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
    [db],
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
  }, [db]);

  const buildClientForCreation = useCallback(
    (id: string, userData: Partial<Client>) => {
      if (!userData.email) {
        throw new Error("L'email est requis pour créer un utilisateur.");
      }
      if (!userData.firstName) {
        throw new Error('Le prénom est requis pour créer un utilisateur.');
      }
      if (!userData.lastName) {
        throw new Error('Le nom est requis pour créer un utilisateur.');
      }
      const role = userData.role ?? 'client';
      let affiliationCode = userData.affiliationCode;
      if (role === 'coach' && !affiliationCode) {
        const existingCodes = new Set(clients.filter((client) => client.affiliationCode).map((client) => client.affiliationCode));
        let generated = '';
        do {
          generated = Math.floor(100000 + Math.random() * 900000).toString();
        } while (existingCodes.has(generated));
        affiliationCode = generated;
      }

      const defaultClient = createDefaultClient(id);
      const password = userData.password || Math.random().toString(36).slice(-8);

      return mergeClient(defaultClient, {
        ...userData,
        id,
        email: userData.email.trim(),
        role,
        password,
        affiliationCode,
        status: userData.status ?? defaultClient.status,
      });
    },
    [clients],
  );

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
      const normalizedEmail = email.trim().toLowerCase();
      const usersRef = collection(db, 'users');
      const existingUsers = await getDocs(query(usersRef, where('emailLowercase', '==', normalizedEmail)));
      if (existingUsers.empty) {
        throw new Error('Email ou mot de passe invalide.');
      }
      const userDoc = existingUsers.docs[0];
      const data = userDoc.data() as Client & { emailLowercase?: string };
      if (data.password !== password) {
        throw new Error('Email ou mot de passe invalide.');
      }
      const authenticatedUser = clients.find((client) => client.id === userDoc.id) ?? {
        ...data,
        id: userDoc.id,
      };
      setUser(authenticatedUser);
      setOriginalUser(null);
      navigate('/app');
    },
    [clients, navigate, db],
  );

  const addUser = useCallback(
    async (userData: Partial<Client>): Promise<Client> => {
      if (!userData.email || !userData.firstName || !userData.lastName || !userData.role) {
        throw new Error("Le Prénom, le Nom, l'Email et le Rôle sont requis pour créer un utilisateur.");
      }

      const normalizedEmail = userData.email.trim().toLowerCase();
      const usersRef = collection(db, 'users');
      const existing = await getDocs(query(usersRef, where('emailLowercase', '==', normalizedEmail)));
      if (!existing.empty) {
        throw new Error('Un utilisateur avec cet email existe déjà.');
      }

      const clientsRef = collection(db, 'clients');
      const clientDoc = userData.id ? doc(clientsRef, userData.id) : doc(clientsRef);
      const id = clientDoc.id;
      const clientToCreate = buildClientForCreation(id, { ...userData, id });

      await setDoc(clientDoc, clientToCreate);
      await setDoc(doc(usersRef, id), {
        ...clientToCreate,
        emailLowercase: normalizedEmail,
      });

      return clientToCreate;
    },
    [buildClientForCreation, db],
  );

  const register = useCallback(
    async (newUser: Omit<Client, 'id'>): Promise<void> => {
      const createdUser = await addUser({ ...newUser, status: newUser.status ?? 'active' });
      setUser(createdUser);
      setOriginalUser(null);
      navigate('/app');
    },
    [addUser, navigate],
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
    [db],
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

  const logout = useCallback(() => {
    setUser(null);
    setOriginalUser(null);
    navigate('/');
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

  return <AuthContext.Provider value={value}>{isInitialized ? children : null}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
