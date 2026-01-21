import { Apple, TrendingUp, Target, Flame } from 'lucide-react';

const Nutrition = () => {
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

  const getPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
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

      {/* Bouton d'action */}
      <button className="w-full bg-gradient-to-r from-green-600 to-green-500 rounded-lg py-3 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-green-600/20">
        <Apple size={16} strokeWidth={3} />
        Ajouter un repas
      </button>

      {/* Message de développement */}
      <div className="rounded-xl border border-blue-600/30 bg-gradient-to-br from-blue-600/10 to-blue-600/5 p-4 text-center">
        <p className="text-blue-400 text-xs font-medium">
          📱 Fonctionnalités avancées à venir
        </p>
        <p className="text-gray-500 text-[10px] mt-1">
          Scan de codes-barres, base de données alimentaire, recettes
        </p>
      </div>
    </div>
  );
};

export default Nutrition;
