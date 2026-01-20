import React from 'react';
import { Check } from 'lucide-react';
import { ExerciseSet, SetType } from './irontrack-types';

interface SetRowProps {
  set: ExerciseSet;
  isActive: boolean;
  onClick: () => void;
  onWeightClick?: () => void;
  onRepsClick?: () => void;
}

const SetRow: React.FC<SetRowProps> = ({ set, isActive, onClick, onWeightClick, onRepsClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        w-full min-h-[70px] h-[70px]
        relative flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-300
        ${isActive 
          ? 'bg-gradient-to-b from-zinc-800 to-zinc-900 border-violet-600/40 shadow-[0_0_30px_rgba(139,92,246,0.15)] ring-1 ring-violet-600/20' 
          : 'bg-zinc-900/60 border-zinc-800/50 hover:bg-zinc-800/60'
        }
      `}
    >
      {/* Set Number Section */}
      <div className="flex items-center gap-4">
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-full font-black text-sm transition-all duration-500 shadow-md
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
          <span className={`text-[10px] font-black tracking-[0.15em] uppercase mb-0.5 ${isActive ? 'text-violet-400' : 'text-zinc-600'}`}>
            {set.type === SetType.WORKING ? 'Working Set' : set.type}
          </span>
          <span className={`text-xs font-bold font-mono ${isActive ? 'text-zinc-400' : 'text-zinc-700'}`}>
            PB: {set.previousBest || '--'}
          </span>
        </div>
      </div>

      {/* Data Section */}
      <div className="flex items-center gap-4">
        <div 
          onClick={(e) => {
            if (isActive && onWeightClick) {
              e.stopPropagation();
              onWeightClick();
            }
          }}
          className={`flex flex-col items-end ${
            isActive ? 'cursor-pointer hover:bg-violet-600/10 active:bg-violet-600/20 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors' : ''
          }`}
        >
          <div className={`text-2xl font-black font-mono tracking-tighter leading-none ${isActive ? 'text-white' : 'text-zinc-600'}`}>
            {set.weight}<span className="text-[10px] font-sans font-bold text-zinc-600 ml-1">KG</span>
          </div>
        </div>
        <div className={`w-px h-6 transition-colors ${isActive ? 'bg-violet-600/30' : 'bg-zinc-800'}`}></div>
        <div 
          onClick={(e) => {
            if (isActive && onRepsClick) {
              e.stopPropagation();
              onRepsClick();
            }
          }}
          className={`flex flex-col items-end w-14 ${
            isActive ? 'cursor-pointer hover:bg-violet-600/10 active:bg-violet-600/20 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors' : ''
          }`}
        >
           <div className={`text-2xl font-black font-mono tracking-tighter leading-none ${isActive ? 'text-white' : 'text-zinc-600'}`}>
            {set.reps}<span className="text-[10px] font-sans font-bold text-zinc-600 ml-1">R</span>
          </div>
        </div>
      </div>

      {/* Side "Mechanical" Accent */}
      {isActive && (
        <div className="absolute right-0 top-1/3 bottom-1/3 w-1 bg-violet-600 rounded-l-full shadow-[0_0_10px_rgba(139,92,246,0.8)] animate-pulse"></div>
      )}
    </div>
  );
};

export default SetRow;