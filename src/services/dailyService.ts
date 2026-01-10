/**
 * Service d'intégration Daily.co pour la visioconférence
 * 
 * Daily.co est utilisé pour créer et gérer les rooms de visioconférence
 * pour les rendez-vous entre coaches et clients.
 * 
 * Documentation API: https://docs.daily.co/reference/rest-api
 */

// Types Daily.co
export interface DailyRoom {
  id: string;
  name: string;
  api_created: boolean;
  privacy: 'public' | 'private';
  url: string;
  created_at: string;
  config?: DailyRoomConfig;
}

export interface DailyRoomConfig {
  start_video_off?: boolean;
  start_audio_off?: boolean;
  enable_chat?: boolean;
  enable_screenshare?: boolean;
  enable_recording?: string; // 'cloud' | 'local' | 'rtp-tracks'
  max_participants?: number;
  enable_knocking?: boolean;
  enable_prejoin_ui?: boolean;
  exp?: number; // Timestamp d'expiration
  eject_at_room_exp?: boolean;
  lang?: string;
}

export interface CreateRoomParams {
  name?: string;
  privacy?: 'public' | 'private';
  properties?: DailyRoomConfig;
}

export interface DailyMeetingToken {
  token: string;
  room_name: string;
}

/**
 * Service Daily.co
 */
class DailyService {
  private apiKey: string;
  private baseUrl = 'https://api.daily.co/v1';

  constructor() {
    // L'API key sera stockée dans les variables d'environnement Supabase
    this.apiKey = import.meta.env.VITE_DAILY_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ VITE_DAILY_API_KEY non définie. Les fonctionnalités de visio seront limitées.');
    }
  }

  /**
   * Vérifie si l'API key est configurée
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Headers pour les requêtes API
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Crée une room Daily.co pour un rendez-vous
   * 
   * @param appointmentId - ID du rendez-vous
   * @param duration - Durée du rendez-vous en minutes
   * @param config - Configuration optionnelle de la room
   * @returns Room créée avec l'URL de visio
   */
  async createRoom(
    appointmentId: string,
    duration: number = 60,
    config?: Partial<DailyRoomConfig>
  ): Promise<DailyRoom> {
    if (!this.isConfigured()) {
      throw new Error('Daily.co API key non configurée');
    }

    try {
      // Nom unique de la room basé sur l'ID du rendez-vous
      const roomName = `virtus-${appointmentId}`;
      
      // Calcul de l'expiration (durée + 30 min de marge)
      const expirationTime = Math.floor(Date.now() / 1000) + ((duration + 30) * 60);

      const roomConfig: CreateRoomParams = {
        name: roomName,
        privacy: 'private', // Room privée par défaut
        properties: {
          start_video_off: false, // Vidéo activée par défaut
          start_audio_off: false, // Audio activé par défaut
          enable_chat: true, // Chat activé
          enable_screenshare: true, // Partage d'écran activé
          enable_recording: 'cloud', // Enregistrement cloud disponible
          max_participants: 2, // Coach + Client uniquement
          enable_knocking: true, // Salle d'attente activée
          enable_prejoin_ui: true, // UI de pré-connexion
          exp: expirationTime, // Expiration automatique
          eject_at_room_exp: true, // Éjecter les participants à l'expiration
          lang: 'fr', // Interface en français
          ...config, // Config personnalisée
        },
      };

      const response = await fetch(`${this.baseUrl}/rooms`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(roomConfig),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur création room Daily.co: ${error.error || response.statusText}`);
      }

      const room: DailyRoom = await response.json();
      console.log('✅ Room Daily.co créée:', room.url);
      
      return room;
    } catch (error) {
      console.error('❌ Erreur création room Daily.co:', error);
      throw error;
    }
  }

  /**
   * Récupère les informations d'une room
   * 
   * @param roomName - Nom de la room
   * @returns Informations de la room
   */
  async getRoom(roomName: string): Promise<DailyRoom> {
    if (!this.isConfigured()) {
      throw new Error('Daily.co API key non configurée');
    }

    try {
      const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur récupération room: ${error.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur récupération room:', error);
      throw error;
    }
  }

  /**
   * Supprime une room Daily.co
   * 
   * @param roomName - Nom de la room à supprimer
   */
  async deleteRoom(roomName: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Daily.co API key non configurée');
    }

    try {
      const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur suppression room: ${error.error || response.statusText}`);
      }

      console.log('✅ Room Daily.co supprimée:', roomName);
    } catch (error) {
      console.error('❌ Erreur suppression room:', error);
      throw error;
    }
  }

  /**
   * Crée un token de meeting pour un participant
   * Permet de contrôler les permissions d'accès à la room
   * 
   * @param roomName - Nom de la room
   * @param userName - Nom du participant
   * @param isOwner - Si le participant est le propriétaire (coach)
   * @returns Token de meeting
   */
  async createMeetingToken(
    roomName: string,
    userName: string,
    isOwner: boolean = false
  ): Promise<DailyMeetingToken> {
    if (!this.isConfigured()) {
      throw new Error('Daily.co API key non configurée');
    }

    try {
      const tokenConfig = {
        properties: {
          room_name: roomName,
          user_name: userName,
          is_owner: isOwner,
          enable_recording: isOwner ? 'cloud' : undefined, // Seul le coach peut enregistrer
          start_cloud_recording: false, // Pas d'enregistrement automatique
        },
      };

      const response = await fetch(`${this.baseUrl}/meeting-tokens`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(tokenConfig),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur création token: ${error.error || response.statusText}`);
      }

      const result = await response.json();
      return {
        token: result.token,
        room_name: roomName,
      };
    } catch (error) {
      console.error('❌ Erreur création token:', error);
      throw error;
    }
  }

  /**
   * Liste toutes les rooms actives
   * Utile pour le monitoring et le nettoyage
   * 
   * @returns Liste des rooms
   */
  async listRooms(): Promise<DailyRoom[]> {
    if (!this.isConfigured()) {
      throw new Error('Daily.co API key non configurée');
    }

    try {
      const response = await fetch(`${this.baseUrl}/rooms`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur listage rooms: ${error.error || response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('❌ Erreur listage rooms:', error);
      throw error;
    }
  }

  /**
   * Nettoie les rooms expirées
   * À appeler périodiquement (cron job)
   */
  async cleanupExpiredRooms(): Promise<number> {
    if (!this.isConfigured()) {
      return 0;
    }

    try {
      const rooms = await this.listRooms();
      const now = Math.floor(Date.now() / 1000);
      let deletedCount = 0;

      for (const room of rooms) {
        // Vérifier si la room est expirée
        if (room.config?.exp && room.config.exp < now) {
          try {
            await this.deleteRoom(room.name);
            deletedCount++;
          } catch (error) {
            console.error(`Erreur suppression room ${room.name}:`, error);
          }
        }
      }

      console.log(`🧹 ${deletedCount} rooms expirées nettoyées`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Erreur nettoyage rooms:', error);
      return 0;
    }
  }

  /**
   * Génère l'URL complète de la room avec le token
   * 
   * @param roomUrl - URL de base de la room
   * @param token - Token de meeting (optionnel)
   * @returns URL complète avec token
   */
  getRoomUrlWithToken(roomUrl: string, token?: string): string {
    if (!token) {
      return roomUrl;
    }
    return `${roomUrl}?t=${token}`;
  }
}

// Export singleton
export const dailyService = new DailyService();

// Export du type pour utilisation dans d'autres services
export type { DailyRoom, DailyRoomConfig, CreateRoomParams, DailyMeetingToken };
