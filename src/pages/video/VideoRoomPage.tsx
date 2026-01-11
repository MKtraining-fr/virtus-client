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
        // Construire l'URL de la room Daily.co
        const dailyDomain = import.meta.env.VITE_DAILY_DOMAIN;
        const roomUrl = dailyDomain 
          ? `https://${dailyDomain}/${roomId}`
          : `https://${roomId}.daily.co/${roomId}`;

        console.log('Joining Daily.co room:', roomUrl);

        // Créer le call frame Daily.co
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
        });

        callFrameRef.current = callFrame;

        // Événements Daily.co
        callFrame
          .on('joined-meeting', () => {
            console.log('✅ Joined meeting');
            setIsLoading(false);
          })
          .on('left-meeting', () => {
            console.log('👋 Left meeting');
            navigate(-1);
          })
          .on('error', (error: any) => {
            console.error('❌ Daily.co error:', error);
            setError('Erreur de connexion à la visioconférence');
            setIsLoading(false);
          });

        // Rejoindre la room
        await callFrame.join({
          url: roomUrl,
          userName: user?.email?.split('@')[0] || 'Utilisateur',
        });

        // Timeout de sécurité
        setTimeout(() => {
          if (isLoading) {
            setIsLoading(false);
          }
        }, 5000);

      } catch (err: any) {
        console.error('Error initializing Daily.co:', err);
        setError(err.message || 'Erreur lors de l\'initialisation de la visioconférence.');
        setIsLoading(false);
      }
    };

    initDaily();

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
    };
  }, [roomId, navigate, user, isLoading]);

  const handleLeaveCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
    } else {
      navigate(-1);
    }
  };

  if (error) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Connexion à la visioconférence...
            </h2>
            <p className="text-gray-400">
              Veuillez patienter pendant le chargement de la salle
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
