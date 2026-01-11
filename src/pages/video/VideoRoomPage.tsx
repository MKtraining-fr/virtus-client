/**
 * Page de salle de visioconférence
 * 
 * Permet au coach et au client de rejoindre une visio instantanée
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Users, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const VideoRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [participants, setParticipants] = useState(1);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Ici, vous intégrerez votre solution de visio (Jitsi, Daily.co, etc.)
    console.log('Joining room:', roomId);
    
    // Exemple avec Jitsi Meet
    initializeJitsiMeet();

    return () => {
      // Cleanup
    };
  }, [roomId, navigate]);

  const initializeJitsiMeet = () => {
    // Vérifier si Jitsi est disponible
    if (typeof window === 'undefined' || !(window as any).JitsiMeetExternalAPI) {
      console.error('Jitsi Meet API not loaded');
      return;
    }

    const domain = 'meet.jit.si';
    const options = {
      roomName: roomId,
      width: '100%',
      height: '100%',
      parentNode: document.querySelector('#jitsi-container'),
      userInfo: {
        displayName: user?.email || 'Utilisateur',
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
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
      },
    };

    const api = new (window as any).JitsiMeetExternalAPI(domain, options);

    api.addEventListener('videoConferenceJoined', () => {
      console.log('Conference joined');
    });

    api.addEventListener('participantJoined', () => {
      setParticipants((prev) => prev + 1);
    });

    api.addEventListener('participantLeft', () => {
      setParticipants((prev) => Math.max(1, prev - 1));
    });

    api.addEventListener('readyToClose', () => {
      navigate(-1);
    });
  };

  const handleLeaveCall = () => {
    if (window.confirm('Êtes-vous sûr de vouloir quitter la visioconférence ?')) {
      navigate(-1);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col">
      {/* En-tête */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Video className="w-5 h-5" />
            <span className="font-medium">Visioconférence</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users className="w-4 h-4" />
            <span>{participants} participant{participants > 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="text-gray-400 text-sm">
          Salle: {roomId?.split('-').pop()}
        </div>
      </div>

      {/* Zone de vidéo */}
      <div className="flex-1 relative">
        <div id="jitsi-container" className="w-full h-full" />
        
        {/* Message si Jitsi n'est pas chargé */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Connexion à la visioconférence...
            </h2>
            <p className="text-gray-400">
              Veuillez patienter pendant le chargement de la salle
            </p>
          </div>
        </div>
      </div>

      {/* Barre de contrôle */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-4 rounded-full transition-colors ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Couper le micro' : 'Activer le micro'}
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            className={`p-4 rounded-full transition-colors ${
              isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoEnabled ? 'Couper la caméra' : 'Activer la caméra'}
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={handleLeaveCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
            title="Quitter la visio"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            title="Chat"
          >
            <MessageSquare className="w-6 h-6" />
          </button>

          <button
            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            title="Paramètres"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoRoomPage;
