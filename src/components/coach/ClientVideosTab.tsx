import React, { useState, useEffect } from 'react';
import { getVideosForClient, markVideoAsViewed, addCoachCommentToVideo } from '../../services/exerciseVideoService';
import VideoPlayerModal from './VideoPlayerModal';
import Card from '../Card';
import Button from '../Button';

import { ExerciseVideo } from '../../services/exerciseVideoService';

interface Video extends ExerciseVideo {
  // Hérite de toutes les propriétés d'ExerciseVideo
}

interface ClientVideosTabProps {
  clientId: string;
  coachId: string;
}

const ClientVideosTab: React.FC<ClientVideosTabProps> = ({ clientId, coachId }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'viewed'>('all');

  useEffect(() => {
    fetchVideos();
  }, [clientId]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const data = await getVideosForClient(clientId);
      setVideos(data);
    } catch (error) {
      console.error('Erreur chargement vidéos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = async (video: Video) => {
    setSelectedVideo(video);
    
    // Marquer comme vue si ce n'est pas déjà fait
    if (!video.viewedByCoach) {
      await markVideoAsViewed(video.id, coachId);
      // Mettre à jour localement
      setVideos(videos.map(v => 
        v.id === video.id 
          ? { ...v, viewedByCoach: true, viewedAt: new Date().toISOString() }
          : v
      ));
    }
  };

  const handleAddComment = async (videoId: string, comment: string) => {
    try {
      await addCoachCommentToVideo(videoId, comment);
      // Mettre à jour localement
      setVideos(videos.map(v => 
        v.id === videoId 
          ? { ...v, coachComment: comment }
          : v
      ));
      setSelectedVideo(null);
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
    }
  };

  // Filtrer les vidéos
  const filteredVideos = videos.filter(video => {
    if (filter === 'new') return !video.viewedByCoach;
    if (filter === 'viewed') return video.viewedByCoach;
    return true;
  });

  // Grouper par exercice
  const videosByExercise = filteredVideos.reduce((acc, video) => {
    const key = video.exerciseName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(video);
    return acc;
  }, {} as Record<string, Video[]>);

  const newVideosCount = videos.filter(v => !v.viewedByCoach).length;

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">Chargement des vidéos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vidéos d'exercices</h2>
          <p className="text-gray-600 mt-1">
            {videos.length} vidéo{videos.length > 1 ? 's' : ''} uploadée{videos.length > 1 ? 's' : ''}
            {newVideosCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {newVideosCount} nouvelle{newVideosCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes ({videos.length})
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'new'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Nouvelles ({newVideosCount})
          </button>
          <button
            onClick={() => setFilter('viewed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'viewed'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Vues ({videos.filter(v => v.viewedByCoach).length})
          </button>
        </div>
      </div>

      {/* Liste des vidéos groupées par exercice */}
      {filteredVideos.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <p className="text-gray-600">
              {filter === 'new' 
                ? 'Aucune nouvelle vidéo' 
                : filter === 'viewed'
                ? 'Aucune vidéo vue'
                : 'Aucune vidéo uploadée'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(videosByExercise).map(([exerciseName, exerciseVideos]) => (
            <Card key={exerciseName}>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {exerciseName}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({exerciseVideos.length} vidéo{exerciseVideos.length > 1 ? 's' : ''})
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exerciseVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => handleVideoClick(video)}
                      className="relative cursor-pointer group"
                    >
                      {/* Thumbnail vidéo */}
                      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                        <video
                          src={video.videoUrl}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>

                        {/* Badge "Nouvelle" */}
                        {!video.viewedByCoach && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            🔴 Nouvelle
                          </div>
                        )}

                        {/* Badge commentaire */}
                        {video.coachComment && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            💬 Commenté
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          {new Date(video.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {video.setIndex !== undefined && (
                          <p className="text-xs text-gray-500">Série {video.setIndex + 1}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal lecteur vidéo */}
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          exerciseName={selectedVideo.exerciseName || 'Exercice'}
          performanceDetails={`Série ${(selectedVideo.setIndex || 0) + 1}`}
          onClose={() => setSelectedVideo(null)}
          onCommentAdded={() => fetchVideos()}
        />
      )}
    </div>
  );
};

export default ClientVideosTab;
