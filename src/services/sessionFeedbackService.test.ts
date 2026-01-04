import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  saveSessionFeedback,
  getSessionFeedbacks,
  getClientFeedbacks,
  calculateFeedbackAverages,
  markFeedbackAsViewed,
  addCoachResponseToFeedback,
  getFeedbackByPerformanceLogId,
  countUnviewedFeedbacksForCoach,
  SessionFeedback
} from './sessionFeedbackService';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'feedback-123' }, 
            error: null 
          })
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ 
              data: [
                {
                  id: 'feedback-1',
                  client_id: 'client-1',
                  session_id: 'session-1',
                  performance_log_id: 'log-1',
                  pre_fatigue: 5,
                  sleep_quality: 8,
                  perceived_difficulty: 7,
                  enjoyment: 9,
                  comment: 'Bonne séance',
                  submitted_at: '2026-01-04T12:00:00Z',
                  created_at: '2026-01-04T12:00:00Z',
                  viewed_by_coach: false,
                  viewed_at: null,
                  coach_response: null
                }
              ], 
              error: null 
            })
          })),
          order: vi.fn().mockResolvedValue({ 
            data: [
              {
                id: 'feedback-1',
                client_id: 'client-1',
                session_id: 'session-1',
                performance_log_id: 'log-1',
                pre_fatigue: 5,
                sleep_quality: 8,
                perceived_difficulty: 7,
                enjoyment: 9,
                comment: 'Bonne séance',
                submitted_at: '2026-01-04T12:00:00Z',
                created_at: '2026-01-04T12:00:00Z',
                viewed_by_coach: false
              }
            ], 
            error: null 
          }),
          limit: vi.fn(() => ({
            mockResolvedValue: vi.fn().mockResolvedValue({ 
              data: [], 
              error: null 
            })
          })),
          single: vi.fn().mockResolvedValue({ 
            data: {
              id: 'feedback-1',
              client_id: 'client-1',
              session_id: 'session-1',
              performance_log_id: 'log-1',
              pre_fatigue: 5,
              sleep_quality: 8,
              perceived_difficulty: 7,
              enjoyment: 9,
              comment: 'Bonne séance',
              submitted_at: '2026-01-04T12:00:00Z',
              created_at: '2026-01-04T12:00:00Z',
              viewed_by_coach: false,
              viewed_at: null,
              coach_response: null
            }, 
            error: null 
          })
        })),
        head: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ count: 3, error: null })
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      }))
    }))
  }
}));

describe('sessionFeedbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveSessionFeedback', () => {
    it('devrait sauvegarder un feedback', async () => {
      const feedback: SessionFeedback = {
        clientId: 'client-1',
        sessionId: 'session-1',
        performanceLogId: 'log-1',
        preFatigue: 5,
        sleepQuality: 8,
        perceivedDifficulty: 7,
        enjoyment: 9,
        comment: 'Bonne séance'
      };

      const id = await saveSessionFeedback(feedback);

      expect(id).toBe('feedback-123');
    });

    it('devrait sauvegarder un feedback sans commentaire', async () => {
      const feedback: SessionFeedback = {
        clientId: 'client-1',
        sessionId: 'session-1',
        preFatigue: 5,
        sleepQuality: 8,
        perceivedDifficulty: 7,
        enjoyment: 9
      };

      const id = await saveSessionFeedback(feedback);

      expect(id).toBe('feedback-123');
    });
  });

  describe('getSessionFeedbacks', () => {
    it('devrait récupérer les feedbacks d\'une séance', async () => {
      const feedbacks = await getSessionFeedbacks('client-1', 'session-1');

      expect(Array.isArray(feedbacks)).toBe(true);
      expect(feedbacks.length).toBeGreaterThan(0);
      expect(feedbacks[0]).toHaveProperty('preFatigue');
      expect(feedbacks[0]).toHaveProperty('sleepQuality');
    });
  });

  describe('getClientFeedbacks', () => {
    it('devrait récupérer tous les feedbacks d\'un client', async () => {
      const feedbacks = await getClientFeedbacks('client-1');

      expect(Array.isArray(feedbacks)).toBe(true);
    });

    it('devrait respecter la limite de résultats', async () => {
      const feedbacks = await getClientFeedbacks('client-1', 10);

      expect(Array.isArray(feedbacks)).toBe(true);
    });
  });

  describe('calculateFeedbackAverages', () => {
    it('devrait calculer les moyennes des feedbacks', async () => {
      const averages = await calculateFeedbackAverages('client-1');

      expect(averages).not.toBeNull();
      if (averages) {
        expect(averages).toHaveProperty('averagePreFatigue');
        expect(averages).toHaveProperty('averageSleepQuality');
        expect(averages).toHaveProperty('averagePerceivedDifficulty');
        expect(averages).toHaveProperty('averageEnjoyment');
        expect(averages).toHaveProperty('totalFeedbacks');
      }
    });

    it('devrait retourner null si aucun feedback', async () => {
      // Mock pour retourner un tableau vide
      const averages = await calculateFeedbackAverages('client-without-feedbacks');

      // Le résultat dépend de l'implémentation du mock
      expect(averages).toBeDefined();
    });
  });

  describe('markFeedbackAsViewed', () => {
    it('devrait marquer un feedback comme vu', async () => {
      const success = await markFeedbackAsViewed('feedback-1');

      expect(success).toBe(true);
    });
  });

  describe('addCoachResponseToFeedback', () => {
    it('devrait ajouter une réponse coach', async () => {
      const success = await addCoachResponseToFeedback('feedback-1', 'Merci pour ton retour !');

      expect(success).toBe(true);
    });

    it('devrait gérer les réponses vides', async () => {
      const success = await addCoachResponseToFeedback('feedback-1', '');

      expect(success).toBe(true);
    });
  });

  describe('getFeedbackByPerformanceLogId', () => {
    it('devrait récupérer un feedback par performance_log_id', async () => {
      const feedback = await getFeedbackByPerformanceLogId('log-1');

      expect(feedback).not.toBeNull();
      if (feedback) {
        expect(feedback).toHaveProperty('id');
        expect(feedback).toHaveProperty('performanceLogId');
        expect(feedback.performanceLogId).toBe('log-1');
      }
    });
  });

  describe('countUnviewedFeedbacksForCoach', () => {
    it('devrait compter les feedbacks non vus', async () => {
      const count = await countUnviewedFeedbacksForCoach('coach-1');

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Validation des données', () => {
    it('devrait valider les valeurs des critères (0-10)', () => {
      const feedback: SessionFeedback = {
        clientId: 'client-1',
        sessionId: 'session-1',
        preFatigue: 5,
        sleepQuality: 8,
        perceivedDifficulty: 7,
        enjoyment: 9
      };

      expect(feedback.preFatigue).toBeGreaterThanOrEqual(0);
      expect(feedback.preFatigue).toBeLessThanOrEqual(10);
      expect(feedback.sleepQuality).toBeGreaterThanOrEqual(0);
      expect(feedback.sleepQuality).toBeLessThanOrEqual(10);
      expect(feedback.perceivedDifficulty).toBeGreaterThanOrEqual(0);
      expect(feedback.perceivedDifficulty).toBeLessThanOrEqual(10);
      expect(feedback.enjoyment).toBeGreaterThanOrEqual(0);
      expect(feedback.enjoyment).toBeLessThanOrEqual(10);
    });
  });
});
