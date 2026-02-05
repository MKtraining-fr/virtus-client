import { Apple, TrendingUp, Target, Flame, Calendar, Plus, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const Nutrition = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // Données mockées
  const dailyGoals = {
    calories: { current: 1850, target: 2400, unit: 'kcal' },
    protein: { current: 145, target: 180, unit: 'g' },
    carbs: { current: 220, target: 280, unit: 'g' },
    fat: { current: 55, target: 70, unit: 'g' },
  };

  const meals = [
    {
      id: 1,
      name: 'Petit-déjeuner',
      time: '08:00',
      calories: 520,
      completed: true,
      items: ['Flocons d\'avoine', 'Banane', 'Whey'],
    },
    {
      id: 2,
      name: 'Déjeuner',
      time: '13:00',
      calories: 680,
      completed: true,
      items: ['Poulet', 'Riz basmati', 'Brocolis'],
    },
    {
      id: 3,
      name: 'Collation',
      time: '16:00',
      calories: 280,
      completed: true,
      items: ['Yaourt grec', 'Amandes'],
    },
    {
      id: 4,
      name: 'Dîner',
      time: '20:00',
      calories: 620,
      completed: false,
      items: ['Saumon', 'Patate douce', 'Haricots verts'],
    },
  ];

  const weeklyData = [
    { day: 'Lun', calories: 2350, target: 2400 },
    { day: 'Mar', calories: 2280, target: 2400 },
    { day: 'Mer', calories: 2450, target: 2400 },
    { day: 'Jeu', calories: 2320, target: 2400 },
    { day: 'Ven', calories: 2180, target: 2400 },
    { day: 'Sam', calories: 2500, target: 2400 },
    { day: 'Dim', calories: 1850, target: 2400 },
  ];

  const recipes = [
    {
      id: 1,
      name: 'Bowl protéiné poulet',
      calories: 520,
      protein: 45,
      time: '15 min',
      image: '🍗',
    },
    {
      id: 2,
      name: 'Smoothie post-workout',
      calories: 380,
      protein: 35,
      time: '5 min',
      image: '🥤',
    },
    {
      id: 3,
      name: 'Salade quinoa saumon',
      calories: 450,
      protein: 38,
      time: '20 min',
      image: '🥗',
    },
  ];

  const getPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getMaxCalories = () => {
    return Math.max(...weeklyData.map(d => Math.max(d.calories, d.target)));
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Résumé calorique du jour */}
      <div className="bg-gradient-to-br from-green-600/20 to-green-600/5 border border-green-600/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-green-400" strokeWidth={2.5} />
            <h2 className="text-white text-base font-bold">Calories du jour</h2>
          </div>
          <span className="text-green-400 text-sm font-bold">
            {Math.round(getPercentage(dailyGoals.calories.current, dailyGoals.calories.target))}%
          </span>
        </div>
        
        <div className="mb-3">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-white">
              {dailyGoals.calories.current}
            </span>
            <span className="text-sm text-gray-400">
              / {dailyGoals.calories.target} kcal
            </span>
          </div>
          <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${getPercentage(dailyGoals.calories.current, dailyGoals.calories.target)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-black/20 rounded-lg p-2">
            <p className="text-[9px] text-gray-400 uppercase font-medium mb-0.5">Protéines</p>
            <p className="text-sm font-bold text-white">{dailyGoals.protein.current}g</p>
            <p className="text-[8px] text-gray-500">/ {dailyGoals.protein.target}g</p>
          </div>
          <div className="bg-black/20 rounded-lg p-2">
            <p className="text-[9px] text-gray-400 uppercase font-medium mb-0.5">Glucides</p>
            <p className="text-sm font-bold text-white">{dailyGoals.carbs.current}g</p>
            <p className="text-[8px] text-gray-500">/ {dailyGoals.carbs.target}g</p>
          </div>
          <div className="bg-black/20 rounded-lg p-2">
            <p className="text-[9px] text-gray-400 uppercase font-medium mb-0.5">Lipides</p>
            <p className="text-sm font-bold text-white">{dailyGoals.fat.current}g</p>
            <p className="text-[8px] text-gray-500">/ {dailyGoals.fat.target}g</p>
          </div>
        </div>
      </div>

      {/* Graphique de progression hebdomadaire */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-violet-400" strokeWidth={2.5} />
            <h3 className="text-white text-sm font-semibold">Progression</h3>
          </div>
          <div className="flex gap-1 bg-black/30 rounded-lg p-1">
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                selectedPeriod === 'week'
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                selectedPeriod === 'month'
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400'
              }`}
            >
              Mois
            </button>
          </div>
        </div>

        {/* Graphique en barres */}
        <div className="flex items-end justify-between gap-2 h-32 mb-2">
          {weeklyData.map((data, idx) => {
            const height = (data.calories / getMaxCalories()) * 100;
            const isToday = idx === weeklyData.length - 1;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-full">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isToday
                        ? 'bg-gradient-to-t from-green-600 to-green-400'
                        : data.calories >= data.target
                        ? 'bg-gradient-to-t from-violet-600 to-violet-400'
                        : 'bg-gradient-to-t from-gray-700 to-gray-600'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className={`text-[10px] font-medium ${
                  isToday ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {data.day}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span>Objectif atteint</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-600" />
            <span>En dessous</span>
          </div>
        </div>
      </div>

      {/* Repas du jour */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Apple size={18} className="text-green-400" strokeWidth={2.5} />
          <h3 className="text-white text-sm font-semibold">Repas du jour</h3>
        </div>
        <div className="space-y-2">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className={`rounded-lg p-3 transition-all ${
                meal.completed
                  ? 'bg-green-600/10 border border-green-600/20'
                  : 'bg-black/20 border border-gray-800'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white text-sm font-bold">{meal.name}</p>
                    {meal.completed && (
                      <div className="bg-green-600/30 rounded px-1.5 py-0.5">
                        <span className="text-green-400 text-[9px] font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">{meal.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-bold">{meal.calories}</p>
                  <p className="text-gray-500 text-[9px]">kcal</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {meal.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] text-gray-400 bg-black/30 rounded px-2 py-0.5"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recettes suggérées */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-violet-400" strokeWidth={2.5} />
            <h3 className="text-white text-sm font-semibold">Recettes suggérées</h3>
          </div>
          <button className="text-violet-400 text-xs font-medium flex items-center gap-1">
            Voir tout
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-2">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-black/20 border border-gray-800 rounded-lg p-3 flex items-center gap-3 active:scale-95 transition-transform"
            >
              <div className="text-3xl">{recipe.image}</div>
              <div className="flex-1">
                <p className="text-white text-sm font-bold mb-1">{recipe.name}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>{recipe.calories} kcal</span>
                  <span>•</span>
                  <span>{recipe.protein}g protéines</span>
                  <span>•</span>
                  <span>{recipe.time}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </div>
          ))}
        </div>
      </div>

      {/* Bouton d'action */}
      <button className="w-full bg-gradient-to-r from-green-600 to-green-500 rounded-lg py-3 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-green-600/20">
        <Plus size={18} strokeWidth={3} />
        Ajouter un repas
      </button>
    </div>
  );
};

export default Nutrition;
