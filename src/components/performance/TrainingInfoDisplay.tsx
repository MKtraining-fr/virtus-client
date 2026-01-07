import React, { useState, useEffect } from 'react';
import { Dumbbell, Edit2, Target, Calendar, Clock, Activity } from 'lucide-react';
import { ClientTrainingInfo, getClientTrainingInfo } from '../../services/clientTrainingInfoService';
import { EditTrainingInfoModal } from './EditTrainingInfoModal';

interface TrainingInfoDisplayProps {
  clientId: string;
}

export const TrainingInfoDisplay: React.FC<TrainingInfoDisplayProps> = ({ clientId }) => {
  const [trainingInfo, setTrainingInfo] = useState<ClientTrainingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTrainingInfo();
  }, [clientId]);

  const fetchTrainingInfo = async () => {
    setIsLoading(true);
    try {
      const data = await getClientTrainingInfo(clientId);
      setTrainingInfo(data);
    } catch (error) {
      console.error('Error fetching training info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (updatedInfo: ClientTrainingInfo) => {
    setTrainingInfo(updatedInfo);
  };

  const formatValue = (value: string | number | undefined): string => {
    if (value === undefined || value === null || value === '') {
      return 'Non renseigné';
    }
    return String(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* En-tête avec bouton Modifier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Objectifs et Conditions d'Entraînement</h4>
              <p className="text-xs text-gray-500">
                Informations sur l'expérience et les habitudes d'entraînement
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Edit2 className="h-4 w-4" />
            Modifier
          </button>
        </div>

        {/* Grille des informations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expérience sportive */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expérience sportive
              </span>
            </div>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {formatValue(trainingInfo?.experience)}
            </p>
          </div>

          {/* Pratique musculation depuis */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pratique musculation depuis
              </span>
            </div>
            <p className="text-sm text-gray-900">
              {formatValue(trainingInfo?.training_since)}
            </p>
          </div>

          {/* Séances par semaine */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Séances par semaine
              </span>
            </div>
            <p className="text-sm text-gray-900">
              {trainingInfo?.sessions_per_week 
                ? `${trainingInfo.sessions_per_week} séance${trainingInfo.sessions_per_week > 1 ? 's' : ''}`
                : 'Non renseigné'}
            </p>
          </div>

          {/* Durée des séances */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durée des séances
              </span>
            </div>
            <p className="text-sm text-gray-900">
              {trainingInfo?.session_duration 
                ? `${trainingInfo.session_duration} minutes`
                : 'Non renseigné'}
            </p>
          </div>

          {/* Type d'entraînement */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type d'entraînement
              </span>
            </div>
            <p className="text-sm text-gray-900">
              {formatValue(trainingInfo?.training_type)}
            </p>
          </div>

          {/* Problématique - Prend toute la largeur */}
          <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Problématique / Objectifs spécifiques
              </span>
            </div>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {formatValue(trainingInfo?.issues)}
            </p>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      <EditTrainingInfoModal
        clientId={clientId}
        trainingInfo={trainingInfo}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
};

export default TrainingInfoDisplay;
