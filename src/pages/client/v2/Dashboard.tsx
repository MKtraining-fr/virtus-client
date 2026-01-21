import { TrendingUp, TrendingDown, Dumbbell, Apple, Target, Calendar } from 'lucide-react';

const Dashboard = () => {
  // Données mockées
  const stats = [
    { 
      label: 'Séances cette semaine', 
      value: '4/5', 
      change: '+20%', 
      trend: 'up',
      icon: Dumbbell,
      color: 'text-primary'
    },
    { 
      label: 'Calories moyennes', 
      value: '2,450', 
      change: '-5%', 
      trend: 'down',
      icon: Apple,
      color: 'text-green-500'
    },
    { 
      label: 'Objectif du mois', 
      value: '75%', 
      change: '+10%', 
      trend: 'up',
      icon: Target,
      color: 'text-orange-500'
    },
    { 
      label: 'Jours actifs', 
      value: '18/30', 
      change: '+15%', 
      trend: 'up',
      icon: Calendar,
      color: 'text-blue-500'
    },
  ];

  const recentWorkouts = [
    { date: '2026-01-20', name: 'Développé Couché', sets: 5, reps: 12, weight: 80 },
    { date: '2026-01-18', name: 'Squat', sets: 4, reps: 10, weight: 100 },
    { date: '2026-01-16', name: 'Soulevé de Terre', sets: 3, reps: 8, weight: 120 },
  ];

  const weeklyProgress = [
    { day: 'Lun', value: 85 },
    { day: 'Mar', value: 92 },
    { day: 'Mer', value: 78 },
    { day: 'Jeu', value: 95 },
    { day: 'Ven', value: 88 },
    { day: 'Sam', value: 90 },
    { day: 'Dim', value: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Vue d'ensemble de vos performances</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gray-800 ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-6">Progression hebdomadaire</h2>
          <div className="flex items-end justify-between h-48 gap-2">
            {weeklyProgress.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gray-800 rounded-t-lg relative overflow-hidden" style={{ height: '100%' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all"
                    style={{ height: `${day.value}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-6">Dernières séances</h2>
          <div className="space-y-4">
            {recentWorkouts.map((workout, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">{workout.name}</p>
                  <p className="text-sm text-gray-400">{workout.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{workout.weight} kg</p>
                  <p className="text-sm text-gray-400">{workout.sets} × {workout.reps}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-primary rounded-lg hover:bg-primary/80 transition-all">
            <Dumbbell className="mx-auto mb-2" size={24} />
            <span className="text-sm font-medium">Nouvelle séance</span>
          </button>
          <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all">
            <Apple className="mx-auto mb-2" size={24} />
            <span className="text-sm font-medium">Ajouter repas</span>
          </button>
          <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all">
            <Target className="mx-auto mb-2" size={24} />
            <span className="text-sm font-medium">Voir objectifs</span>
          </button>
          <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all">
            <Calendar className="mx-auto mb-2" size={24} />
            <span className="text-sm font-medium">Planning</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
