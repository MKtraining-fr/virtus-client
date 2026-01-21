import React from 'react';
import { Calendar, Clock, Dumbbell } from 'lucide-react';
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
    <div className="rounded-2xl border border-violet-600/30 bg-gradient-to-br from-violet-600/20 to-violet-600/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Prochain entraînement</h3>
        <div className="rounded-xl bg-violet-600/20 p-3">
          <Dumbbell size={24} className="text-violet-400" strokeWidth={2} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-2xl font-bold text-white mb-2">{workoutName}</p>
          <p className="text-sm text-gray-400">{exercises} exercices</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="rounded-lg bg-black/20 p-2">
              <Calendar size={16} className="text-violet-400" />
            </div>
            <span className="text-gray-300">{date}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="rounded-lg bg-black/20 p-2">
              <Clock size={16} className="text-violet-400" />
            </div>
            <span className="text-gray-300">{time} • {duration}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/client/v2/training')}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-violet-600/30"
        >
          Commencer l'entraînement
        </button>
      </div>
    </div>
  );
};
