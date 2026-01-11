/**
 * Modal de création de visioconférence instantanée
 * 
 * Permet au coach de créer une visio sans rendez-vous planifié
 * et de partager le lien avec le client
 */

import React, { useState, useEffect } from 'react';
import { X, Video, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { dailyService } from '../../services/dailyService';

interface InstantVideoModalProps {
  coachId: string;
  coachName: string;
  onClose: () => void;
}

export const InstantVideoModal: React.FC<InstantVideoModalProps> = ({
  coachId,
  coachName,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');

  useEffect(() => {
    createDailyRoom();
  }, []);

  const createDailyRoom = async () => {
    try {
      setIsCreating(true);
      setError(null);

      // Créer un nom de room unique
      const uniqueRoomName = `instant-${coachId.slice(0, 8)}-${Date.now()}`;

      // Créer la room Daily.co (expire dans 2 heures)
      const room = await dailyService.createRoom(uniqueRoomName, 120, {
        enable_knocking: false, // Pas de salle d'attente pour les visios instantanées
        enable_prejoin_ui: true, // UI de pré-connexion
        max_participants: 10, // Permettre plusieurs participants
      });

      setRoomUrl(room.url);
      setRoomName(room.name);
      setIsCreating(false);

      console.log('✅ Room Daily.co créée:', room.url);
    } catch (err: any) {
      console.error('❌ Erreur création room:', err);
      setError(err.message || 'Impossible de créer la salle de visioconférence');
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur copie lien:', error);
      toast.error('Impossible de copier le lien');
    }
  };

  const handleJoinMeeting = () => {
    // Extraire juste le nom de la room de l'URL Daily.co
    const roomId = roomName || roomUrl.split('/').pop();
    window.open(`${window.location.origin}/#/video/${roomId}`, '_blank');
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <Video className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={createDailyRoom}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Création de la salle...
            </h2>
            <p className="text-gray-600">
              Veuillez patienter pendant la création de votre salle de visioconférence
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Visio instantanée</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Votre salle de visioconférence est prête !
            </p>
            <p className="text-sm text-gray-500">
              Partagez ce lien avec votre client pour démarrer la visio
            </p>
          </div>

          {/* Lien de la visio */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lien de la visio
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={roomUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Copier le lien"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Informations */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">ℹ️ Informations</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Cette salle est accessible immédiatement</li>
              <li>• Le lien reste valide pendant 2 heures</li>
              <li>• Partagez-le par email, SMS ou messagerie</li>
              <li>• Pas de limite de temps de conversation</li>
            </ul>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handleJoinMeeting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Rejoindre la visio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
