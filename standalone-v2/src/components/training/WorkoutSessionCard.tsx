import React from 'react';
import { Dumbbell, Clock, Play, CheckCircle } from 'lucide-react';

interface WorkoutSessionCardProps {
  name: string;
  date: string;
  time?: string;
  exercises: number;
  duration: string;
  status: 'upcoming' | 'completed' | 'current';
  onStart?: () => void;
}

export const WorkoutSessionCard: React.FC<WorkoutSessionCardProps> = ({
  name,
  date,
  time,
  exercises,
  duration,
  status,
  onStart,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'border-green-600/20 bg-black/20';
      case 'current':
        return 'border-violet-600/30 bg-violet-600/5';
      default:
        return 'border-gray-800 bg-black/20';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return (
          <div className="bg-green-600/20 rounded-md px-2 py-1 flex items-center gap-1">
            <CheckCircle size={12} className="text-green-400" />
            <span className="text-green-400 text-[10px] font-bold">Complété</span>
          </div>
        );
      case 'current':
        return (
          <div className="bg-violet-600/20 rounded-md px-2 py-1">
            <span className="text-violet-400 text-[10px] font-bold">Aujourd'hui</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`rounded-lg p-3 ${getStatusColor()} ${
        status === 'upcoming' ? 'active:bg-black/30' : ''
      } transition-all`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-white text-sm font-bold leading-tight mb-1">{name}</p>
          <p className="text-gray-400 text-xs">
            {date}
            {time && ` • ${time}`}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Dumbbell size={10} />
          {exercises} exercices
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {duration}
        </span>
      </div>

      {status === 'current' && onStart && (
        <button
          onClick={onStart}
          className="w-full bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <Play size={14} fill="currentColor" />
          Démarrer l'entraînement
        </button>
      )}
    </div>
  );
};
