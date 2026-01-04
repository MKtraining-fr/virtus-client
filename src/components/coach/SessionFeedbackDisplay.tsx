import React, { useState, useEffect } from 'react';
import { SessionFeedback, addCoachResponseToFeedback, markFeedbackAsViewed } from '../../services/sessionFeedbackService';
import Button from '../Button';

interface SessionFeedbackDisplayProps {
  feedback: SessionFeedback;
  onResponseAdded?: () => void;
  autoMarkAsViewed?: boolean;
}

const SessionFeedbackDisplay: React.FC<SessionFeedbackDisplayProps> = ({
  feedback,
  onResponseAdded,
  autoMarkAsViewed = true
}) => {
  const [coachResponse, setCoachResponse] = useState(feedback.coachResponse || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Marquer automatiquement comme vu si demandé
    if (autoMarkAsViewed && !feedback.viewedByCoach && feedback.id) {
      markFeedbackAsViewed(feedback.id);
    }
  }, [autoMarkAsViewed, feedback.viewedByCoach, feedback.id]);

  const renderStars = (value: number, label: string) => {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[180px]">
          {label}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={`text-lg ${i < value ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>
              ⭐
            </span>
          ))}
          <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[45px]">
            ({value}/10)
          </span>
        </div>
      </div>
    );
  };

  const handleSaveResponse = async () => {
    if (!coachResponse.trim() || !feedback.id) return;

    setIsSaving(true);
    const success = await addCoachResponseToFeedback(feedback.id, coachResponse);
    setIsSaving(false);

    if (success) {
      if (onResponseAdded) {
        onResponseAdded();
      }
    } else {
      alert('Erreur lors de l\'enregistrement de la réponse');
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {!feedback.viewedByCoach && (
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          )}
          <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
            📊 Feedback de séance
          </h4>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 text-sm font-medium"
        >
          {isExpanded ? '▼ Réduire' : '▶ Voir détails'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {renderStars(feedback.preFatigue, 'Fatigue pré-séance')}
          {renderStars(feedback.sleepQuality, 'Qualité du sommeil')}
          {renderStars(feedback.perceivedDifficulty, 'Difficulté perçue')}
          {renderStars(feedback.enjoyment, 'Plaisir')}

          {feedback.comment && (
            <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                💬 Commentaire client :
              </p>
              <p className="text-gray-800 dark:text-gray-200">{feedback.comment}</p>
            </div>
          )}

          <div className="mt-4">
            <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-2">
              🎯 Votre réponse :
            </label>
            <textarea
              value={coachResponse}
              onChange={(e) => setCoachResponse(e.target.value)}
              placeholder="Répondre au client..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
            />
            <Button
              onClick={handleSaveResponse}
              disabled={isSaving || !coachResponse.trim()}
              isLoading={isSaving}
              variant="primary"
              size="sm"
              className="mt-2"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer la réponse'}
            </Button>
          </div>

          {feedback.coachResponse && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">
                ✅ Votre réponse précédente :
              </p>
              <p className="text-green-800 dark:text-green-200">{feedback.coachResponse}</p>
            </div>
          )}
        </div>
      )}

      {!isExpanded && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Cliquez pour voir les détails du feedback
        </div>
      )}
    </div>
  );
};

export default SessionFeedbackDisplay;
