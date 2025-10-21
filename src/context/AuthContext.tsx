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
import { supabase } from '../services/supabase';
import {
  signIn,
  signUp,
  resetPassword,
  signOutUser,
  onAuthStateChange,
  getClientProfile,
  SignUpData,
  deleteUserAndProfile, 
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
  mapSupabaseBilanTemplateToTemplate,
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
  updateUser: (userId: string, userData: Partial<Client>) => Promise<Client>;
  deleteUser: (userId: string) => Promise<void>;
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
  // Fonctions CRUD pour les programmes
  addProgram: (programData: Omit<WorkoutProgram, 'id'>) => Promise<WorkoutProgram>;
  updateProgram: (programId: string, programData: Partial<WorkoutProgram>) => Promise<WorkoutProgram>;
  deleteProgram: (programId: string) => Promise<void>;
  // Fonctions CRUD pour les plans nutritionnels
  addNutritionPlan: (planData: Omit<NutritionPlan, 'id'>) => Promise<NutritionPlan>;
  updateNutritionPlan: (planId: string, planData: Partial<NutritionPlan>) => Promise<NutritionPlan>;
  deleteNutritionPlan: (planId: string) => Promise<void>;
  // Fonctions CRUD pour les messages
  addMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => Promise<Message>;
  markMessageAsRead: (messageId: string) => Promise<Message>;
  deleteMessage: (messageId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => Promise<void>;
  impersonate: (userId: string) => void;
  stopImpersonating: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  reloadData: () => Promise<void>;
  reloadAllData: () => Promise<void>;
  resendInvitation: (email: string) => Promise<void>;
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
      return 'light';
    }
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === 'dark' ? 'dark' : 'light';
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

  // Fonction pour charger/recharger les données depuis Supabase
  const loadData = useCallback(async () => {
    if (!user) {
      setIsDataLoading(false);
      return;
    }

    try {
      setIsDataLoading(true);
      setDataError(null);

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
        bilanTemplatesData,
      ] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('exercises').select('*'),
        supabase.from('programs').select('*'),
        supabase.from('sessions').select('*'),
        supabase.from('nutrition_plans').select('*'),
        supabase.from('messages').select('*'),
        supabase.from('notifications').select('*'),
        supabase.from('food_items').select('*'),
        supabase.from('bilan_templates').select('*'),
      ]);

      if (clientsData.error) {
        console.error('Erreur de chargement des clients:', clientsData.error);
      }

      if (clientsData.data) {
        const mappedClients = clientsData.data.map(mapSupabaseClientToClient);
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
      if (bilanTemplatesData.data) {
        setBilanTemplatesState(bilanTemplatesData.data.map(mapSupabaseBilanTemplateToTemplate));
      }

    } catch (error) {
      logger.error('Erreur lors du chargement des données', { error });
      setDataError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsDataLoading(false);
    }
  }, [user]);

  // Charger les données au montage et quand l'utilisateur change
  useEffect(() => {
    if (!user || isAuthLoading) {
      setIsDataLoading(false);
      return;
    }

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

  const login = useCallback(async (email, password) => {
    setIsAuthLoading(true);
    try {
      await signIn(email, password);
      // Pas besoin de recharger les données ici, onAuthStateChange s'en chargera
    } catch (error) {
      logger.error('Erreur de connexion', { error });
      throw error;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsAuthLoading(true);
    try {
      await signOutUser();
      setUser(null);
      setOriginalUser(null);
      sessionStorage.removeItem(ORIGINAL_USER_SESSION_KEY);
      navigate('/login');
    } catch (error) {
      logger.error('Erreur de déconnexion', { error });
      throw error;
    } finally {
      setIsAuthLoading(false);
    }
  }, [navigate]);

  const register = useCallback(async (userData: SignUpData) => {
    setIsAuthLoading(true);
    try {
      await signUp(userData);
    } catch (error) {
      logger.error('Erreur d\'inscription', { error });
      throw error;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const addUser = useCallback(async (userData: Partial<Client>): Promise<Client> => {
    logger.info('Ajout d\'utilisateur', { userData });
    try {
      const { data, error } = await supabase.from('clients').insert([mapClientToSupabaseClient(userData as Client)]).select().single();
      if (error) throw error;
      const newClient = mapSupabaseClientToClient(data);
      setClientsState(prev => [...prev, newClient]);
      logger.info('Utilisateur ajouté avec succès', { newClient });
      return newClient;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de l\'utilisateur', { error });
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (userId: string, userData: Partial<Client>): Promise<Client> => {
    logger.info('Mise à jour de l\'utilisateur', { userId, userData });
    try {
      const { data, error } = await supabase.from('clients').update(mapClientToSupabaseClient(userData as Client)).eq('id', userId).select().single();
      if (error) throw error;
      const updatedClient = mapSupabaseClientToClient(data);
      setClientsState(prev => prev.map(client => (client.id === userId ? updatedClient : client)));
      logger.info('Utilisateur mis à jour avec succès', { updatedClient });
      return updatedClient;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de l\'utilisateur', { error });
      throw error;
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    logger.info('Tentative de suppression de l\'utilisateur', { userId });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        logger.error("Erreur lors de la récupération de la session:", { sessionError });
        throw sessionError;
      }
      if (!session) {
        logger.error("Aucune session active trouvée. Impossible de supprimer l\'utilisateur.");
        throw new Error("No active session found. Cannot delete user.");
      }
      logger.info("Session active trouvée, appel de deleteUserAndProfile", { userId, accessToken: session.access_token ? 'present' : 'absent' });
      await deleteUserAndProfile(userId, session.access_token);

      logger.info('Utilisateur supprimé avec succès via fonction Edge, mise à jour de l\'état local', { userId });
      setClientsState(prevClients => prevClients.filter(client => client.id !== userId));
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'utilisateur', { userId, error });
      throw error;
    }
  }, []);

  const addProgram = useCallback(async (programData: Omit<WorkoutProgram, 'id'>) => {
    try {
      const { data, error } = await supabase.from('programs').insert([programData]).select().single();
      if (error) throw error;
      const newProgram = mapSupabaseProgramToProgram(data);
      setProgramsState(prev => [...prev, newProgram]);
      return newProgram;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du programme', { error });
      throw error;
    }
  }, []);

  const updateProgram = useCallback(async (programId: string, programData: Partial<WorkoutProgram>) => {
    try {
      const { data, error } = await supabase.from('programs').update(programData).eq('id', programId).select().single();
      if (error) throw error;
      const updatedProgram = mapSupabaseProgramToProgram(data);
      setProgramsState(prev => prev.map(program => (program.id === programId ? updatedProgram : program)));
      return updatedProgram;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du programme', { error });
      throw error;
    }
  }, []);

  const deleteProgram = useCallback(async (programId: string) => {
    try {
      const { error } = await supabase.from('programs').delete().eq('id', programId);
      if (error) throw error;
      setProgramsState(prev => prev.filter(program => program.id !== programId));
    } catch (error) {
      logger.error('Erreur lors de la suppression du programme', { error });
      throw error;
    }
  }, []);

  const addNutritionPlan = useCallback(async (planData: Omit<NutritionPlan, 'id'>) => {
    try {
      const { data, error } = await supabase.from('nutrition_plans').insert([planData]).select().single();
      if (error) throw error;
      const newPlan = mapSupabaseNutritionPlanToNutritionPlan(data);
      setNutritionPlansState(prev => [...prev, newPlan]);
      return newPlan;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du plan nutritionnel', { error });
      throw error;
    }
  }, []);

  const updateNutritionPlan = useCallback(async (planId: string, planData: Partial<NutritionPlan>) => {
    try {
      const { data, error } = await supabase.from('nutrition_plans').update(planData).eq('id', planId).select().single();
      if (error) throw error;
      const updatedPlan = mapSupabaseNutritionPlanToNutritionPlan(data);
      setNutritionPlansState(prev => prev.map(plan => (plan.id === planId ? updatedPlan : plan)));
      return updatedPlan;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du plan nutritionnel', { error });
      throw error;
    }
  }, []);

  const deleteNutritionPlan = useCallback(async (planId: string) => {
    try {
      const { error } = await supabase.from('nutrition_plans').delete().eq('id', planId);
      if (error) throw error;
      setNutritionPlansState(prev => prev.filter(plan => plan.id !== planId));
    } catch (error) {
      logger.error('Erreur lors de la suppression du plan nutritionnel', { error });
      throw error;
    }
  }, []);

  const addMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    try {
      const { data, error } = await supabase.from('messages').insert([{ ...messageData, timestamp: new Date().toISOString() }]).select().single();
      if (error) throw error;
      const newMessage = mapSupabaseMessageToMessage(data);
      setMessagesState(prev => [...prev, newMessage]);
      return newMessage;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du message', { error });
      throw error;
    }
  }, []);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      const { data, error } = await supabase.from('messages').update({ is_read: true }).eq('id', messageId).select().single();
      if (error) throw error;
      const updatedMessage = mapSupabaseMessageToMessage(data);
      setMessagesState(prev => prev.map(msg => (msg.id === messageId ? updatedMessage : msg)));
      return updatedMessage;
    } catch (error) {
      logger.error('Erreur lors du marquage du message comme lu', { error });
      throw error;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase.from('messages').delete().eq('id', messageId);
      if (error) throw error;
      setMessagesState(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      logger.error('Erreur lors de la suppression du message', { error });
      throw error;
    }
  }, []);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => {
    try {
      const { error } = await supabase.from('notifications').insert([{ ...notification, timestamp: new Date().toISOString(), is_read: false }]);
      if (error) throw error;
      // Reload notifications after adding one
      const { data: notificationsData, error: fetchError } = await supabase.from('notifications').select('*');
      if (fetchError) throw fetchError;
      setNotificationsState(notificationsData.map(mapSupabaseNotificationToNotification));
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de la notification', { error });
      throw error;
    }
  }, []);

  const impersonate = useCallback(async (userId: string) => {
    logger.info('Impersonation de l\'utilisateur', { userId });
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (adminUser) {
        setOriginalUser(mapSupabaseClientToClient(adminUser as any));
        sessionStorage.setItem(ORIGINAL_USER_SESSION_KEY, JSON.stringify(mapSupabaseClientToClient(adminUser as any)));
      }
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'supabase',
        token: userId, // Assuming userId can be used as a token for impersonation (this is a simplified example)
      });

      if (error) throw error;
      if (data.user) {
        const clientProfile = await getClientProfile(data.user.id);
        if (clientProfile) {
          setUser(clientProfile);
          navigate('/app/dashboard');
        } else {
          throw new Error('Profil client introuvable pour l\'utilisateur impersonné');
        }
      }
    } catch (error) {
      logger.error('Erreur lors de l\'impersonation de l\'utilisateur', { error });
      throw error;
    }
  }, [navigate]);

  const stopImpersonating = useCallback(async () => {
    logger.info('Arrêt de l\'impersonation');
    try {
      if (originalUser) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'supabase',
          token: originalUser.id, // Assuming originalUser.id can be used as a token
        });
        if (error) throw error;
        if (data.user) {
          const adminProfile = await getClientProfile(data.user.id);
          if (adminProfile) {
            setUser(adminProfile);
            setOriginalUser(null);
            sessionStorage.removeItem(ORIGINAL_USER_SESSION_KEY);
            navigate('/admin/dashboard');
          } else {
            throw new Error('Profil administrateur introuvable après arrêt de l\'impersonation');
          }
        }
      }
    } catch (error) {
      logger.error('Erreur lors de l\'arrêt de l\'impersonation', { error });
      throw error;
    }
  }, [originalUser, navigate]);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  }, []);

  const reloadData = useCallback(async () => {
    logger.info('Rechargement des données...');
    await loadData();
    logger.info('Données rechargées.');
  }, [loadData]);

  const reloadAllData = useCallback(async () => {
    logger.info('Rechargement de toutes les données...');
    await loadData();
    logger.info('Toutes les données rechargées.');
  }, [loadData]);

  const resendInvitation = useCallback(async (email: string) => {
    logger.info('Renvoi de l\'invitation', { email });
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/set-password`,
        },
      });
      if (error) throw error;
      logger.info('Invitation renvoyée avec succès', { email });
    } catch (error) {
      logger.error('Erreur lors du renvoi de l\'invitation', { error });
      throw error;
    }
  }, []);

  const contextValue = useMemo(
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
      updateUser,
      deleteUser,
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
      addProgram,
      updateProgram,
      deleteProgram,
      addNutritionPlan,
      updateNutritionPlan,
      deleteNutritionPlan,
      addMessage,
      markMessageAsRead,
      deleteMessage,
      addNotification,
      impersonate,
      stopImpersonating,
      setTheme,
      reloadData,
      reloadAllData,
      resendInvitation,
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
      updateUser,
      deleteUser,
      addProgram,
      updateProgram,
      deleteProgram,
      addNutritionPlan,
      updateNutritionPlan,
      deleteNutritionPlan,
      addMessage,
      markMessageAsRead,
      deleteMessage,
      addNotification,
      impersonate,
      stopImpersonating,
      setTheme,
      reloadData,
      reloadAllData,
      resendInvitation,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
  }
  return context;
};
