import React, { useState, useEffect } from 'react';
import { X, Save, Dumbbell } from 'lucide-react';
import { ClientTrainingInfo, upsertClientTrainingInfo } from '../../services/clientTrainingInfoService';
import { useAuth } from '../../context/AuthContext';

interface EditTrainingInfoModalProps {
  clientId: string;
  trainingInfo: ClientTrainingInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (trainingInfo: ClientTrainingInfo) => void;
}

export const EditTrainingInfoModal: React.FC<EditTrainingInfoModalProps> = ({
  clientId,
  trainingInfo,
  isOpen,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<ClientTrainingInfo>>({
    experience: '',
    training_since: '',
    sessions_per_week: undefined,
    session_duration: undefined,
    training_type: '',
    issues: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trainingInfo) {
      setFormData({
        experience: trainingInfo.experience || '',
        training_since: trainingInfo.training_since || '',
        sessions_per_week: trainingInfo.sessions_per_week || undefined,
        session_duration: trainingInfo.session_duration || undefined,
        training_type: trainingInfo.training_type || '',
        issues: trainingInfo.issues || '',
      });
    }
  }, [trainingInfo]);

  const handleChange = (field: keyof ClientTrainingInfo, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const dataToSave: ClientTrainingInfo = {
        client_id: clientId,
        experience: formData.experience || undefined,
        training_since: formData.training_since || undefined,
        sessions_per_week: formData.sessions_per_week || undefined,
        session_duration: formData.session_duration || undefined,
        training_type: formData.training_type || undefined,
        issues: formData.issues || undefined,
      };

      const savedData = await upsertClientTrainingInfo(dataToSave, user.id);
      onSave(savedData);
      onClose();
    } catch (err) {
      console.error('Error saving training info:', err);
      setError('Erreur lors de la sauvegarde des informations');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Objectifs et Conditions d'Entraînement
              </h3>
              <p className="text-sm text-gray-500">Modifier les informations d'entraînement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Expérience sportive */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expérience sportive
            </label>
            <textarea
              value={formData.experience || ''}
              onChange={(e) => handleChange('experience', e.target.value)}
              placeholder="Décrivez l'expérience sportive du client..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Pratique musculation depuis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pratique la musculation depuis
            </label>
            <input
              type="text"
              value={formData.training_since || ''}
              onChange={(e) => handleChange('training_since', e.target.value)}
              placeholder="Ex: 2 ans, 6 mois..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Séances par semaine et durée */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Séances par semaine
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.sessions_per_week || ''}
                onChange={(e) => handleChange('sessions_per_week', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ex: 4"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée des séances (minutes)
              </label>
              <input
                type="number"
                min="0"
                max="300"
                value={formData.session_duration || ''}
                onChange={(e) => handleChange('session_duration', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ex: 60"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type d'entraînement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'entraînement
            </label>
            <input
              type="text"
              value={formData.training_type || ''}
              onChange={(e) => handleChange('training_type', e.target.value)}
              placeholder="Ex: Musculation, CrossFit, Powerlifting..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Problématique */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Problématique / Objectifs spécifiques
            </label>
            <textarea
              value={formData.issues || ''}
              onChange={(e) => handleChange('issues', e.target.value)}
              placeholder="Décrivez les problématiques ou objectifs spécifiques..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTrainingInfoModal;
