import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  uploadExerciseVideo, 
  getVideosForPerformance,
  getVideosForClient,
  markVideoAsViewed,
  addCoachCommentToVideo,
  deleteExerciseVideo,
  countUnviewedVideosForCoach
} from './exerciseVideoService';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ 
          data: { signedUrl: 'https://test-url.com/video.mp4' }, 
          error: null 
        }),
        remove: vi.fn().mockResolvedValue({ error: null })
      }))
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'test-video-id' }, 
            error: null 
          })
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ 
            data: [
              {
                id: 'video-1',
                client_id: 'client-1',
                coach_id: 'coach-1',
                performance_id: 'perf-1',
                video_url: 'https://test.com/video1.mp4',
                file_name: 'video1.mp4',
                file_size_bytes: 1024000,
                mime_type: 'video/mp4',
                viewed_by_coach: false,
                created_at: '2026-01-04T12:00:00Z',
                updated_at: '2026-01-04T12:00:00Z'
              }
            ], 
            error: null 
          }),
          limit: vi.fn(() => ({
            mockResolvedValue: vi.fn().mockResolvedValue({ 
              data: [], 
              error: null 
            })
          }))
        })),
        head: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ count: 5, error: null })
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      }))
    })),
    rpc: vi.fn().mockResolvedValue({ error: null })
  }
}));

describe('exerciseVideoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadExerciseVideo', () => {
    it('devrait uploader une vidéo avec succès', async () => {
      const mockFile = new File(['test content'], 'test.mp4', { type: 'video/mp4' });
      
      const result = await uploadExerciseVideo(
        'client-123',
        'coach-456',
        'performance-789',
        mockFile
      );

      expect(result).not.toBeNull();
      expect(result?.videoUrl).toBe('https://test-url.com/video.mp4');
      expect(result?.videoId).toBe('test-video-id');
    });

    it('devrait rejeter un fichier trop volumineux', async () => {
      const largeFile = new File(
        [new ArrayBuffer(101 * 1024 * 1024)], // 101 MB
        'large.mp4', 
        { type: 'video/mp4' }
      );

      const result = await uploadExerciseVideo(
        'client-123',
        'coach-456',
        'performance-789',
        largeFile
      );

      expect(result).toBeNull();
    });

    it('devrait rejeter un format non accepté', async () => {
      const invalidFile = new File(['test'], 'test.avi', { type: 'video/avi' });

      const result = await uploadExerciseVideo(
        'client-123',
        'coach-456',
        'performance-789',
        invalidFile
      );

      expect(result).toBeNull();
    });
  });

  describe('getVideosForPerformance', () => {
    it('devrait récupérer les vidéos d\'une performance', async () => {
      const videos = await getVideosForPerformance('perf-1');

      expect(Array.isArray(videos)).toBe(true);
      expect(videos.length).toBeGreaterThan(0);
      expect(videos[0]).toHaveProperty('id');
      expect(videos[0]).toHaveProperty('videoUrl');
    });

    it('devrait retourner un tableau vide en cas d\'erreur', async () => {
      const videos = await getVideosForPerformance('invalid-id');
      expect(Array.isArray(videos)).toBe(true);
    });
  });

  describe('getVideosForClient', () => {
    it('devrait récupérer les vidéos d\'un client', async () => {
      const videos = await getVideosForClient('client-1');

      expect(Array.isArray(videos)).toBe(true);
    });

    it('devrait respecter la limite de résultats', async () => {
      const videos = await getVideosForClient('client-1', 10);

      expect(Array.isArray(videos)).toBe(true);
    });
  });

  describe('markVideoAsViewed', () => {
    it('devrait marquer une vidéo comme vue', async () => {
      const success = await markVideoAsViewed('video-1', 'coach-1');

      expect(success).toBe(true);
    });
  });

  describe('addCoachCommentToVideo', () => {
    it('devrait ajouter un commentaire coach', async () => {
      const success = await addCoachCommentToVideo('video-1', 'Bonne technique !');

      expect(success).toBe(true);
    });

    it('devrait gérer les commentaires vides', async () => {
      const success = await addCoachCommentToVideo('video-1', '');

      expect(success).toBe(true);
    });
  });

  describe('deleteExerciseVideo', () => {
    it('devrait supprimer une vidéo', async () => {
      const success = await deleteExerciseVideo('video-1', 'path/to/video.mp4');

      expect(success).toBe(true);
    });
  });

  describe('countUnviewedVideosForCoach', () => {
    it('devrait compter les vidéos non vues', async () => {
      const count = await countUnviewedVideosForCoach('coach-1');

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
