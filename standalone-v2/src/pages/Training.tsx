import { Dumbbell, Calendar, TrendingUp, Play } from 'lucide-react';

const Training = () => {
  // Données mockées pour les entraînements
  const upcomingWorkouts = [
    {
      id: 1,
      name: 'Push - Pectoraux & Épaules',
      date: 'Demain',
      time: '10:00',
      exercises: 8,
      duration: '60 min',
    },
    {
      id: 2,
      name: 'Pull - Dos & Biceps',
      date: 'Jeudi',
      time: '10:00',
      exercises: 7,
      duration: '55 min',
    },
    {
      id: 3,
      name: 'Legs - Jambes',
      date: 'Samedi',
      time: '09:00',
      exercises: 9,
      duration: '70 min',
    },
  ];

  const recentWorkouts = [
    {
      id: 1,
      name: 'Legs - Jambes',
      date: "Aujourd'hui",
      duration: '65 min',
      exercises: 8,
      completed: true,
    },
    {
      id: 2,
      name: 'Push - Pectoraux',
      date: 'Hier',
      duration: '58 min',
      exercises: 7,
      completed: true,
    },
  ];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Section Prochain entraînement */}
      <div className="bg-gradient-to-br from-[#6D5DD3] to-[#8B7DE8] rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell size={20} className="text-white" strokeWidth={2.5} />
          <h2 className="text-white text-base font-bold">Prochain entraînement</h2>
        </div>
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-white font-bold text-lg mb-1">Push - Pectoraux & Épaules</p>
          <div className="flex items-center gap-3 text-white/80 text-xs mb-3">
            <span>Demain • 10:00</span>
            <span>•</span>
            <span>8 exercices</span>
            <span>•</span>
            <span>60 min</span>
          </div>
          <button className="w-full bg-white text-[#6D5DD3] rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Play size={16} fill="currentColor" />
            Commencer maintenant
          </button>
        </div>
      </div>

      {/* Section Entraînements à venir */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={18} className="text-violet-400" strokeWidth={2.5} />
          <h3 className="text-white text-sm font-semibold">Entraînements à venir</h3>
        </div>
        <div className="space-y-2">
          {upcomingWorkouts.map((workout) => (
            <div
              key={workout.id}
              className="bg-black/20 rounded-lg p-3 active:bg-black/30 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-white text-sm font-bold leading-tight mb-1">
                    {workout.name}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {workout.date} • {workout.time}
                  </p>
                </div>
                <div className="bg-violet-600/20 rounded-md p-1.5">
                  <Dumbbell size={14} className="text-violet-400" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span>{workout.exercises} exercices</span>
                <span>•</span>
                <span>{workout.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Historique récent */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-green-400" strokeWidth={2.5} />
          <h3 className="text-white text-sm font-semibold">Historique récent</h3>
        </div>
        <div className="space-y-2">
          {recentWorkouts.map((workout) => (
            <div
              key={workout.id}
              className="bg-black/20 rounded-lg p-3 border border-green-600/20"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-white text-sm font-bold leading-tight mb-1">
                    {workout.name}
                  </p>
                  <p className="text-gray-400 text-xs">{workout.date}</p>
                </div>
                <div className="bg-green-600/20 rounded-md px-2 py-1">
                  <span className="text-green-400 text-[10px] font-bold">✓ Complété</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span>{workout.exercises} exercices</span>
                <span>•</span>
                <span>{workout.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message de développement */}
      <div className="rounded-xl border border-blue-600/30 bg-gradient-to-br from-blue-600/10 to-blue-600/5 p-4 text-center">
        <p className="text-blue-400 text-xs font-medium">
          📱 IronTrack v2 sera intégré prochainement
        </p>
        <p className="text-gray-500 text-[10px] mt-1">
          Suivi détaillé des exercices, séries et répétitions
        </p>
      </div>
    </div>
  );
};

export default Training;
