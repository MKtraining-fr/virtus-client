import React from 'react';
import { Check, TrendingDown } from 'lucide-react';
import type { DropSet } from './irontrack-types';

interface DropSetCardProps {
  drop: DropSet;
  dropNumber: number;
  onWeightClick?: () => void;
  onRepsClick?: () => void;
  isActive?: boolean;
}

/**
 * Composant pour afficher une carte de drop set
 * Design: Taille réduite + indentation vers la droite
 */
const DropSetCard: React.FC<DropSetCardProps> = ({
  drop,
  dropNumber,
  onWeightClick,
  onRepsClick,
  isActive = false,
}) => {
  const isFailure = drop.reps === 'échec';

  return (
    <div 
      className={`
        relative
        ml-6
        w-[calc(100%-24px)]
        rounded-xl
        border
        transition-all
        ${drop.completed 
          ? 'bg-zinc-900/50 border-zinc-800/50' 
          : isActive
            ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 shadow-lg shadow-orange-500/10'
            : 'bg-zinc-900/80 border-zinc-800'
        }
      `}
    >
      {/* Accent latéral pour drop */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-gradient-to-b from-orange-500 to-red-500 rounded-r-full" />
      
      {/* Contenu */}
      <div className="p-3 flex items-center gap-3">
        {/* Icône Drop */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${drop.completed 
            ? 'bg-zinc-800 text-zinc-600' 
            : 'bg-orange-500/20 text-orange-400'
          }
        `}>
          <TrendingDown size={16} strokeWidth={3} />
        </div>

        {/* Label Drop */}
        <div className="flex-shrink-0">
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Drop {dropNumber}</div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Poids */}
        <button
          onClick={onWeightClick}
          disabled={drop.completed}
          className={`
            px-3 py-1.5 rounded-lg text-center transition-all
            ${drop.completed
              ? 'bg-zinc-800/50 cursor-not-allowed'
              : 'bg-zinc-800 hover:bg-zinc-700 active:scale-95'
            }
          `}
        >
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Poids (kg)</div>
          <div className={`text-base font-black font-mono ${drop.completed ? 'text-zinc-600' : 'text-white'}`}>
            {drop.weight}
          </div>
        </button>

        {/* Reps */}
        <button
          onClick={onRepsClick}
          disabled={drop.completed}
          className={`
            px-3 py-1.5 rounded-lg text-center transition-all
            ${drop.completed
              ? 'bg-zinc-800/50 cursor-not-allowed'
              : 'bg-zinc-800 hover:bg-zinc-700 active:scale-95'
            }
          `}
        >
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">
            {isFailure ? 'Échec' : 'Répétitions'}
          </div>
          <div className={`text-base font-black font-mono ${drop.completed ? 'text-zinc-600' : 'text-white'}`}>
            {isFailure ? '∞' : drop.reps}
          </div>
        </button>

        {/* Check icon si complété */}
        {drop.completed && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check size={14} className="text-green-400" strokeWidth={3} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DropSetCard;
