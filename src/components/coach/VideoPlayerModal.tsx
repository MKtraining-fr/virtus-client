import React, { useState, useEffect } from 'react';
import { ExerciseVideo, markVideoAsViewed, addCoachCommentToVideo } from '../../services/exerciseVideoService';
import Button from '../Button';

interface VideoPlayerModalProps {
  video: ExerciseVideo;
  exerciseName: string;
  performanceDetails: string;
  onClose: () => void;
  onCommentAdded?: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  exerciseName,
  performanceDetails,
  onClose,
  onCommentAdded
}) => {
  const [comment, setComment] = useState(video?.coachComment || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    // Marquer comme vu dès l'ouverture de la modal
    if (!video.viewedByCoach && video.coachId) {
      markVideoAsViewed(video.id, video.coachId);
    }
  }, [video.id, video.coachId, video.viewedByCoach]);

  const handlePlay = () => {
    if (!hasPlayed) {
      setHasPlayed(true);
      // Marquer comme vu lors de la première lecture
      if (video.coachId) {
        markVideoAsViewed(video.id, video.coachId);
      }
    }
  };

  const handleSaveComment = async () => {
    if (!comment.trim()) return;

    setIsSaving(true);
    const success = await addCoachCommentToVideo(video.id, comment);
    setIsSaving(false);

    if (success) {
      if (onCommentAdded) {
        onCommentAdded();
      }
      // Optionnel : fermer la modal après sauvegarde
      // onClose();
    } else {
      alert('Erreur lors de l\'enregistrement du commentaire');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {exerciseName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{performanceDetails}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl font-light leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lecteur vidéo */}
          <div className="relative">
            <video
              src={video.videoUrl}
              controls
              className="w-full rounded-lg bg-black shadow-lg"
              onPlay={handlePlay}
              preload="metadata"
            />
            {!video.viewedByCoach && !hasPlayed && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                🔴 Non visionné
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📅 Uploadée le
              </p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {formatDate(video.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💾 Taille du fichier
              </p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {formatFileSize(video.fileSizeBytes)}
              </p>
            </div>
            {video.durationSeconds && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ⏱️ Durée
                </p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {Math.floor(video.durationSeconds / 60)}:{(video.durationSeconds % 60).toString().padStart(2, '0')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📹 Format
              </p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {video.mimeType.split('/')[1].toUpperCase()}
              </p>
            </div>
          </div>

          {/* Commentaire existant (si présent) */}
          {video.coachComment && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">
                ✅ Votre commentaire précédent :
              </p>
              <p className="text-green-800 dark:text-green-200">{video.coachComment}</p>
            </div>
          )}

          {/* Commentaire coach */}
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-2">
              💬 {video.coachComment ? 'Modifier votre commentaire :' : 'Ajouter un commentaire technique :'}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Exemple : Bonne amplitude, attention à garder le dos droit lors de la descente..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={4}
            />
            <div className="flex gap-3 mt-3">
              <Button
                onClick={handleSaveComment}
                disabled={isSaving || !comment.trim()}
                isLoading={isSaving}
                variant="primary"
              >
                {isSaving ? 'Enregistrement...' : video.coachComment ? 'Mettre à jour' : 'Enregistrer le commentaire'}
              </Button>
              <Button onClick={onClose} variant="secondary">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;
