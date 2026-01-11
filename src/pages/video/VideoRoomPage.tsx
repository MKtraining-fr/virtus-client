/**
 * Page de salle de visioconférence
 * 
 * Permet au coach et au client de rejoindre une visio instantanée
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, PhoneOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const VideoRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Attendre que le script Jitsi soit chargé
    const initJitsi = () => {
      if (!window.JitsiMeetExternalAPI) {
        console.error('Jitsi Meet API not loaded');
        setError('Impossible de charger la visioconférence. Veuillez réessayer.');
        setIsLoading(false);
        return;
      }

      if (!jitsiContainerRef.current) {
        return;
      }

      try {
        const domain = 'meet.jit.si';
        const options = {
          roomName: roomId,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: user?.email?.split('@')[0] || 'Utilisateur',
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: true,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'closedcaptions',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'profile',
              'chat',
              'recording',
              'livestreaming',
              'etherpad',
              'sharedvideo',
              'settings',
              'raisehand',
              'videoquality',
              'filmstrip',
              'invite',
              'feedback',
              'stats',
              'shortcuts',
              'tileview',
              'videobackgroundblur',
              'download',
              'help',
              'mute-everyone',
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          },
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;

        api.addEventListener('videoConferenceJoined', () => {
          console.log('Conference joined');
          setIsLoading(false);
        });

        api.addEventListener('readyToClose', () => {
          navigate(-1);
        });

        // Cacher le loader après 3 secondes même si l'événement ne se déclenche pas
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);

      } catch (err) {
        console.error('Error initializing Jitsi:', err);
        setError('Erreur lors de l\'initialisation de la visioconférence.');
        setIsLoading(false);
      }
    };

    // Vérifier si Jitsi est déjà chargé
    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      // Attendre que le script soit chargé
      const checkJitsi = setInterval(() => {
        if (window.JitsiMeetExternalAPI) {
          clearInterval(checkJitsi);
          initJitsi();
        }
      }, 100);

      // Timeout après 10 secondes
      setTimeout(() => {
        clearInterval(checkJitsi);
        if (!window.JitsiMeetExternalAPI) {
          setError('Impossible de charger Jitsi Meet. Vérifiez votre connexion internet.');
          setIsLoading(false);
        }
      }, 10000);
    }

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, [roomId, navigate, user]);

  const handleLeaveCall = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
    }
    navigate(-1);
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
      {/* Zone de vidéo */}
      <div ref={jitsiContainerRef} className="w-full h-full" />
      
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
