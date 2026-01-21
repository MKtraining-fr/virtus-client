import React from 'react';
import { Flame } from 'lucide-react';

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
    <div className="rounded-2xl border border-orange-600/30 bg-gradient-to-br from-orange-600/20 to-orange-600/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Série d'entraînement</h3>
        <div className="rounded-xl bg-orange-600/20 p-3">
          <Flame size={24} className="text-orange-400" strokeWidth={2} />
        </div>
      </div>

      <div className="flex items-end gap-6 mb-6">
        <div>
          <p className="text-sm text-gray-400 mb-1">Série actuelle</p>
          <p className="text-4xl font-bold text-orange-400">{currentStreak}</p>
          <p className="text-xs text-gray-500 mt-1">jours consécutifs</p>
        </div>
        
        <div className="pb-2">
          <p className="text-sm text-gray-400 mb-1">Record</p>
          <p className="text-2xl font-bold text-gray-300">{bestStreak}</p>
          <p className="text-xs text-gray-500 mt-1">jours</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400">Cette semaine</p>
        <div className="flex gap-2">
          {weekActivity.map((isActive, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div
                className={`h-10 w-full rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-orange-600 to-orange-400 shadow-lg shadow-orange-600/30'
                    : 'bg-gray-800'
                }`}
              />
              <span className="text-xs text-gray-500">{days[index]}</span>
            </div>
          ))}
        </div>
      </div>

      {currentStreak >= 7 && (
        <div className="mt-4 rounded-lg bg-orange-600/10 border border-orange-600/20 p-3">
          <p className="text-xs text-orange-400 text-center font-medium">
            🔥 Incroyable ! Continue comme ça !
          </p>
        </div>
      )}
    </div>
  );
};
