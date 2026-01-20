import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface PreviousPerformanceBadgeProps {
  previousWeight: number;
  previousReps: number;
  currentWeight: number;
  currentReps: number;
  source: 'coach' | number; // 'coach' or week number
  onHistoryClick?: () => void;
}

type ProgressionType = 'better' | 'same' | 'worse';

/**
 * Badge showing previous performance with visual feedback
 */
const PreviousPerformanceBadge: React.FC<PreviousPerformanceBadgeProps> = ({
  previousWeight,
  previousReps,
  currentWeight,
  currentReps,
  source,
  onHistoryClick,
}) => {
  // Calculate progression
  const getProgression = (): ProgressionType => {
    // Calculate volume (weight × reps)
    const previousVolume = previousWeight * previousReps;
    const currentVolume = currentWeight * currentReps;

    if (currentVolume > previousVolume) return 'better';
    if (currentVolume < previousVolume) return 'worse';
    return 'same';
  };

  const progression = getProgression();

  // Get colors and icons based on progression
  const getProgressionStyle = () => {
    switch (progression) {
      case 'better':
        return {
          borderColor: 'border-lime-500/50',
          bgColor: 'bg-lime-500/5',
          iconColor: 'text-lime-400',
          icon: TrendingUp,
        };
      case 'worse':
        return {
          borderColor: 'border-orange-500/50',
          bgColor: 'bg-orange-500/5',
          iconColor: 'text-orange-400',
          icon: TrendingDown,
        };
      case 'same':
        return {
          borderColor: 'border-cyan-500/50',
          bgColor: 'bg-cyan-500/5',
          iconColor: 'text-cyan-400',
          icon: Minus,
        };
    }
  };

  const style = getProgressionStyle();
  const Icon = style.icon;

  // Format source text
  const getSourceText = () => {
    if (source === 'coach') return 'Coach';
    return `Semaine ${source}`;
  };

  return (
    <div className={`relative ${style.bgColor} ${style.borderColor} border-2 rounded-xl p-3 transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            DERNIÈRE PERF
          </span>
          <Icon size={14} className={`${style.iconColor}`} strokeWidth={3} />
        </div>
        
        {onHistoryClick && (
          <button
            onClick={onHistoryClick}
            className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 transition-colors active:scale-95"
            aria-label="Voir l'historique"
          >
            <BarChart3 size={14} className="text-zinc-400" />
          </button>
        )}
      </div>

      {/* Performance data */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-white font-mono tracking-tighter">
          {previousWeight}
        </span>
        <span className="text-xs text-zinc-500 font-bold">kg</span>
        <span className="text-zinc-600 font-black">×</span>
        <span className="text-2xl font-black text-white font-mono tracking-tighter">
          {previousReps}
        </span>
        <span className="text-xs text-zinc-500 font-bold">reps</span>
      </div>

      {/* Source */}
      <div className="mt-2">
        <span className="text-[9px] text-zinc-600 font-semibold uppercase tracking-wider">
          {getSourceText()}
        </span>
      </div>
    </div>
  );
};

export default PreviousPerformanceBadge;
