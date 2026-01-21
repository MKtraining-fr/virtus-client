import React from 'react';
import { Calendar, Clock, Dumbbell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NextWorkoutCardProps {
  workoutName: string;
  date: string;
  time: string;
  duration: string;
  exercises: number;
}

export const NextWorkoutCard: React.FC<NextWorkoutCardProps> = ({
  workoutName,
  date,
  time,
  duration,
  exercises,
}) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-violet-600/30 bg-gradient-to-br from-violet-600/20 to-violet-600/5 p-4 active:scale-[0.98] transition-transform">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-violet-300 mb-1">Prochain entraînement</h3>
          <p className="text-lg font-bold text-white leading-tight">{workoutName}</p>
        </div>
        <div className="rounded-lg bg-violet-600/20 p-2">
          <Dumbbell size={20} className="text-violet-400" strokeWidth={2.5} />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs text-gray-300">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-violet-400" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-violet-400" />
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Dumbbell size={14} className="text-violet-400" />
          <span>{exercises} exercices</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/client/v2/training')}
        className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-3 text-sm font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
      >
        Commencer l'entraînement
        <ChevronRight size={16} strokeWidth={3} />
      </button>
    </div>
  );
};
