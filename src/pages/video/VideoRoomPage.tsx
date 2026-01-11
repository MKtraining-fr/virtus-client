/**
 * Page de salle de visioconférence avec Daily.co
 * 
 * Permet au coach et au client de rejoindre une visio instantanée
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, PhoneOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DailyIframe from '@daily-co/daily-js';
import { dailyService } from '../../services/dailyService';

const VideoRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    const initDaily = async () => {
      if (!containerRef.current) {
        return;
      }

      try {
        console.log('🔍 Récupération de la room:', roomId);

        // Récupérer les informations de la room depuis l'API Daily.co
        const room = await dailyService.getRoom(roomId);
        const roomUrl = room.url;

        console.log('✅ Room trouvée:', roomUrl);
        console.log('📋 Privacy:', room.privacy);

        // Créer le call frame Daily.co avec configuration minimale
        const callFrame = DailyIframe.createFrame(containerRef.current, {
          iframeStyle: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0,
          },
          showLeaveButton: true,
          showFullscreenButton: true,
          showLocalVideo: true,
          showParticipantsBar: true,
        });

        callFrameRef.current = callFrame;

        // Événements Daily.co
        callFrame
          .on('loading', () => {
            console.log('⏳ Loading...');
          })
          .on('loaded', () => {
            console.log('✅ Loaded');
          })
          .on('started-camera', () => {
            console.log('📹 Camera started');
          })
          .on('joining-meeting', () => {
            console.log('🚪 Joining meeting...');
          })
          .on('joined-meeting', () => {
            console.log('✅ Joined meeting successfully!');
            setIsLoading(false);
          })
          .on('left-meeting', () => {
            console.log('👋 Left meeting');
            navigate(-1);
          })
          .on('error', (event: any) => {
            console.error('❌ Daily.co error event:', event);
            setError(`Erreur: ${event.errorMsg || 'Impossible de rejoindre la visio'}`);
            setIsLoading(false);
          });

        // Rejoindre la room avec configuration minimale
        console.log('🚀 Attempting to join:', roomUrl);
        
        try {
          await callFrame.join({
            url: roomUrl,
            userName: user?.email?.split('@')[0] || 'Participant',
            // Configuration minimale pour éviter les problèmes
          });
          
          console.log('✅ Join command sent');
        } catch (joinError: any) {
          console.error('❌ Join error:', joinError);
          throw joinError;
        }

        // Timeout de sécurité plus long
        setTimeout(() => {
          if (isLoading) {
            console.warn('⚠️ Timeout: forcing loading to false');
            setIsLoading(false);
          }
        }, 10000);

      } catch (err: any) {
        console.error('❌ Error initializing Daily.co:', err);
        
        // Message d'erreur plus explicite
        if (err.message?.includes('not found') || err.message?.includes('404')) {
          setError('Cette salle de visioconférence n\'existe pas ou a expiré.');
        } else if (err.message?.includes('not allowed')) {
          setError('Accès refusé à cette salle de visioconférence.');
        } else {
          setError(err.message || 'Erreur lors de l\'initialisation de la visioconférence.');
        }
        
        setIsLoading(false);
      }
    };

    initDaily();

    return () => {
      if (callFrameRef.current) {
        try {
          callFrameRef.current.destroy();
        } catch (e) {
          console.error('Error destroying call frame:', e);
        }
      }
    };
  }, [roomId, navigate, user]);

  const handleLeaveCall = () => {
    if (callFrameRef.current) {
      try {
        callFrameRef.current.leave();
      } catch (e) {
        console.error('Error leaving call:', e);
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
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
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col relative">
      {/* Zone de vidéo Daily.co */}
      <div ref={containerRef} className="w-full h-full relative" />
      
      {/* Loader */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-10">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Connexion à la visioconférence...
            </h2>
            <p className="text-gray-400">
              Veuillez patienter pendant le chargement de la salle
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Cela peut prendre quelques secondes
            </p>
          </div>
        </div>
      )}

      {/* Bouton de secours pour quitter */}
      {!isLoading && (
        <button
          onClick={handleLeaveCall}
          className="absolute top-4 right-4 p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors shadow-lg z-20"
          title="Quitter la visio"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default VideoRoomPage;
