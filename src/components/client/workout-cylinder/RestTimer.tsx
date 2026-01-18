import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon, PlayIcon, PauseIcon, XMarkIcon } from '../../../constants/icons';

interface RestTimerProps {
  isActive: boolean;
  duration: number; // en secondes
  onComplete?: () => void;
  onStop?: () => void;
}

const RestTimer: React.FC<RestTimerProps> = ({
  isActive,
  duration,
  onComplete,
  onStop,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isActive) {
      setTimeLeft(duration);
      setIsPaused(false);
    }
  }, [isActive, duration]);

  useEffect(() => {
    if (!isActive || isPaused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onComplete?.();
          // Vibration de fin
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 100]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (timeLeft / duration) * 100 : 0;

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed top-20 right-4 z-50"
      >
        <div className="relative">
          {/* Cercle de progression */}
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-700"
            />
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              className="text-accent-cyan transition-all duration-1000 ease-linear"
              strokeLinecap="round"
            />
          </svg>

          {/* Contenu central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <ClockIcon className="w-5 h-5 text-accent-cyan mb-1" />
            <div className="text-text-primary font-bold text-lg">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Boutons de contrôle */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="bg-bg-card border border-gray-700 rounded-full p-2 hover:bg-gray-700 transition-colors"
              aria-label={isPaused ? 'Reprendre' : 'Pause'}
            >
              {isPaused ? (
                <PlayIcon className="w-4 h-4 text-text-primary" />
              ) : (
                <PauseIcon className="w-4 h-4 text-text-primary" />
              )}
            </button>
            
            <button
              onClick={onStop}
              className="bg-bg-card border border-gray-700 rounded-full p-2 hover:bg-gray-700 transition-colors"
              aria-label="Arrêter"
            >
              <XMarkIcon className="w-4 h-4 text-text-primary" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RestTimer;
