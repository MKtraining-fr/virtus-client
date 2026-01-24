import React from 'react';
import { Check, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { ExerciseSet, SetType } from './irontrack-types';

interface SetRowProps {
  set: ExerciseSet;
  isActive: boolean;
  onClick: () => void;
  onWeightClick?: () => void;
  onRepsClick?: () => void;
  onLockToggle?: () => void;
  isPredataModified?: boolean;
  onHistoryClick?: () => void;
  isLocked?: boolean;
}

type ProgressionType = 'better' | 'same' | 'worse' | 'none';

const SetRow: React.FC<SetRowProps> = ({ set, isActive, onClick, onWeightClick, onRepsClick, onLockToggle, isPredataModified = false, onHistoryClick, isLocked = false }) => {
  // Parse previous best if available
  const parsePreviousBest = () => {
    if (!set.previousBest) return null;
    
    // Format: "80kg × 10" or "80 × 10"
    const match = set.previousBest.match(/(\d+\.?\d*)\s*(?:kg)?\s*×\s*(\d+)/);
    if (!match) return null;
    
    return {
      weight: parseFloat(match[1]),
      reps: parseInt(match[2], 10),
    };
  };

  const previous = parsePreviousBest();

  // Calculate progression
  const getProgression = (): ProgressionType => {
    if (!previous) return 'none';
    
    const previousVolume = previous.weight * previous.reps;
    const currentVolume = set.weight * set.reps;

    if (currentVolume > previousVolume) return 'better';
    if (currentVolume < previousVolume) return 'worse';
    return 'same';
  };

  const progression = getProgression();

  // Get progression icon and color
  const getProgressionIcon = () => {
    switch (progression) {
      case 'better':
        return { Icon: TrendingUp, color: 'text-lime-400' };
      case 'worse':
        return { Icon: TrendingDown, color: 'text-orange-400' };
      case 'same':
        return { Icon: Minus, color: 'text-cyan-400' };
      default:
        return null;
    }
  };

  const progressionIcon = getProgressionIcon();

  // Get border color - always neutral
  const getBorderColor = () => {
    return 'border-zinc-800/50';
  };

  return (
    <div 
      onClick={isActive && onLockToggle ? onLockToggle : onClick}
      className={`
        w-full min-h-[80px] h-[80px]
        relative flex items-center justify-between px-4 py-2 rounded-xl border transition-all duration-300
        ${isActive 
          ? `bg-gradient-to-b from-zinc-800 to-zinc-900 ${getBorderColor()} shadow-[0_0_40px_rgba(139,92,246,0.4)]` 
          : 'bg-zinc-900/60 border-zinc-800/50 hover:bg-zinc-800/60'
        }
      `}
    >
      {/* Left Section: Set Number + Previous Perf */}
      <div className="flex items-center gap-3">
        <div className={`
          flex items-center justify-center w-11 h-11 rounded-full font-black text-base transition-all duration-500 shadow-md flex-shrink-0
          ${set.completed 
            ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]' 
            : isActive 
              ? 'bg-white text-black scale-110' 
              : 'bg-zinc-800 text-zinc-500'
          }
        `}>
          {set.completed ? <Check size={20} strokeWidth={4} /> : set.setNumber}
        </div>
        
        <div className="flex flex-col">
          {/* Previous Performance (if available and active) */}
          {previous && isActive && (
            <div className="flex items-center gap-1.5">
              {progressionIcon && (
                <progressionIcon.Icon size={14} className={progressionIcon.color} strokeWidth={3} />
              )}
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Dernière:
              </span>
              <span className="text-sm font-black text-zinc-400 font-mono">
                {previous.weight} × {previous.reps}
              </span>
              <span className="text-[10px] text-zinc-600 font-semibold">
                (S2)
              </span>
              {onHistoryClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onHistoryClick();
                  }}
                  className="p-0.5 rounded hover:bg-zinc-700/50 transition-colors active:scale-95 ml-0.5"
                  aria-label="Voir l'historique"
                >
                  <BarChart3 size={13} className="text-zinc-500" />
                </button>
              )}
            </div>
          )}
          
          {/* Fallback if no previous data */}
          {!previous && isActive && (
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
              Première fois
            </span>
          )}
        </div>
      </div>

      {/* Right Section: Current Data */}
      <div className="flex items-center gap-3">
        <div 
          onClick={(e) => {
            if (isActive && onWeightClick) {
              e.stopPropagation();
              onWeightClick();
            }
          }}
          className={`flex flex-col items-end ${
            isActive ? 'cursor-pointer' : ''
          }`}
        >
          <div className={`text-2xl font-black font-mono tracking-tighter leading-none transition-colors ${
            isActive 
              ? (isPredataModified ? 'text-white' : 'text-zinc-500 opacity-60') 
              : 'text-zinc-600'
          }`}>
            {set.weight}<span className={`text-[11px] font-sans font-bold ml-1 ${
              isActive && !isPredataModified ? 'text-zinc-600 opacity-60' : 'text-zinc-600'
            }`}>KG</span>
          </div>
        </div>
        <div className={`w-px h-5 transition-colors ${isActive ? 'bg-violet-600/30' : 'bg-zinc-800'}`}></div>
        <div 
          onClick={(e) => {
            if (isActive && onRepsClick) {
              e.stopPropagation();
              onRepsClick();
            }
          }}
          className={`flex flex-col items-center justify-center w-12 ${
            isActive ? 'cursor-pointer' : ''
          }`}
        >
          <div className={`text-xl font-black font-mono tracking-tighter leading-none text-center transition-colors ${
            isActive 
              ? (isPredataModified ? 'text-white' : 'text-zinc-500 opacity-60') 
              : 'text-zinc-600'
          }`}>
            {set.reps}<span className={`text-[11px] font-sans font-bold ml-1 ${
              isActive && !isPredataModified ? 'text-zinc-600 opacity-60' : 'text-zinc-600'
            }`}>R</span>
          </div>
        </div>
      </div>

      {/* Side Accent */}
      {isActive && (
        <div className={`absolute right-0 top-1/3 bottom-1/3 w-1 rounded-l-full shadow-[0_0_10px_rgba(123,109,242,0.8)] animate-pulse ${
          progression === 'better' ? 'bg-lime-500' :
          progression === 'worse' ? 'bg-orange-500' :
          progression === 'same' ? 'bg-cyan-500' :
          'bg-violet-600'
        }`}></div>
      )}
    </div>
  );
};

export default SetRow;
