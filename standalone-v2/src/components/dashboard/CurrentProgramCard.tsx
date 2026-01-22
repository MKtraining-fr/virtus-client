import React from 'react';
import { Dumbbell, Play, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CurrentProgramCardProps {
  programName: string;
  currentWeek: number;
  totalWeeks: number;
  progressPercentage: number;
  nextSession: {
    name: string;
    date: string;
    time: string;
  };
}

export const CurrentProgramCard: React.FC<CurrentProgramCardProps> = ({
  programName,
  currentWeek,
  totalWeeks,
  progressPercentage,
  nextSession,
}) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-violet-600/30 bg-gradient-to-br from-violet-600/10 to-violet-600/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Dumbbell size={18} className="text-violet-400" strokeWidth={2.5} />
        <h3 className="text-white text-sm font-semibold">Programme en cours</h3>
      </div>

      <div className="space-y-3">
        {/* Programme info */}
        <div>
          <p className="text-white text-base font-bold mb-1">{programName}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <TrendingUp size={12} />
            <span>
              Semaine {currentWeek}/{totalWeeks} • {progressPercentage}% complété
            </span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Prochaine séance */}
        <div className="bg-black/20 rounded-lg p-3 border border-violet-600/20">
          <p className="text-[10px] text-gray-500 mb-1">Prochaine séance</p>
          <p className="text-white text-sm font-bold mb-1">{nextSession.name}</p>
          <p className="text-gray-400 text-xs">
            {nextSession.date} • {nextSession.time}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/training')}
          className="w-full bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Play size={16} fill="currentColor" />
          Démarrer l'entraînement
        </button>
      </div>
    </div>
  );
};
