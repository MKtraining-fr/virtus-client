/**
 * Configuration pour les vidéos d'exercices
 */
export const VIDEO_CONFIG = {
  MAX_SIZE_MB: 100,
  MAX_DURATION_SECONDS: 180, // 3 minutes
  ACCEPTED_FORMATS: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'],
  ACCEPTED_MIME_TYPES: ['video/mp4', 'video/quicktime', 'video/webm'],
  COMPRESSION: {
    maxWidth: 1920,
    maxHeight: 1080,
    fps: 30,
    bitrate: '2M'
  }
};

export const BUCKET_NAMES = {
  EXERCISE_VIDEOS: 'exercise-videos',
  CLIENT_DOCUMENTS: 'client-documents',
  VOICE_MESSAGES: 'voice-messages'
};
