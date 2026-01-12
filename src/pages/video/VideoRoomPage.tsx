/**
 * Page de salle de visioconférence avec Daily.co
 * 
 * Utilise le SDK Daily.co avec preAuth pour gérer les permissions
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
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    initializeCall();

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

      // Créer le call frame avec prejoin UI
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

      // Gérer les événements
      callFrame
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

      // Pre-auth pour demander les permissions avant de rejoindre
      console.log('🔐 Pre-auth...');
      await callFrame.preAuth({ url: roomUrl });
      
      console.log('✅ Pre-auth success');

      // Attendre un peu pour que l'UI se charge
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Démarrer la caméra
      console.log('📹 Starting camera...');
      await callFrame.startCamera();

      console.log('✅ Camera started, joining...');

      // Rejoindre la room
      await callFrame.join({
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
    if (callFrameRef.current) {
      try {
        callFrameRef.current.leave();
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
      <div ref={containerRef} className="w-full h-full relative" />
      
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
