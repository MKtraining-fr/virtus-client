import React, { useState, useMemo } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { ExerciseLog } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { TrophyIcon } from '../../constants/icons';

interface SessionRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionName: string;
  exerciseLogs: ExerciseLog[];
  clientName: string;
}

const questionnaireItems = [
  { id: 'difficulty', label: 'Comment avez-vous trouvé la difficulté de la séance ?' },
  { id: 'enjoyment', label: 'Avez-vous apprécié cette séance ?' },
  { id: 'energy', label: "Comment était votre niveau d'énergie ?" },
  { id: 'pain', label: 'Avez-vous ressenti une douleur anormale ?' },
];

const Rating: React.FC<{
  questionId: string;
  value: number | null;
  onChange: (value: number) => void;
}> = ({ questionId, value, onChange }) => (
  <div className="flex justify-center gap-2">
    {[1, 2, 3, 4, 5].map((num) => (
      <label key={num} className="cursor-pointer">
        <input
          type="radio"
          name={questionId}
          value={num}
          checked={value === num}
          onChange={() => onChange(num)}
          className="sr-only"
        />
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${value === num ? 'bg-primary text-white scale-110' : 'bg-gray-200 dark:bg-client-dark text-gray-700 dark:text-client-light hover:bg-gray-300'}`}
        >
          {num}
        </span>
      </label>
    ))}
  </div>
);

const SessionRecapModal: React.FC<SessionRecapModalProps> = ({
  isOpen,
  onClose,
  sessionName,
  exerciseLogs,
  clientName,
}) => {
  const { theme } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number | null>>({
    difficulty: null,
    enjoyment: null,
    energy: null,
    pain: null,
  });

  const tokensEarned = useMemo(() => {
    return exerciseLogs.reduce((total, log) => total + log.loggedSets.length, 0);
  }, [exerciseLogs]);

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Récapitulatif de la séance`}
      theme={theme}
      size="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Summary */}
        <div className="space-y-4">
          <div className="text-center">
            <TrophyIcon className="w-16 h-16 text-yellow-400 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-client-light mt-2">
              Félicitations, {clientName} !
            </h2>
            <p className="text-gray-600 dark:text-client-subtle">
              Vous avez terminé la séance : <span className="font-semibold">{sessionName}</span>
            </p>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 bg-gray-50 dark:bg-client-dark p-3 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-client-light">
              Exercices réalisés :
            </h3>
            {exerciseLogs.map((log) => (
              <div key={log.exerciseId} className="text-sm">
                <p className="font-semibold text-gray-700 dark:text-client-light">
                  {log.exerciseName}
                </p>
                <ul className="list-disc list-inside pl-2 text-gray-600 dark:text-client-subtle">
                  {log.loggedSets.map((set, index) => (
                    <li key={index}>
                      Série {index + 1}: {set.reps} reps @ {set.load}kg
                      {set.comment && <span className="italic"> - "{set.comment}"</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Feedback & Tokens */}
        <div className="space-y-6">
          <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg text-center">
            <p className="font-semibold text-primary">Tokens gagnés</p>
            <p className="text-4xl font-bold text-primary">{tokensEarned}</p>
            <p className="text-xs text-primary/80">1 token par série validée !</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-center text-gray-800 dark:text-client-light">
              Votre ressenti sur la séance
            </h3>
            {questionnaireItems.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 dark:bg-client-dark rounded-lg">
                <label className="block text-center text-sm font-medium text-gray-700 dark:text-client-subtle mb-2">
                  {item.label}
                </label>
                <Rating
                  questionId={item.id}
                  value={answers[item.id]}
                  onChange={(value) => handleAnswerChange(item.id, value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 text-center">
        <Button onClick={onClose} size="lg">
          Terminer
        </Button>
      </div>
    </Modal>
  );
};

export default SessionRecapModal;
