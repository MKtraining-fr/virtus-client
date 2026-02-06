import React, { useEffect, useState } from 'react';
import { Timer, Plus, X } from 'lucide-react';
import { Button } from '../ui';

interface RestTimerProps {
  secondsRemaining: number;
  onSkip: () => void;
  onAdd: () => void;
}

const RestTimer: React.FC<RestTimerProps> = ({
  secondsRemaining,
  onSkip,
  onAdd,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(secondsRemaining > 0);
  }, [secondsRemaining]);

  if (!isVisible) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progress = secondsRemaining > 0 ? (secondsRemaining / 90) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-bg-card dark:bg-bg-card border-2 border-brand-500 rounded-3xl p-8 max-w-sm w-[90%] shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Timer size={24} className="text-brand-500" />
            <h3 className="text-xl font-black text-text-primary dark:text-text-primary uppercase tracking-wide">
              Repos
            </h3>
          </div>
          <button
            onClick={onSkip}
            className="p-2 rounded-full hover:bg-bg-hover dark:hover:bg-bg-hover transition-colors"
          >
            <X size={20} className="text-text-tertiary dark:text-text-tertiary" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative mb-6">
          {/* Cercle de progression */}
          <svg className="w-48 h-48 mx-auto -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-bg-secondary dark:text-bg-secondary"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
              className="text-brand-500 transition-all duration-1000"
            />
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl font-black text-text-primary dark:text-text-primary tabular-nums">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-text-tertiary dark:text-text-tertiary uppercase tracking-wider mt-1">
              Temps restant
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onAdd}
            icon={<Plus size={18} />}
            fullWidth
          >
            +30s
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onSkip}
            fullWidth
          >
            Passer
          </Button>
        </div>

        {/* Message motivant */}
        <div className="mt-4 text-center">
          <p className="text-text-tertiary dark:text-text-tertiary text-sm">
            Profitez de ce repos pour récupérer 💪
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestTimer;
