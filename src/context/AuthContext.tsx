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
  resetPassword,
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
    // Vérifier que les champs requis sont présents
    if (!userData.email || !userData.firstName || !userData.lastName) {
      throw new Error('Email, prénom et nom sont requis');
    }

    // Générer un mot de passe temporaire sécurisé (ne sera jamais communiqué à l'utilisateur)
    const generateSecurePassword = (): string => {
      const length = 32;
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
      let password = '';
      
      // Ajouter au moins un caractère de chaque type requis
      password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Majuscule
      password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minuscule
      password += '0123456789'[Math.floor(Math.random() * 10)]; // Chiffre
      password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Caractère spécial
      
      // Compléter avec des caractères aléatoires
      for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }
      
      // Mélanger les caractères
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    const tempPassword = generateSecurePassword();

    // Utiliser signUp pour créer l'utilisateur dans Auth ET dans la table clients
    const signUpData: SignUpData = {
      email: userData.email,
      password: tempPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: userData.role || 'client',
    };

    const { user: authUser, error } = await signUp(signUpData);
    
    if (error) throw error;
    if (!authUser) throw new Error('Échec de la création de l\'utilisateur');

    // Préparer toutes les données du profil client pour la mise à jour
    const updateData = mapClientToSupabaseClient({
      ...userData,
      id: authUser.id,
      coachId: user?.id, // Associer au coach connecté
    });

    // Supprimer les champs qui ne doivent pas être mis à jour (déjà créés par signUp)
    delete updateData.id;
    delete updateData.email;
    delete updateData.first_name;
    delete updateData.last_name;
    delete updateData.phone;
    delete updateData.role;

    // Mettre à jour le profil complet dans la table clients
    const { error: updateError } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', authUser.id);

    if (updateError) {
      console.error('Erreur lors de la mise à jour du profil:', updateError);
      // Ne pas bloquer si la mise à jour échoue (peut-être que les colonnes n'existent pas encore)
    }

    // Envoyer un email de réinitialisation de mot de passe
    // Cela permettra au client de définir son propre mot de passe
    try {
      await supabase.auth.resetPasswordForEmail(userData.email, {
        redirectTo: `${window.location.origin}/set-password`,
      });
      console.log('Email d\'invitation envoyé à:', userData.email);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email d\'invitation:', emailError);
      // Ne pas bloquer l'inscription si l'email échoue
    }

    // Récupérer le profil créé depuis la base de données
    const { data: clientData, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (fetchError) throw fetchError;
    
    // Convertir les données retournées de snake_case vers camelCase
    const newClient = mapSupabaseClientToClient(clientData);
    
    // Mettre à jour la liste locale des clients
    setClientsState(prevClients => [...prevClients, newClient]);
    
    return newClient;
  }, [user]);

  const updateUser = useCallback(async (userId: string, userData: Partial<Client>) => {
    // Convertir les données de camelCase vers snake_case pour Supabase
    const updateData: any = {};
    
    if (userData.firstName !== undefined) updateData.first_name = userData.firstName;
    if (userData.lastName !== undefined) updateData.last_name = userData.lastName;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.role !== undefined) updateData.role = userData.role;
    if (userData.coachId !== undefined) updateData.coach_id = userData.coachId;
    if (userData.status !== undefined) updateData.status = userData.status;

    // Mettre à jour dans Supabase
    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    // Convertir les données retournées de snake_case vers camelCase
    const updatedClient = mapSupabaseClientToClient(data);
    
    // Mettre à jour la liste locale des clients
    setClientsState(prevClients => 
      prevClients.map(client => 
        client.id === userId ? updatedClient : client
      )
    );
    
    return updatedClient;
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    // Supprimer de Supabase
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    // Mettre à jour la liste locale des clients
    setClientsState(prevClients => prevClients.filter(client => client.id !== userId));
  }, []);

  const resendInvitation = useCallback(async (email: string) => {
    try {
      logger.info('Tentative de renvoi d\'invitation', { email });
      await resetPassword(email);
      logger.info('Email d\'invitation renvoyé avec succès', { email });
    } catch (error) {
      logger.error('Erreur lors du renvoi de l\'email d\'invitation', { error, email });
      throw error;
    }
  }, []);

  // ===== PROGRAMMES D'ENTRAÎNEMENT =====
  
  const addProgram = useCallback(async (programData: Omit<WorkoutProgram, 'id'>) => {
    const programToInsert = {
      name: programData.name,
      objective: programData.objective || null,
      week_count: programData.weekCount,
      sessions_by_week: programData.sessionsByWeek,
      created_by: user?.id,
    };

    const { data, error } = await supabase
      .from('programs')
      .insert([programToInsert])
      .select()
      .single();

    if (error) throw error;
    
    const newProgram = mapSupabaseProgramToProgram(data);
    setProgramsState(prev => [...prev, newProgram]);
    
    return newProgram;
  }, [user]);

  const updateProgram = useCallback(async (programId: string, programData: Partial<WorkoutProgram>) => {
    const updateData: any = {};
    
    if (programData.name !== undefined) updateData.name = programData.name;
    if (programData.objective !== undefined) updateData.objective = programData.objective;
    if (programData.weekCount !== undefined) updateData.week_count = programData.weekCount;
    if (programData.sessionsByWeek !== undefined) updateData.sessions_by_week = programData.sessionsByWeek;

    const { data, error } = await supabase
      .from('programs')
      .update(updateData)
      .eq('id', programId)
      .select()
      .single();

    if (error) throw error;
    
    const updatedProgram = mapSupabaseProgramToProgram(data);
    setProgramsState(prev => prev.map(p => p.id === programId ? updatedProgram : p));
    
    return updatedProgram;
  }, []);

  const deleteProgram = useCallback(async (programId: string) => {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) throw error;
    
    setProgramsState(prev => prev.filter(p => p.id !== programId));
  }, []);

  // ===== PLANS NUTRITIONNELS =====
  
  const addNutritionPlan = useCallback(async (planData: Omit<NutritionPlan, 'id'>) => {
    const planToInsert = {
      name: planData.name,
      client_id: planData.clientId,
      meals: planData.meals,
      notes: planData.notes || null,
      created_by: user?.id,
    };

    const { data, error } = await supabase
      .from('nutrition_plans')
      .insert([planToInsert])
      .select()
      .single();

    if (error) throw error;
    
    const newPlan = mapSupabaseNutritionPlanToNutritionPlan(data);
    setNutritionPlansState(prev => [...prev, newPlan]);
    
    return newPlan;
  }, [user]);

  const updateNutritionPlan = useCallback(async (planId: string, planData: Partial<NutritionPlan>) => {
    const updateData: any = {};
    
    if (planData.name !== undefined) updateData.name = planData.name;
    if (planData.clientId !== undefined) updateData.client_id = planData.clientId;
    if (planData.meals !== undefined) updateData.meals = planData.meals;
    if (planData.notes !== undefined) updateData.notes = planData.notes;

    const { data, error } = await supabase
      .from('nutrition_plans')
      .update(updateData)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    
    const updatedPlan = mapSupabaseNutritionPlanToNutritionPlan(data);
    setNutritionPlansState(prev => prev.map(p => p.id === planId ? updatedPlan : p));
    
    return updatedPlan;
  }, []);

  const deleteNutritionPlan = useCallback(async (planId: string) => {
    const { error } = await supabase
      .from('nutrition_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;
    
    setNutritionPlansState(prev => prev.filter(p => p.id !== planId));
  }, []);

  // ===== MESSAGES =====
  
  const addMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const messageToInsert = {
      sender_id: messageData.senderId,
      recipient_id: messageData.recipientId,
      content: messageData.content,
      is_read: false,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([messageToInsert])
      .select()
      .single();

    if (error) throw error;
    
    const newMessage = mapSupabaseMessageToMessage(data);
    setMessagesState(prev => [...prev, newMessage]);
    
    return newMessage;
  }, []);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    
    const updatedMessage = mapSupabaseMessageToMessage(data);
    setMessagesState(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
    
    return updatedMessage;
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
    
    setMessagesState(prev => prev.filter(m => m.id !== messageId));
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
    reloadData: loadData,
    reloadAllData: loadData,
    resendInvitation,
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
