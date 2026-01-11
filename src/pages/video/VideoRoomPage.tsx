/**
 * Page de salle de visioconférence avec Daily.co
 * 
 * Utilise l'iframe Daily.co directement pour une intégration simple et fiable
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, ArrowLeft, Loader2 } from 'lucide-react';
import { dailyService } from '../../services/dailyService';

const VideoRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string>('');

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    const loadRoom = async () => {
      try {
        console.log('🔍 Chargement de la room:', roomId);

        // Récupérer les informations de la room
        const room = await dailyService.getRoom(roomId);
        
        console.log('✅ Room trouvée:', room.url);
        console.log('📋 Privacy:', room.privacy);

        setRoomUrl(room.url);
        setIsLoading(false);

      } catch (err: any) {
        console.error('❌ Erreur chargement room:', err);
        
        if (err.message?.includes('not found') || err.message?.includes('404')) {
          setError('Cette salle de visioconférence n\'existe pas ou a expiré.');
        } else {
          setError(err.message || 'Erreur lors du chargement de la salle.');
        }
        
        setIsLoading(false);
      }
    };

    loadRoom();
  }, [roomId, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  if (error) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Video className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Erreur de connexion
          </h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Chargement de la salle...
          </h2>
          <p className="text-gray-400">
            Veuillez patienter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col relative">
      {/* Bouton retour */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors shadow-lg z-20 flex items-center gap-2"
        title="Retour"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Retour</span>
      </button>

      {/* Iframe Daily.co */}
      <iframe
        src={roomUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="w-full h-full border-0"
        title="Visioconférence Daily.co"
      />
    </div>
  );
};

export default VideoRoomPage;
