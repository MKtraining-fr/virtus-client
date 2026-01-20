import React, { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RestTimerProps {
  secondsRemaining: number;
  onSkip: () => void;
  onAdd: () => void;
}

const RestTimerIronTrack: React.FC<RestTimerProps> = ({ secondsRemaining, onSkip, onAdd }) => {
  const [progress, setProgress] = useState(0);
  const totalSeconds = secondsRemaining > 0 ? secondsRemaining : 90;

  useEffect(() => {
    if (secondsRemaining > 0) {
      setProgress((secondsRemaining / totalSeconds) * 100);
    }
  }, [secondsRemaining, totalSeconds]);

  if (secondsRemaining <= 0) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      >
        <div className="relative flex flex-col items-center gap-8">
          {/* Circular Progress */}
          <div className="relative w-64 h-64">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="112"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress Circle */}
              <circle
                cx="128"
                cy="128"
                r="112"
                stroke="rgb(139, 92, 246)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 112}`}
                strokeDashoffset={`${2 * Math.PI * 112 * (1 - progress / 100)}`}
                className="transition-all duration-1000 ease-linear"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.6))'
                }}
              />
            </svg>

            {/* Timer Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-7xl font-black font-mono text-white tracking-tighter">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-sm font-bold text-violet-400 uppercase tracking-widest mt-2">
                Temps de repos
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all active:scale-95"
            >
              <Plus size={20} />
              +30s
            </button>
            <button
              onClick={onSkip}
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            >
              <X size={20} />
              Passer
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RestTimerIronTrack;
