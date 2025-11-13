import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Database, Tables } from '../types/database';
import { logger } from '../utils/logger';
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
  BilanTemplate, // Assurer l'import de BilanTemplate
  BilanAssignment,
  Partner,
  Product,
  IntensificationTechnique,
  Meal,
} from '../types';
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
// import { deleteUserAndProfile } from '../services/authService'; // Migré ici
// Fonctions qui étaient dans authService.ts
const deleteUserAndProfile = async (userIdToDelete: string, accessToken: string): Promise<void> => {
  logger.info('Appel de deleteUserAndProfile via RPC', { userIdToDelete });
  try {
    const { error } = await supabase.rpc('delete_user_and_profile', {
      user_id_text: userIdToDelete,
    });

    if (error) {
      logger.error("Erreur lors de l'appel RPC delete_user_and_profile:", {
        error,
        userIdToDelete,
      });
      throw new Error(error.message || "Erreur lors de l'appel RPC de suppression.");
    }

    logger.info('Utilisateur et profil supprimés avec succès via RPC:', { userIdToDelete });
  } catch (error) {
    logger.error("Erreur lors de l'appel de la fonction RPC delete_user_and_profile:", {
      error,
      userIdToDelete,
    });
    throw error;
  }
};
// import { ProgramInput } from '../services/programService'; // Supprimé
// Types pour les programmes (matrices)
export interface ProgramInput {
  name: string;
  goal?: string; // Correspond à 'objective' dans le frontend
  max_weeks: number; // Correspond à 'week_count' dans le frontend
  description?: string;
  sessions_per_week?: number;
  is_template?: boolean;
  is_public?: boolean;
  created_by?: string;
}
import { useAuthStore } from './useAuthStore';

// Définition de l'état et des actions
interface DataState {
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
  bilanAssignments: BilanAssignment[];
  isDataLoading: boolean;
  dataError: string | null;

  // Fonctions de chargement
  loadData: (userId: string | null) => Promise<void>;
  reloadData: () => Promise<void>;
  reloadAllData: () => Promise<void>;

  // Fonctions CRUD et Setters
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
  setBilanAssignments: (assignments: BilanAssignment[]) => void;

  // Fonctions de dataService migrées
  getUserMessages: (userId: string) => Promise<Message[]>;
  getUserNotifications: (userId: string) => Promise<Notification[]>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;

  addUser: (userData: Partial<Client>) => Promise<Client>;
  updateUser: (userId: string, userData: Partial<Client>) => Promise<Client>;
  deleteUser: (userId: string) => Promise<void>;

  addProgram: (programData: ProgramInput) => Promise<WorkoutProgram>;
  updateProgram: (programId: string, programData: Partial<ProgramInput>) => Promise<WorkoutProgram>;
  deleteProgram: (programId: string) => Promise<void>;

  addBilanTemplate: (templateData: Omit<BilanTemplate, 'id'>) => Promise<BilanTemplate>;
  updateBilanTemplate: (
    templateId: string,
    templateData: Partial<BilanTemplate>
  ) => Promise<BilanTemplate>;
  deleteBilanTemplate: (templateId: string) => Promise<void>;

  assignBilanTemplate: (
    clientId: string,
    templateId: string,
    recurrence?: BilanAssignment['recurrence']
  ) => Promise<BilanAssignment>;

  addNutritionPlan: (planData: Omit<NutritionPlan, 'id'>) => Promise<NutritionPlan>;
  updateNutritionPlan: (planId: string, planData: Partial<NutritionPlan>) => Promise<NutritionPlan>;
  deleteNutritionPlan: (planId: string) => Promise<void>;

  // Fonctions CRUD génériques internes (pour usage interne dans le store)
  _internalCreate: <T extends keyof Tables>(table: T, data: any) => Promise<Tables[T]['Row']>;
  // _internalUpdate: <T extends keyof Tables>(table: T, id: string, data: Tables[T]['Update']) => Promise<Tables[T]['Row']>; // Supprimé
  _internalDelete: <T extends keyof Tables>(table: T, id: string) => Promise<void>;
  _internalGetWhere: <T extends keyof Tables>(
    table: T,
    column: string,
    value: any
  ) => Promise<Tables[T]['Row'][]>;

  addMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => Promise<Message>;
  markMessageAsRead: (messageId: string) => Promise<Message>;
  deleteMessage: (messageId: string) => Promise<void>;

