/**
 * Page de salle de visioconférence avec Daily.co
 * 
 * Utilise le SDK Daily.co avec callObject pour gérer les permissions
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DailyIframe from '@daily-co/daily-js';
import { dailyService } from '../../services/dailyService';

const VideoRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPermissions, setNeedsPermissions] = useState(false);
  const callObjectRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    initializeCall();

    return () => {
      if (callObjectRef.current) {
        try {
          callObjectRef.current.destroy();
        } catch (e) {
          console.error('Error destroying call:', e);
        }
      }
    };
  }, [roomId, navigate, user]);

  const initializeCall = async () => {
    if (!containerRef.current) {
      return;
    }

    try {
      console.log('🔍 Récupération de la room:', roomId);

      // Récupérer les informations de la room
      const room = await dailyService.getRoom(roomId);
      const roomUrl = room.url;

      console.log('✅ Room trouvée:', roomUrl);

      // Créer un callObject (nécessaire pour preAuth)
      const callObject = DailyIframe.createCallObject();
      callObjectRef.current = callObject;

      // Gérer les événements
      callObject
        .on('loading', () => {
          console.log('⏳ Loading...');
        })
        .on('loaded', () => {
          console.log('✅ Loaded');
        })
        .on('started-camera', () => {
          console.log('📹 Camera started');
          setNeedsPermissions(false);
        })
        .on('camera-error', (event: any) => {
          console.error('📹 Camera error:', event);
          setNeedsPermissions(true);
        })
        .on('joining-meeting', () => {
          console.log('🚪 Joining meeting...');
        })
        .on('joined-meeting', () => {
          console.log('✅ Joined meeting!');
          setIsLoading(false);
          setNeedsPermissions(false);
        })
        .on('left-meeting', () => {
          console.log('👋 Left meeting');
          navigate(-1);
        })
        .on('error', (event: any) => {
          console.error('❌ Error:', event);
          if (event.errorMsg?.includes('permission')) {
            setNeedsPermissions(true);
            setError('Veuillez autoriser l\'accès à votre caméra et microphone');
          } else {
            setError(event.errorMsg || 'Erreur de connexion');
          }
          setIsLoading(false);
        });

      // Pre-auth pour demander les permissions
      console.log('🔐 Pre-auth...');
      await callObject.preAuth({ url: roomUrl });
      
      console.log('✅ Pre-auth success');

      // Démarrer la caméra pour déclencher la demande de permissions
      console.log('📹 Starting camera...');
      await callObject.startCamera();

      console.log('✅ Camera started, joining...');

      // Rejoindre la room
      await callObject.join({
        url: roomUrl,
        userName: user?.email?.split('@')[0] || 'Participant',
      });

      console.log('✅ Join initiated');

    } catch (err: any) {
      console.error('❌ Error:', err);
      
      if (err.message?.includes('not found') || err.message?.includes('404')) {
        setError('Cette salle n\'existe pas ou a expiré.');
      } else if (err.message?.includes('permission') || err.message?.includes('NotAllowedError')) {
        setNeedsPermissions(true);
        setError('Veuillez autoriser l\'accès à votre caméra et microphone dans les paramètres du navigateur.');
      } else {
        setError(err.message || 'Erreur de connexion');
      }
      
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (callObjectRef.current) {
      try {
        callObjectRef.current.leave();
      } catch (e) {
        console.error('Error leaving:', e);
      }
    }
    navigate(-1);
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setNeedsPermissions(false);
    initializeCall();
  };

  // Afficher la vidéo dans le container
  useEffect(() => {
    if (callObjectRef.current && containerRef.current) {
      // Créer un élément vidéo pour afficher le flux
      const videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'cover';
      
      containerRef.current.appendChild(videoElement);

      // Écouter les événements de track pour afficher la vidéo
      callObjectRef.current.on('track-started', (event: any) => {
        console.log('🎥 Track started:', event);
        if (event.track && event.track.kind === 'video') {
          const stream = new MediaStream([event.track]);
          videoElement.srcObject = stream;
        }
      });

      return () => {
        if (videoElement.parentNode) {
          videoElement.parentNode.removeChild(videoElement);
        }
      };
    }
  }, []);

  if (error) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          {needsPermissions ? (
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          ) : (
            <Video className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          
          <h2 className="text-xl font-semibold text-white mb-2">
            {needsPermissions ? 'Permissions requises' : 'Erreur de connexion'}
          </h2>
          
          <p className="text-gray-400 mb-6">{error}</p>

          {needsPermissions && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-300 mb-2">Pour activer les permissions :</p>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Cliquez sur le cadenas 🔒 dans la barre d'adresse</li>
                <li>Autorisez la caméra et le microphone</li>
                <li>Cliquez sur "Réessayer" ci-dessous</li>
              </ol>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col relative">
      {/* Zone de vidéo */}
      <div ref={containerRef} className="w-full h-full relative bg-black" />
      
      {/* Loader */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-10">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Connexion en cours...
            </h2>
            <p className="text-gray-400">
              Initialisation de la visioconférence
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Vous allez être invité à autoriser l'accès à votre caméra et microphone
            </p>
          </div>
        </div>
      )}

      {/* Bouton retour */}
      {!isLoading && (
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors shadow-lg z-20 flex items-center gap-2"
          title="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>
      )}
    </div>
  );
};

export default VideoRoomPage;
