import { supabase } from './supabase';
import type { Database } from '../types/database';
import { logger } from '../utils/logger';

type Tables = Database['public']['Tables'];

/**
 * Service générique pour les opérations CRUD sur Supabase
 */
class DataService {
  /**
   * Récupérer tous les enregistrements d'une table
   */
  async getAll<T extends keyof Tables>(
    table: T
  ): Promise<Tables[T]['Row'][]> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        logger.error(`Erreur lors de la récupération de ${table}`, { error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error(`Exception lors de la récupération de ${table}`, { error });
      throw error;
    }
  }

  /**
   * Récupérer un enregistrement par ID
   */
  async getById<T extends keyof Tables>(
    table: T,
    id: string
  ): Promise<Tables[T]['Row'] | null> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error(`Erreur lors de la récupération de ${table} #${id}`, { error });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error(`Exception lors de la récupération de ${table} #${id}`, { error });
      throw error;
    }
  }

  /**
   * Créer un nouvel enregistrement
   */
  async create<T extends keyof Tables>(
    table: T,
    data: Tables[T]['Insert']
  ): Promise<Tables[T]['Row']> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert([data])
        .select()
        .single();

      if (error) {
        logger.error(`Erreur lors de la création dans ${table}`, { error, data });
        throw error;
      }

      return result;
    } catch (error) {
      logger.error(`Exception lors de la création dans ${table}`, { error });
      throw error;
    }
  }

  /**
   * Mettre à jour un enregistrement
   */
  async update<T extends keyof Tables>(
    table: T,
    id: string,
    data: Tables[T]['Update']
  ): Promise<Tables[T]['Row']> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Erreur lors de la mise à jour de ${table} #${id}`, { error, data });
        throw error;
      }

      return result;
    } catch (error) {
      logger.error(`Exception lors de la mise à jour de ${table} #${id}`, { error });
      throw error;
    }
  }

  /**
   * Supprimer un enregistrement
   */
  async delete<T extends keyof Tables>(
    table: T,
    id: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        logger.error(`Erreur lors de la suppression de ${table} #${id}`, { error });
        throw error;
      }
    } catch (error) {
      logger.error(`Exception lors de la suppression de ${table} #${id}`, { error });
      throw error;
    }
  }

  /**
   * Récupérer les enregistrements avec un filtre
   */
  async getWhere<T extends keyof Tables>(
    table: T,
    column: string,
    value: any
  ): Promise<Tables[T]['Row'][]> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(column, value);

      if (error) {
        logger.error(`Erreur lors de la récupération de ${table} avec filtre`, { error, column, value });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error(`Exception lors de la récupération de ${table} avec filtre`, { error });
      throw error;
    }
  }

  /**
   * Récupérer les clients d'un coach
   */
  async getCoachClients(coachId: string): Promise<Tables['clients']['Row'][]> {
    return this.getWhere('clients', 'coach_id', coachId);
  }

  /**
   * Récupérer les programmes d'un client
   */
  async getClientPrograms(clientId: string): Promise<Tables['programs']['Row'][]> {
    return this.getWhere('programs', 'client_id', clientId);
  }

  /**
   * Récupérer les sessions d'un programme
   */
  async getProgramSessions(programId: string): Promise<Tables['sessions']['Row'][]> {
    return this.getWhere('sessions', 'program_id', programId);
  }

  /**
   * Récupérer les plans nutritionnels d'un client
   */
  async getClientNutritionPlans(clientId: string): Promise<Tables['nutrition_plans']['Row'][]> {
    return this.getWhere('nutrition_plans', 'client_id', clientId);
  }

  /**
   * Récupérer les messages d'un utilisateur
   */
  async getUserMessages(userId: string): Promise<Tables['messages']['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erreur lors de la récupération des messages', { error, userId });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Exception lors de la récupération des messages', { error });
      throw error;
    }
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getUserNotifications(userId: string): Promise<Tables['notifications']['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erreur lors de la récupération des notifications', { error, userId });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Exception lors de la récupération des notifications', { error });
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.update('notifications', notificationId, { read: true });
  }

  /**
   * Marquer un message comme lu
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    await this.update('messages', messageId, { read: true });
  }
}

export const dataService = new DataService();
export default dataService;
