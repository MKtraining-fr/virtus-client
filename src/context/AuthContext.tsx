import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
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
import { supabase } from '../services/supabase';
import {
  signIn,
  signUp,
  signOutUser,
  onAuthStateChange,
  getClientProfile,
  SignUpData,
} from '../services/authService';
import { logger } from '../utils/logger';
import {
  mapSupabaseClientToClient,
  mapSupabaseExerciseToExercise,
  mapSupabaseProgramToProgram,
  mapSupabaseNutritionPlanToNutritionPlan,
  mapSupabaseMessageToMessage,
  mapSupabaseNotificationToNotification,
  mapClientToSupabaseClient,
} from '../services/typeMappers';

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

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (supabaseUser) => {
      setIsAuthLoading(true);
      if (supabaseUser) {
        const clientProfile = await getClientProfile(supabaseUser.id);
        if (clientProfile) {
          setUser(clientProfile);
        } else {
          logger.error('Profil client introuvable', { userId: supabaseUser.id });
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Charger les données depuis Supabase
  useEffect(() => {
    if (!user || isAuthLoading) {
      setIsDataLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsDataLoading(true);
        setDataError(null);

        console.log('[AuthContext] Chargement des données...', { userId: user?.id, userEmail: user?.email });

        // Charger toutes les données en parallèle
        const [
          clientsData,
          exercisesData,
          programsData,
          sessionsData,
          nutritionPlansData,
          messagesData,
          notificationsData,
          foodItemsData,
        ] = await Promise.all([
          supabase.from('clients').select('*'),
          supabase.from('exercises').select('*'),
          supabase.from('programs').select('*'),
          supabase.from('sessions').select('*'),
          supabase.from('nutrition_plans').select('*'),
          supabase.from('messages').select('*'),
          supabase.from('notifications').select('*'),
          supabase.from('food_items').select('*'),
        ]);

        console.log('[AuthContext] Données clients chargées:', {
          count: clientsData.data?.length || 0,
          error: clientsData.error,
          data: clientsData.data
        });

        if (clientsData.error) {
          console.error('[AuthContext] Erreur de chargement des clients:', clientsData.error);
        }

        if (clientsData.data) {
          const mappedClients = clientsData.data.map(mapSupabaseClientToClient);
          console.log('[AuthContext] Clients mappés:', mappedClients);
          setClientsState(mappedClients);
        }
        if (exercisesData.data) {
          setExercisesState(exercisesData.data.map(mapSupabaseExerciseToExercise));
        }
        if (programsData.data) {
          setProgramsState(programsData.data.map(mapSupabaseProgramToProgram));
        }
        if (sessionsData.data) {
          setSessionsState(sessionsData.data as WorkoutSession[]);
        }
        if (nutritionPlansData.data) {
          setNutritionPlansState(nutritionPlansData.data.map(mapSupabaseNutritionPlanToNutritionPlan));
        }
        if (messagesData.data) {
          setMessagesState(messagesData.data.map(mapSupabaseMessageToMessage));
        }
        if (notificationsData.data) {
          setNotificationsState(notificationsData.data.map(mapSupabaseNotificationToNotification));
        }
        if (foodItemsData.data) {
          setFoodItemsState(foodItemsData.data as FoodItem[]);
        }

      } catch (error) {
        logger.error('Erreur lors du chargement des données', { error });
        setDataError(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, [user, isAuthLoading]);

  // Persist session state
  useEffect(() => {
    try {
      if (originalUser) {
        sessionStorage.setItem(ORIGINAL_USER_SESSION_KEY, JSON.stringify(originalUser));
      } else {
        sessionStorage.removeItem(ORIGINAL_USER_SESSION_KEY);
      }
    } catch (error) {
      logger.error('Échec de la persistance de la session', { error });
    }
  }, [originalUser]);

  // Persist theme
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      logger.error('Échec de la persistance du thème', { error });
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await signIn(email, password);
        navigate('/');
      } catch (error) {
        logger.error('Échec de la connexion', { error, email });
        throw error;
      }
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    try {
      await signOutUser();
      setUser(null);
      setOriginalUser(null);
      navigate('/login');
    } catch (error) {
      logger.error('Échec de la déconnexion', { error });
      throw error;
    }
  }, [navigate]);

  const register = useCallback(
    async (userData: SignUpData) => {
      try {
        await signUp(userData);
        navigate('/');
      } catch (error) {
        logger.error('Échec de l\'inscription', { error, email: userData.email });
        throw error;
      }
    },
    [navigate],
  );

  const addUser = useCallback(async (userData: Partial<Client>): Promise<Client> => {
    // Convertir les données du format camelCase vers snake_case pour Supabase
    const supabaseData = mapClientToSupabaseClient(userData);
    
    const { data, error } = await supabase
      .from('clients')
      .insert([supabaseData])
      .select()
      .single();

    if (error) throw error;
    
    // Convertir les données retournées de snake_case vers camelCase
    const newClient = mapSupabaseClientToClient(data);
    
    // Mettre à jour la liste locale des clients
    setClientsState(prevClients => [...prevClients, newClient]);
    
    return newClient;
  }, []);

  const addNotification = useCallback(
    async (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => {
      const { error } = await supabase.from('notifications').insert([
        {
          user_id: user?.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: false,
        },
      ]);

      if (error) {
        logger.error('Échec de l\'ajout de la notification', { error });
        throw error;
      }
    },
    [user],
  );

  const impersonate = useCallback(
    (userId: string) => {
      if (!user) return;
      setOriginalUser(user);
      const targetClient = clients.find((c) => c.id === userId);
      if (targetClient) {
        setUser(targetClient);
      }
    },
    [user, clients],
  );

  const stopImpersonating = useCallback(() => {
    if (originalUser) {
      setUser(originalUser);
      setOriginalUser(null);
    }
  }, [originalUser]);

  const value: AuthContextType = {
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
    setClients: setClientsState,
    setExercises: setExercisesState,
    setPrograms: setProgramsState,
    setSessions: setSessionsState,
    setNutritionPlans: setNutritionPlansState,
    setMessages: setMessagesState,
    setClientFormations: setClientFormationsState,
    setProfessionalFormations: setProfessionalFormationsState,
    setNotifications: setNotificationsState,
    setFoodItems: setFoodItemsState,
    setBilanTemplates: setBilanTemplatesState,
    setPartners: setPartnersState,
    setProducts: setProductsState,
    setIntensificationTechniques: setIntensificationTechniquesState,
    setRecipes: setRecipesState,
    setMeals: setMealsState,
    addNotification,
    impersonate,
    stopImpersonating,
    setTheme,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
