import React, { useEffect } from 'react';
import { Timer, X } from 'lucide-react';

interface RestTimerProps {
  secondsRemaining: number;
  onSkip: () => void;
  onAdd: () => void;
}

const RestTimer: React.FC<RestTimerProps> = ({ secondsRemaining, onSkip, onAdd }) => {
  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = Math.max(0, Math.min(100, (secondsRemaining / 90) * 100)); // Assuming 90s standard

  if (secondsRemaining <= 0) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-bounce-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 flex items-center justify-between relative overflow-hidden">
        
        {/* Progress Bar Background */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 ease-linear" 
          style={{ width: `${progress}%` }}
        />

        <div className="flex items-center gap-4 z-10">
          <div className="bg-zinc-800 p-2 rounded-lg text-primary">
            <Timer size={24} />
          </div>
          <div>
            <div className="text-xs text-textMuted uppercase tracking-wider font-semibold">Resting</div>
            <div className="text-2xl font-mono font-bold text-white leading-none">
              {formatTime(secondsRemaining)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 z-10">
          <button 
            onClick={onAdd}
            className="px-3 py-2 rounded-lg bg-zinc-800 text-textMuted hover:text-white font-medium text-sm transition-colors"
          >
            +30s
          </button>
          <button 
            onClick={onSkip}
            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          >
            <span className="sr-only">Skip</span>
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestTimer;
