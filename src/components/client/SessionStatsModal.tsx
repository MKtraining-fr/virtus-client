import React, { useState, useMemo } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { ExerciseLog, PerformanceLog } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { TrophyIcon, XMarkIcon, ChevronDoubleRightIcon } from '../../constants/icons';
import { 
  calculateSessionStats, 
  formatPercentageChange, 
  formatTonnage,
  SessionStats 
} from '../../services/sessionStatsService';
import { saveSessionFeedback, SessionFeedback } from '../../services/sessionFeedbackService';

interface SessionStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionName: string;
  sessionId: string;
  exerciseLogs: ExerciseLog[];
  activeSession: {
    name: string;
    exercises: Array<{
      id: number;
      exerciseId: number;
      name: string;
      sets: string;
      details?: Array<{
        load: { value: string; unit: string };
        reps: string;
        rest: string;
        tempo: string;
      }>;
    }>;
  };
  previousWeekLog?: PerformanceLog;
  clientId: string;
  performanceLogId?: string;
}

const SessionStatsModal: React.FC<SessionStatsModalProps> = ({
  isOpen,
  onClose,
  sessionName,
  sessionId,
  exerciseLogs,
  activeSession,
  previousWeekLog,
  clientId,
  performanceLogId,
}) => {
  const { theme, addNotification } = useAuth();
  
  // État pour le questionnaire
  const [feedback, setFeedback] = useState<{
    preFatigue: number | null;
    sleepQuality: number | null;
    perceivedDifficulty: number | null;
    enjoyment: number | null;
    comment: string;
  }>({
    preFatigue: null,
    sleepQuality: null,
    perceivedDifficulty: null,
    enjoyment: null,
    comment: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Calcul des statistiques
  const stats: SessionStats = useMemo(() => {
    return calculateSessionStats(exerciseLogs, activeSession, previousWeekLog);
  }, [exerciseLogs, activeSession, previousWeekLog]);

  // Formatage des changements de performance
  const tonnageChangeFormatted = formatPercentageChange(stats.tonnageChange);
  const loadChangeFormatted = formatPercentageChange(stats.loadChange);
  const repsChangeFormatted = formatPercentageChange(stats.repsChange);

  // Gestion des changements de feedback
  const handleFeedbackChange = (field: keyof typeof feedback, value: number | string) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  // Sauvegarde du feedback (optionnelle)
  const handleSaveFeedback = async () => {
    const { preFatigue, sleepQuality, perceivedDifficulty, enjoyment, comment } = feedback;
    
    // Vérifier qu'au moins une question a été répondue
    if (
      preFatigue === null && 
      sleepQuality === null && 
      perceivedDifficulty === null && 
      enjoyment === null &&
      !comment.trim()
    ) {
      // Aucune donnée à sauvegarder, fermer directement
      onClose();
      return;
    }

    setIsSaving(true);

    const feedbackData: SessionFeedback = {
      clientId,
      sessionId,
      performanceLogId,
      preFatigue: preFatigue ?? 5,
      sleepQuality: sleepQuality ?? 5,
      perceivedDifficulty: perceivedDifficulty ?? 5,
      enjoyment: enjoyment ?? 5,
      comment: comment.trim() || undefined,
    };

    const savedId = await saveSessionFeedback(feedbackData);

    setIsSaving(false);

    if (savedId) {
      addNotification({
        message: 'Merci pour ton feedback !',
        type: 'success',
      });
    } else {
      addNotification({
        message: 'Impossible de sauvegarder le feedback.',
        type: 'error',
      });
    }

    onClose();
  };

  // Composant de slider pour les questions
  const QuestionSlider: React.FC<{
    label: string;
    minLabel: string;
    maxLabel: string;
    value: number | null;
    onChange: (value: number) => void;
  }> = ({ label, minLabel, maxLabel, value, onChange }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-client-light">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-600 dark:text-client-subtle w-20 text-right">
          {minLabel}
        </span>
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={value ?? 5}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="flex-1 h-2 bg-gray-200 dark:bg-client-dark rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <span className="text-xs text-gray-600 dark:text-client-subtle w-20">
          {maxLabel}
        </span>
        <span className="text-lg font-bold text-primary w-8 text-center">
          {value ?? 5}
        </span>
      </div>
    </div>
  );

  // Composant de métrique statistique
  const StatCard: React.FC<{
    label: string;
    value: string | number;
    change?: { text: string; color: string; icon: string };
    highlight?: boolean;
  }> = ({ label, value, change, highlight }) => (
    <div
      className={`p-4 rounded-lg ${
        highlight
          ? 'bg-primary/10 dark:bg-primary/20 border-2 border-primary'
          : 'bg-gray-50 dark:bg-client-dark'
      }`}
    >
      <p className="text-xs font-medium text-gray-600 dark:text-client-subtle mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-gray-900 dark:text-client-light'}`}>
        {value}
      </p>
      {change && (
        <p className={`text-sm font-medium mt-1 ${change.color}`}>
          <span className="mr-1">{change.icon}</span>
          {change.text}
        </p>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Statistiques de Séance"
      theme={theme}
      size="xl"
    >
      {/* Bouton de fermeture en haut à droite */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-client-subtle dark:hover:text-client-light transition-colors"
        aria-label="Fermer"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* PANNEAU GAUCHE : STATISTIQUES */}
        <div className="space-y-4">
          {/* En-tête avec trophée */}
          <div className="text-center pb-4 border-b border-gray-200 dark:border-client-dark">
            <TrophyIcon className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-client-light">
              Séance Terminée !
            </h3>
            <p className="text-sm text-gray-600 dark:text-client-subtle">
              {sessionName}
            </p>
          </div>

          {/* Taux de complétion */}
          <StatCard
            label="Taux de Complétion"
            value={`${stats.completionRate}%`}
            highlight={stats.completionRate === 100}
          />

          {/* Grille de métriques */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Séries Réalisées"
              value={`${stats.completedSets}/${stats.totalSets}`}
            />
            <StatCard
              label="Exercices"
              value={`${stats.completedExercises}/${stats.totalExercises}`}
            />
          </div>

          {/* Métriques de performance */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-client-light">
              Performances
            </h4>
            
            <StatCard
              label="Tonnage Total"
              value={formatTonnage(stats.totalTonnage)}
              change={tonnageChangeFormatted}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Charge Moyenne"
                value={`${stats.averageLoad} ${stats.loadUnit}`}
                change={loadChangeFormatted}
              />
              <StatCard
                label="Reps Moyennes"
                value={stats.averageReps}
                change={repsChangeFormatted}
              />
            </div>
          </div>

          {/* Message de comparaison */}
          {!previousWeekLog && (
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🎯 Première séance de ce type ! Continue comme ça !
              </p>
            </div>
          )}
        </div>

        {/* PANNEAU DROIT : QUESTIONNAIRE */}
        <div className="space-y-4 border-l border-gray-200 dark:border-client-dark pl-6">
          {/* Indicateur de flèche */}
          <div className="flex items-center gap-2 mb-4">
            <ChevronDoubleRightIcon className="w-5 h-5 text-primary animate-pulse" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-client-light">
              Ton Ressenti
            </h4>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <QuestionSlider
              label="Étais-tu fatigué(e) avant de débuter la séance ?"
              minLabel="Très fatigué(e)"
              maxLabel="En pleine forme"
              value={feedback.preFatigue}
              onChange={(value) => handleFeedbackChange('preFatigue', value)}
            />

            <QuestionSlider
              label="As-tu bien dormi(e) la veille de la séance ?"
              minLabel="Très mal dormi(e)"
              maxLabel="Très bien dormi(e)"
              value={feedback.sleepQuality}
              onChange={(value) => handleFeedbackChange('sleepQuality', value)}
            />

            <QuestionSlider
              label="As-tu trouvé(e) la séance difficile physiquement ?"
              minLabel="Balade de santé"
              maxLabel="Très difficile"
              value={feedback.perceivedDifficulty}
              onChange={(value) => handleFeedbackChange('perceivedDifficulty', value)}
            />

            <QuestionSlider
              label="As-tu aimé(e) la séance ?"
              minLabel="Pas aimé(e)"
              maxLabel="J'ai adoré(e)"
              value={feedback.enjoyment}
              onChange={(value) => handleFeedbackChange('enjoyment', value)}
            />
          </div>

          {/* Zone de commentaire */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-client-light">
              Commentaire (optionnel)
            </label>
            <textarea
              value={feedback.comment}
              onChange={(e) => handleFeedbackChange('comment', e.target.value)}
              placeholder="Ajoute un commentaire sur ta séance..."
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-client-dark rounded-lg bg-white dark:bg-client-card text-gray-900 dark:text-client-light placeholder-gray-400 dark:placeholder-client-subtle focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-client-subtle text-right">
              {feedback.comment.length}/500
            </p>
          </div>

          {/* Bouton de validation */}
          <Button
            onClick={handleSaveFeedback}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Enregistrement...' : 'Valider et Continuer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SessionStatsModal;
