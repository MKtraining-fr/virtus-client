/**
 * Modal de création de visioconférence instantanée
 * 
 * Permet au coach de créer une visio sans rendez-vous planifié
 * et de partager le lien avec le client
 */

import React, { useState } from 'react';
import { X, Video, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  const [roomId] = useState(() => {
    // Générer un ID de salle unique
    return `instant-${coachId.slice(0, 8)}-${Date.now()}`;
  });

  // URL de la visio (à adapter selon votre système de visio)
  const videoUrl = `${window.location.origin}/#/video/${roomId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur copie lien:', error);
      toast.error('Impossible de copier le lien');
    }
  };

  const handleJoinMeeting = () => {
    window.open(videoUrl, '_blank');
  };

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
                value={videoUrl}
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
              <li>• Le lien reste valide pendant 24 heures</li>
              <li>• Partagez-le par email, SMS ou messagerie</li>
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
