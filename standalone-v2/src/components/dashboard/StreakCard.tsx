import React from 'react';
import { Flame, Trophy } from 'lucide-react';

interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
  weekActivity: boolean[]; // 7 jours, true = actif
}

export const StreakCard: React.FC<StreakCardProps> = ({
  currentStreak,
  bestStreak,
  weekActivity,
}) => {
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div className="rounded-xl border border-orange-600/30 bg-gradient-to-br from-orange-600/20 to-orange-600/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-orange-300">Série d'entraînement</h3>
        <div className="rounded-lg bg-orange-600/20 p-2">
          <Flame size={18} className="text-orange-400" strokeWidth={2.5} />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 bg-black/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className="text-orange-400" />
            <p className="text-[10px] text-gray-400 uppercase font-medium">Série actuelle</p>
          </div>
          <p className="text-3xl font-bold text-orange-400">{currentStreak}</p>
          <p className="text-[9px] text-gray-500 mt-0.5">jours consécutifs</p>
        </div>
        
        <div className="flex-1 bg-black/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-gray-400" />
            <p className="text-[10px] text-gray-400 uppercase font-medium">Record</p>
          </div>
          <p className="text-3xl font-bold text-gray-300">{bestStreak}</p>
          <p className="text-[9px] text-gray-500 mt-0.5">jours max</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium text-gray-400 uppercase">Cette semaine</p>
        <div className="flex gap-1.5">
          {weekActivity.map((isActive, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1.5"
            >
              <div
                className={`h-8 w-full rounded-md transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-orange-600 to-orange-400 shadow-md shadow-orange-600/30'
                    : 'bg-gray-800/50'
                }`}
              />
              <span className="text-[9px] text-gray-500 font-medium">{days[index]}</span>
            </div>
          ))}
        </div>
      </div>

      {currentStreak >= 7 && (
        <div className="mt-3 rounded-lg bg-orange-600/10 border border-orange-600/20 p-2.5">
          <p className="text-[10px] text-orange-400 text-center font-bold">
            🔥 Incroyable ! Continue comme ça !
          </p>
        </div>
      )}
    </div>
  );
};
