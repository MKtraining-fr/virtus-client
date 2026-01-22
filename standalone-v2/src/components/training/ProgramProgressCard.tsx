import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

interface ProgramProgressCardProps {
  programName: string;
  currentWeek: number;
  totalWeeks: number;
  completedSessions: number;
  totalSessions: number;
  progressPercentage: number;
}

export const ProgramProgressCard: React.FC<ProgramProgressCardProps> = ({
  programName,
  currentWeek,
  totalWeeks,
  completedSessions,
  totalSessions,
  progressPercentage,
}) => {
  return (
    <div className="rounded-xl border border-violet-600/30 bg-gradient-to-br from-violet-600/10 to-violet-600/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={18} className="text-violet-400" strokeWidth={2.5} />
        <h3 className="text-white text-sm font-semibold">Programme en cours</h3>
      </div>

      <div className="space-y-3">
        {/* Nom du programme */}
        <div>
          <p className="text-white text-base font-bold mb-1">{programName}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={12} />
            <span>
              Semaine {currentWeek} / {totalWeeks}
            </span>
          </div>
        </div>

        {/* Barre de progression */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">Progression globale</span>
            <span className="text-xs text-violet-400 font-bold">
              {progressPercentage}%
            </span>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-violet-600/20">
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Séances complétées</p>
            <p className="text-sm text-white font-bold">
              {completedSessions} / {totalSessions}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 mb-0.5">Semaines restantes</p>
            <p className="text-sm text-white font-bold">
              {totalWeeks - currentWeek}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