  addNotification: (
    notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>
  ) => Promise<void>;
}

// Création du store Zustand
export const useDataStore = create<DataState>((set, get) => {
  // Fonction de chargement des données (migrée de AuthContext.tsx)
  const loadData = async (userId: string | null) => {
    if (!userId) {
      set({
        clients: [],
        exercises: [],
        programs: [],
        sessions: [],
        nutritionPlans: [],
        messages: [],
        clientFormations: [],
        professionalFormations: [],
        notifications: [],
        foodItems: [],
        bilanTemplates: [],
        partners: [],
        products: [],
        intensificationTechniques: [],
        recipes: [],
        meals: [],
        bilanAssignments: [],
        isDataLoading: false,
        dataError: null,
      });
      return;
    }

    try {
      set({ isDataLoading: true, dataError: null });

      // Charger toutes les données en parallèle
      // Les requêtes suivantes ont été commentées car elles semblent causer des problèmes de performance/404/ERR_INSUFFICIENT_RESOURCES
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
        assignmentsData, // Ajout de assignmentsData
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
        supabase.from('bilan_assignments').select('*').eq('coach_id', userId), // Nouvelle requête
        // supabase.from('partners').select('*'), // Commenté car problématique
        // supabase.from('products').select('*'), // Commenté car problématique
        // supabase.from('intensification_techniques').select('*'), // Commenté car problématique
        // supabase.from('recipes').select('*'), // Commenté car problématique
        // supabase.from('meals').select('*'), // Commenté car problématique
      ]);

      if (clientsData.error) {
        console.error('Erreur de chargement des clients:', clientsData.error);
      }

      if (clientsData.data) {
        const mappedClients = clientsData.data.map(mapSupabaseClientToClient);
        set({ clients: mappedClients });
      }
      if (exercisesData.data) {
        set({ exercises: exercisesData.data.map(mapSupabaseExerciseToExercise) });
      }
      if (programsData.data) {
        set({ programs: programsData.data.map(mapSupabaseProgramToProgram) });
      }
      if (sessionsData.data) {
        set({ sessions: sessionsData.data as WorkoutSession[] });
      }
      if (nutritionPlansData.data) {
        set({
          nutritionPlans: nutritionPlansData.data.map(mapSupabaseNutritionPlanToNutritionPlan),
        });
      }
      if (assignmentsData.data) {
        // Nouvelle gestion des données
        const mapSupabaseAssignmentsToAssignments = (data: any[]): BilanAssignment[] =>
          data.map((d) => ({
            id: d.id,
            clientId: d.client_id,
            coachId: d.coach_id,
            templateId: d.template_id,
            templateName: d.template_name,
            status: d.status,
            assignedAt: d.assigned_at,
            completedAt: d.completed_at,
            recurrence: d.recurrence,
            nextAssignmentDate: d.next_assignment_date,
          }));
        set({ bilanAssignments: mapSupabaseAssignmentsToAssignments(assignmentsData.data) });
      }
      if (messagesData.data) {
        set({ messages: messagesData.data.map(mapSupabaseMessageToMessage) });
      }
      if (notificationsData.data) {
        set({ notifications: notificationsData.data.map(mapSupabaseNotificationToNotification) });
      }
      if (foodItemsData.data) {
        set({ foodItems: foodItemsData.data as FoodItem[] });
      }
      if (bilanTemplatesData.data) {
        let templates = bilanTemplatesData.data.map(mapSupabaseBilanTemplateToTemplate);

        // Si aucun template n'est trouvé, insérer le template initial par défaut
        if (templates.length === 0) {
          logger.info('Aucun template de bilan trouvé. Insertion du template initial par défaut.');
          const { INITIAL_BILAN_TEMPLATE } = await import('../data/initialBilanTemplate');

          try {
            // Insérer dans Supabase
            const { data: insertedData, error: insertError } = await supabase
              .from('bilan_templates')
              .insert({
                id: INITIAL_BILAN_TEMPLATE.id,
                name: INITIAL_BILAN_TEMPLATE.name,
                coach_id:
                  INITIAL_BILAN_TEMPLATE.coachId === 'system'
                    ? null
                    : INITIAL_BILAN_TEMPLATE.coachId, // Supabase n'aime pas 'system' si la colonne est un UUID
                sections: INITIAL_BILAN_TEMPLATE.sections,
              } as any)
              .select()
              .single();

            if (insertError) throw insertError;

            // Ajouter le template inséré à la liste locale
            templates = [mapSupabaseBilanTemplateToTemplate(insertedData)];
            logger.info('Template initial inséré avec succès.');
          } catch (error) {
            logger.error(
              "Erreur lors de l'insertion du template initial, utilisant la version locale.",
              error as Error
            );
            // En cas d'erreur d'insertion, utiliser au moins la version locale
            templates = [INITIAL_BILAN_TEMPLATE];
          }
        }

        set({ bilanTemplates: templates });
      }

      // Les lignes de set suivantes ont été commentées en raison des problèmes de chargement
      // if (partnersData.data) {
      //   set({ partners: partnersData.data as Partner[] });
      // }
      // if (productsData.data) {
      //   set({ products: productsData.data as Product[] });
      // }
      // if (intensificationTechniquesData.data) {
      //   set({ intensificationTechniques: intensificationTechniquesData.data as IntensificationTechnique[] });
      // }
      // if (recipesData.data) {
      //   set({ recipes: recipesData.data.map(mapSupabaseMealToMeal) });
      // }
      // if (mealsData.data) {
      //   set({ meals: mealsData.data.map(mapSupabaseMealToMeal) });
      // }
    } catch (error) {
      logger.error('Erreur lors du chargement des données', error as Error);
      set({ dataError: error instanceof Error ? error.message : 'Une erreur est survenue' });
    } finally {
      set({ isDataLoading: false });
    }
  };

  return {
    // État initial
    clients: [],
    exercises: [],
    programs: [],
    sessions: [],
    nutritionPlans: [],
    messages: [],
    clientFormations: [],
    professionalFormations: [],
    notifications: [],
    foodItems: [],
    bilanTemplates: [],
    partners: [],
    products: [],
    intensificationTechniques: [],
    recipes: [],
    meals: [],
    isDataLoading: true,
    dataError: null,

    // Fonctions de chargement
    loadData,
    reloadData: async () => {
      const userId = useAuthStore.getState().user?.id || null;
      logger.info('Rechargement des données...');
      await loadData(userId);
      logger.info('Données rechargées.');
    },
    reloadAllData: async () => {
      const userId = useAuthStore.getState().user?.id || null;
      logger.info('Rechargement de toutes les données...');
      await loadData(userId);
      logger.info('Toutes les données rechargées.');
    },

    // Setters (pour la compatibilité et les mises à jour directes)
    setClients: (clients) => set({ clients }),
    setExercises: (exercises) => set({ exercises }),
    setPrograms: (programs) => set({ programs }),
    setSessions: (sessions) => set({ sessions }),
    setNutritionPlans: (plans) => set({ nutritionPlans: plans }),
    setMessages: (messages) => set({ messages }),
    setClientFormations: (formations) => set({ clientFormations: formations }),
    setProfessionalFormations: (formations) => set({ professionalFormations: formations }),
    setNotifications: (notifications) => set({ notifications }),
    setFoodItems: (foodItems) => set({ foodItems }),
    setBilanTemplates: (templates) => set({ bilanTemplates: templates }),
    setPartners: (partners) => set({ partners }),
    setProducts: (products) => set({ products }),
    setIntensificationTechniques: (techniques) => set({ intensificationTechniques: techniques }),
    setRecipes: (recipes) => set({ recipes }),
    setMeals: (meals) => set({ meals }),

    // Fonctions CRUD génériques internes (pour usage interne dans le store)
    _internalCreate: async <T extends keyof Tables>(
      table: T,
      data: Tables[T]['Insert']
    ): Promise<Tables[T]['Row']> => {
      try {
        const { data: result, error } = await supabase
          .from(table as string)
          .insert(data as any)
          .select()
          .single();

        if (error) {
          logger.error(`Erreur lors de la création dans ${String(table)}`, error as Error);
          throw error;
        }

        return result as Tables[T]['Row'];
      } catch (error) {
        logger.error(`Exception lors de la création dans ${String(table)}`, error as Error);
        throw error;
      }
    },
    // Fonction interne _internalUpdate supprimée car elle causait des problèmes de typage complexes avec Supabase.
    // Les fonctions `update` sont désormais implémentées directement dans les fonctions CRUD spécifiques.
    // _internalUpdate: async <T extends keyof Tables>(table: T, id: string, data: Tables[T]['Update']): Promise<Tables[T]['Row']> => { ... }
    _internalDelete: async <T extends keyof Tables>(table: T, id: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from(table as string)
          .delete()
          .eq('id', id);

        if (error) {
          logger.error(`Erreur lors de la suppression de ${String(table)} #${id}`, error as Error);
          throw error;
        }
      } catch (error) {
        logger.error(`Exception lors de la suppression de ${String(table)} #${id}`, error as Error);
        throw error;
      }
    },
    _internalGetWhere: async <T extends keyof Tables>(
      table: T,
      column: string,
      value: any
    ): Promise<Tables[T]['Row'][]> => {
      try {
        const { data, error } = await supabase
          .from(table as string)
          .select('*')
          .eq(column, value);

        if (error) {
          logger.error(
            `Erreur lors de la récupération de ${String(table)} avec filtre`,
            error as Error
          );
          throw error;
        }

        return data || [];
      } catch (error) {
        logger.error(
          `Exception lors de la récupération de ${String(table)} avec filtre`,
          error as Error
        );
        throw error;
      }
    },

    // Fonctions de dataService migrées
    getUserMessages: async (userId: string): Promise<Message[]> => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('Erreur lors de la récupération des messages', error as Error);
          throw error;
        }

        return data ? data.map(mapSupabaseMessageToMessage) : [];
      } catch (error) {
        logger.error('Exception lors de la récupération des messages', error as Error);
        throw error;
      }
    },
    getUserNotifications: async (userId: string): Promise<Notification[]> => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('Erreur lors de la récupération des notifications', error as Error);
          throw error;
        }

        return data ? data.map(mapSupabaseNotificationToNotification) : [];
      } catch (error) {
        logger.error('Exception lors de la récupération des notifications', error as Error);
        throw error;
      }
    },
    markNotificationAsRead: async (notificationId: string): Promise<void> => {
      // Remplacement de _internalUpdate par un appel direct
      const { error } = await supabase
        .from('notifications')
        .update({ read: true } as Tables<'notifications'>['Update']) // read est le nom de la colonne dans la DB Supabase
        .eq('id', notificationId);

      if (error) {
        logger.error(
          `Erreur lors de la mise à jour de la notification ${notificationId}`,
          error as Error
        );
        throw error;
      }
      // Mise à jour de l'état local
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
      }));
    },

    // Fonctions CRUD existantes qui utilisent maintenant les fonctions internes
    addUser: async (userData: Partial<Client>): Promise<Client> => {
      logger.info("Ajout d'utilisateur via Edge Function", { userData });
      try {
        // Récupérer le token d'authentification de l'utilisateur actuel
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session');
        }

        // Appeler l'Edge Function pour créer l'utilisateur
        const { data, error } = await supabase.functions.invoke('create-user-admin', {
          body: {
            email: userData.email,
            password: (userData as any).password, // Le mot de passe est passé depuis le formulaire
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            role: userData.role,
            coachId: userData.coachId,
            affiliationCode: userData.affiliationCode,
            status: userData.status,
          },
        });

        if (error) {
          logger.error('Erreur lors de l\'appel à l\'Edge Function', { error });
          throw error;
        }

        if (!data.success) {
          throw new Error(data.error || 'Failed to create user');
        }

        const newClient = mapSupabaseClientToClient(data.user.profile);
        set((state) => ({ clients: [...state.clients, newClient] }));
        logger.info('Utilisateur ajouté avec succès via Edge Function', { newClient });
        return newClient;
      } catch (error) {
        logger.error("Erreur lors de l'ajout de l'utilisateur", error as Error);
        throw error;
      }
    },

    updateUser: async (userId: string, userData: Partial<Client>): Promise<Client> => {
      logger.info("Mise à jour de l'utilisateur", { userId, userData });
      try {
        const { data, error } = await supabase
          .from('clients')
          .update(mapClientToSupabaseClient(userData as Client) as Tables<'clients'>['Update'])
          .eq('id', userId)
          .select()
          .single();
        if (error) throw error;
        const updatedClient = mapSupabaseClientToClient(data);
        set((state) => ({
          clients: state.clients.map((client) => (client.id === userId ? updatedClient : client)),
        }));

        // Mettre à jour l'utilisateur dans useAuthStore s'il s'agit de l'utilisateur courant
        if (useAuthStore.getState().user?.id === userId) {
          useAuthStore.setState({ user: updatedClient });
        }

        logger.info('Utilisateur mis à jour avec succès', { updatedClient });
        return updatedClient;
      } catch (error) {
        logger.error("Erreur lors de la mise à jour de l'utilisateur", error as Error);
        throw error;
      }
    },

    deleteUser: async (userId: string) => {
      logger.info("Tentative de suppression de l'utilisateur", { userId });
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) {
          logger.error('Erreur lors de la récupération de la session:', sessionError as Error);
          throw sessionError;
        }
        if (!session) {
          logger.error("Aucune session active trouvée. Impossible de supprimer l'utilisateur.");
          throw new Error('No active session found. Cannot delete user.');
        }
        logger.info('Session active trouvée, appel de deleteUserAndProfile', {
          userId,
          accessToken: session.access_token ? 'present' : 'absent',
        });
        await deleteUserAndProfile(userId, session.access_token);

        logger.info(
          "Utilisateur supprimé avec succès via fonction Edge, mise à jour de l'état local",
          { userId }
        );
        set((state) => ({
          ...state,
          clients: state.clients.filter((client) => client.id !== userId),
        }));
      } catch (error) {
        logger.error("Erreur lors de la suppression de l'utilisateur", error as Error);
        throw error;
      }
    },

    addProgram: async (programData: ProgramInput): Promise<WorkoutProgram> => {
      logger.info('Ajout de programme', { programData });
      try {
        const { user } = useAuthStore.getState();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('programs')
          .insert({
            ...programData,
            coach_id: user.id,
          } as any)
          .select()
          .single();

        if (error) throw error;
        const newProgram = mapSupabaseProgramToProgram(data);
        set((state) => ({ ...state, programs: [...state.programs, newProgram] }));
        logger.info('Programme ajouté avec succès', { newProgram });
        return newProgram;
      } catch (error) {
        logger.error("Erreur lors de l'ajout de programme", error as Error);
        throw error;
      }
    },

    updateProgram: async (
      programId: string,
      programData: Partial<ProgramInput>
    ): Promise<WorkoutProgram> => {
      logger.info('Mise à jour de programme', { programId, programData });
      try {
        const { data, error } = await supabase
          .from('programs')
          .update({
            ...programData,
            updated_at: new Date().toISOString(),
          } as Tables<'programs'>['Update'])
          .eq('id', programId)
          .select()
          .single();

        if (error) throw error;
        const updatedProgram = mapSupabaseProgramToProgram(data);
        set((state) => ({
          ...state,
          programs: state.programs.map((p) => (p.id === programId ? updatedProgram : p)),
        }));
        logger.info('Programme mis à jour avec succès', { updatedProgram });
        return updatedProgram;
      } catch (error) {
        logger.error('Erreur lors de la mise à jour de programme', error as Error);
        throw error;
      }
    },

    deleteProgram: async (programId: string): Promise<void> => {
      logger.info('Suppression de programme', { programId });
      try {
        const { error } = await supabase.from('programs').delete().eq('id', programId);

        if (error) throw error;
        set((state) => ({ ...state, programs: state.programs.filter((p) => p.id !== programId) }));
        logger.info('Programme supprimé avec succès', { programId });
      } catch (error) {
        logger.error('Erreur lors de la suppression de programme', error as Error);
        throw error;
      }
    },

    addBilanTemplate: async (templateData: Omit<BilanTemplate, 'id'>): Promise<BilanTemplate> => {
      logger.info('Ajout de template de bilan', { templateData });
      try {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) throw new Error('Utilisateur non connecté.');

        const { data, error } = await supabase
          .from('bilan_templates')
          .insert({
            ...templateData,
            coach_id: templateData.coachId === 'system' ? null : templateData.coachId || userId,
            sections: templateData.sections,
          } as any)
          .select()
          .single();

        if (error) throw error;
        const newTemplate = mapSupabaseBilanTemplateToTemplate(data);
        set((state) => ({ ...state, bilanTemplates: [...state.bilanTemplates, newTemplate] }));
        logger.info('Template de bilan ajouté avec succès', { newTemplate });
        return newTemplate;
      } catch (error) {
        logger.error('Erreur lors de la mise à jour de template de bilan', error as Error);
        throw error;
      }
    },

    updateBilanTemplate: async (
      templateId: string,
      templateData: Partial<BilanTemplate>
    ): Promise<BilanTemplate> => {
      logger.info('Mise à jour de template de bilan', { templateId, templateData });
      try {
        // Empêcher la modification du template système
        const templateToUpdate = get().bilanTemplates.find((t) => t.id === templateId);
        if (templateToUpdate?.coachId === 'system') {
          throw new Error('Impossible de modifier le template système.');
        }

        const { data, error } = await supabase
          .from('bilan_templates')
          .update({
            ...templateData,
            updated_at: new Date().toISOString(),
            sections: templateData.sections,
          } as Tables<'bilan_templates'>['Update'])
          .eq('id', templateId)
          .select()
          .single();

        if (error) throw error;
        const updatedTemplate = mapSupabaseBilanTemplateToTemplate(data);
        set((state) => ({
          ...state,
          bilanTemplates: state.bilanTemplates.map((t) =>
            t.id === templateId ? updatedTemplate : t
          ),
        }));
        logger.info('Template de bilan mis à jour avec succès', { updatedTemplate });
        return updatedTemplate;
      } catch (error) {
        logger.error('Erreur lors de la mise à jour de template de bilan', error as Error);
        throw error;
      }
    },

    assignBilanTemplate: async (
      clientId: string,
      templateId: string,
      recurrence?: BilanAssignment['recurrence']
    ): Promise<BilanAssignment> => {
      logger.info('Assignation de template de bilan', { clientId, templateId, recurrence });
      try {
        const coachId = useAuthStore.getState().user?.id;
        if (!coachId) throw new Error('Coach non connecté.');

        const template = get().bilanTemplates.find((t) => t.id === templateId);
        if (!template) throw new Error('Template de bilan non trouvé.');

        const assignmentData = {
          client_id: clientId,
          coach_id: coachId,
          template_id: templateId,
          template_name: template.name,
          status: 'pending',
          assigned_at: new Date().toISOString(),
          recurrence: recurrence || null,
          next_assignment_date: recurrence ? new Date().toISOString() : null, // Pour la première assignation, on peut mettre la date d'aujourd'hui
        };

        const { data, error } = await supabase
          .from('bilan_assignments')
          .insert(assignmentData as any)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const newAssignment: BilanAssignment = {
            id: (data as any).id,
            clientId: (data as any).client_id,
            coachId: (data as any).coach_id, // Ajout de coachId
            templateId: (data as any).template_id,
            templateName: (data as any).template_name,
            status: (data as any).status,
            assignedAt: (data as any).assigned_at,
            completedAt: (data as any).completed_at,
            recurrence: (data as any).recurrence,
            nextAssignmentDate: (data as any).next_assignment_date,
          };
          set((state) => ({
            ...state,
            bilanAssignments: [...state.bilanAssignments, newAssignment],
          }));
          return newAssignment;
        }

        return null;
      } catch (error) {
        logger.error('Erreur lors de la suppression de template de bilan', error as Error);
        throw error;
      }
    },

    addNutritionPlan: async (planData: Omit<NutritionPlan, 'id'>) => {
      try {
        const { data, error } = await supabase
          .from('nutrition_plans')
          .insert([planData] as any)
          .select()
          .single();
        if (error) throw error;
        const newPlan = mapSupabaseNutritionPlanToNutritionPlan(data);
        set((state) => ({ ...state, nutritionPlans: [...state.nutritionPlans, newPlan] }));
        return newPlan;
      } catch (error) {
        logger.error("Erreur lors de l'ajout du plan nutritionnel", error as Error);
        throw error;
      }
    },

    updateNutritionPlan: async (planId: string, planData: Partial<NutritionPlan>) => {
      try {
        const { data, error } = await supabase
          .from('nutrition_plans')
          .update(planData as Tables<'nutrition_plans'>['Update'])
          .eq('id', planId)
          .select()
          .single();
        if (error) throw error;
        const updatedPlan = mapSupabaseNutritionPlanToNutritionPlan(data);
        set((state) => ({
          ...state,
          nutritionPlans: state.nutritionPlans.map((plan) =>
            plan.id === planId ? updatedPlan : plan
          ),
        }));
        return updatedPlan;
      } catch (error) {
        logger.error('Erreur lors de la mise à jour du plan nutritionnel', error as Error);
        throw error;
      }
    },

    deleteNutritionPlan: async (planId: string) => {
      try {
        const { error } = await supabase.from('nutrition_plans').delete().eq('id', planId);
        if (error) throw error;
        set((state) => ({
          ...state,
          nutritionPlans: state.nutritionPlans.filter((plan) => plan.id !== planId),
        }));
      } catch (error) {
        logger.error('Erreur lors de la suppression du plan nutritionnel', error as Error);
        throw error;
      }
    },

    addMessage: async (messageData: Omit<Message, 'id' | 'timestamp'>) => {
      try {
        // Mapper les données vers le format Supabase
        const supabaseData = {
          sender_id: messageData.senderId,
          recipient_id: messageData.recipientId,
          content: messageData.content,
          is_voice: messageData.isVoice || false,
          voice_url: messageData.voiceUrl || null,
          seen_by_sender: messageData.seenBySender ?? true,
          seen_by_recipient: messageData.seenByRecipient ?? false,
        };
        
        const { data, error } = await supabase
          .from('messages')
          .insert([supabaseData])
          .select()
          .single();
        if (error) throw error;
        const newMessage = mapSupabaseMessageToMessage(data);
        set((state) => ({ ...state, messages: [...state.messages, newMessage] }));
        return newMessage;
      } catch (error) {
        logger.error("Erreur lors de l'ajout du message", error as Error);
        throw error;
      }
    },

    markMessageAsRead: async (messageId: string) => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .update({ seen_by_recipient: true } as any)
          .eq('id', messageId)
          .select()
          .single();
        if (error) throw error;
        const updatedMessage = mapSupabaseMessageToMessage(data);
        set((state) => ({
          ...state,
          messages: state.messages.map((msg) => (msg.id === messageId ? updatedMessage : msg)),
        }));
        return updatedMessage;
      } catch (error) {
        logger.error('Erreur lors du marquage du message comme lu', error as Error);
        throw error;
      }
    },

    deleteMessage: async (messageId: string) => {
      try {
        const { error } = await supabase.from('messages').delete().eq('id', messageId);
        if (error) throw error;
        set((state) => ({
          ...state,
          messages: state.messages.filter((msg) => msg.id !== messageId),
        }));
      } catch (error) {
        logger.error('Erreur lors de la suppression du message', error as Error);
        throw error;
      }
    },

    addNotification: async (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => {
      const targetUserId = notification.userId ?? useAuthStore.getState().user?.id ?? null;
      const createdAt = new Date().toISOString();

      const fallbackNotification = {
        id: `local-${Date.now()}`,
        userId: targetUserId ?? 'unknown',
        fromName: notification.fromName ?? '',
        type: notification.type ?? 'info',
        message: notification.message,
        link: notification.link ?? '',
        isRead: false,
        timestamp: createdAt,
        title: notification.title ?? '',
      } as Notification;

      if (!targetUserId) {
        logger.warn("Impossible d'ajouter la notification : aucun utilisateur cible défini", {
          notification,
        });
        set((state) => ({
          ...state,
          notifications: [fallbackNotification, ...state.notifications],
        }));
        return;
      }

      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: targetUserId,
              title: notification.title ?? '',
              message: notification.message,
              type: notification.type ?? null,
              read: false,
              created_at: createdAt,
            },
          ])
          .select('*')
          .single();

        if (error) throw error;

        const mappedNotification = mapSupabaseNotificationToNotification(data as any);
        const finalNotification = {
          ...mappedNotification,
          fromName: notification.fromName ?? mappedNotification.fromName,
          link: notification.link ?? mappedNotification.link,
        } as Notification;

        set((state) => ({
          ...state,
          notifications: [finalNotification, ...state.notifications],
        }));
      } catch (error) {
        logger.error("Erreur lors de l'ajout de la notification", error as Error);
        set((state) => ({
          ...state,
          notifications: [fallbackNotification, ...state.notifications],
        }));
        throw error;
      }
    },
  };
});

// Fonction pour initialiser l'écoute en temps réel des messages
export const initializeMessagesRealtime = (userId: string) => {
  const channel = supabase
    .channel('messages-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        logger.info('Nouveau message reçu via Realtime', payload);
        const newMessage = mapSupabaseMessageToMessage(payload.new as any);
        
        // Ajouter le message au store sans appeler l'API
        useDataStore.setState((state) => ({
          messages: [...state.messages, newMessage],
        }));
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        logger.info('Message mis à jour via Realtime', payload);
        const updatedMessage = mapSupabaseMessageToMessage(payload.new as any);
        
        // Mettre à jour le message dans le store
        useDataStore.setState((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          ),
        }));
      }
    )
    .subscribe();

  return channel;
};
