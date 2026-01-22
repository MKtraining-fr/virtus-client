import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, History, BookOpen } from 'lucide-react';
import { ProgramProgressCard } from '../components/training/ProgramProgressCard';
import { WorkoutSessionCard } from '../components/training/WorkoutSessionCard';

const Training = () => {
  const navigate = useNavigate();

  // Données mockées pour le programme en cours
  const currentProgram = {
    name: 'Push Pull Legs - Hypertrophie',
    currentWeek: 3,
    totalWeeks: 12,
    completedSessions: 9,
    totalSessions: 36,
    progressPercentage: 25,
  };

  // Séance actuelle (aujourd'hui ou prochaine)
  const currentSession = {
    name: 'Push - Pectoraux & Triceps',
    date: "Aujourd'hui",
    time: '10:00',
    exercises: 8,
    duration: '60 min',
    status: 'current' as const,
  };

  // Prochaines séances
  const upcomingSessions = [
    {
      id: 1,
      name: 'Pull - Dos & Biceps',
      date: 'Demain',
      time: '10:00',
      exercises: 7,
      duration: '55 min',
      status: 'upcoming' as const,
    },
    {
      id: 2,
      name: 'Legs - Jambes',
      date: 'Jeudi',
      time: '10:00',
      exercises: 9,
      duration: '70 min',
      status: 'upcoming' as const,
    },
    {
      id: 3,
      name: 'Push - Pectoraux & Épaules',
      date: 'Samedi',
      time: '09:00',
      exercises: 8,
      duration: '60 min',
      status: 'upcoming' as const,
    },
  ];

  // Historique récent
  const recentSessions = [
    {
      id: 1,
      name: 'Legs - Jambes',
      date: 'Hier',
      exercises: 9,
      duration: '68 min',
      status: 'completed' as const,
    },
    {
      id: 2,
      name: 'Pull - Dos & Biceps',
      date: 'Lundi',
      exercises: 7,
      duration: '58 min',
      status: 'completed' as const,
    },
    {
      id: 3,
      name: 'Push - Pectoraux',
      date: 'Samedi',
      exercises: 8,
      duration: '62 min',
      status: 'completed' as const,
    },
  ];

  // Programmes disponibles
  const availablePrograms = [
    {
      id: 1,
      name: 'Force - 5x5',
      weeks: 8,
      level: 'Intermédiaire',
    },
    {
      id: 2,
      name: 'Endurance Musculaire',
      weeks: 6,
      level: 'Débutant',
    },
  ];

  const handleStartWorkout = () => {
    // Navigation vers IronTrack
    navigate('/irontrack');
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Progression du programme */}
      <ProgramProgressCard {...currentProgram} />

      {/* Séance actuelle */}
      <div className="rounded-xl border border-violet-600/30 bg-gradient-to-br from-violet-600/10 to-violet-600/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={18} className="text-violet-400" strokeWidth={2.5} />
          <h3 className="text-white text-sm font-semibold">Séance du jour</h3>
        </div>
        <WorkoutSessionCard {...currentSession} onStart={handleStartWorkout} />
      </div>

      {/* Prochaines séances */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={18} className="text-blue-400" strokeWidth={2.5} />
          <h3 className="text-white text-sm font-semibold">Prochaines séances</h3>
        </div>
        <div className="space-y-2">
          {upcomingSessions.map((session) => (
            <WorkoutSessionCard key={session.id} {...session} />
          ))}
        </div>
      </div>

      {/* Historique récent */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <History size={18} className="text-green-400" strokeWidth={2.5} />
          <h3 className="text-white text-sm font-semibold">Historique récent</h3>
        </div>
        <div className="space-y-2">
          {recentSessions.map((session) => (
            <WorkoutSessionCard key={session.id} {...session} />
          ))}
        </div>
        <button className="w-full mt-3 text-center text-xs text-gray-500 hover:text-gray-400 transition-colors py-2">
          Voir tout l'historique →
        </button>
      </div>

      {/* Programmes disponibles */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-orange-400" strokeWidth={2.5} />
          <h3 className="text-white text-sm font-semibold">Autres programmes</h3>
        </div>
        <div className="space-y-2">
          {availablePrograms.map((program) => (
            <div
              key={program.id}
              className="bg-black/20 rounded-lg p-3 active:bg-black/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-bold mb-1">{program.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{program.weeks} semaines</span>
                    <span>•</span>
                    <span>{program.level}</span>
                  </div>
                </div>
                <button className="bg-orange-600/20 text-orange-400 rounded-lg px-3 py-1.5 text-xs font-bold active:scale-95 transition-transform">
                  Voir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats du programme */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-violet-400" strokeWidth={2.5} />
          <h3 className="text-white text-sm font-semibold">Statistiques</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 mb-1">Taux de complétion</p>
            <p className="text-white text-xl font-bold">100%</p>
            <p className="text-green-400 text-[10px] mt-1">+5% cette semaine</p>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 mb-1">Volume total</p>
            <p className="text-white text-xl font-bold">12.5T</p>
            <p className="text-blue-400 text-[10px] mt-1">+850kg cette semaine</p>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 mb-1">Temps total</p>
            <p className="text-white text-xl font-bold">3h15</p>
            <p className="text-gray-500 text-[10px] mt-1">Cette semaine</p>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 mb-1">Records battus</p>
            <p className="text-white text-xl font-bold">3</p>
            <p className="text-orange-400 text-[10px] mt-1">Ce mois-ci</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Training;
