import React, { useMemo, useState } from 'react';
import { NutritionPlan, NutritionDay, MealItem } from '../../types';

interface ClientNutritionPlanViewProps {
    plan: NutritionPlan;
}

const ClientNutritionPlanView: React.FC<ClientNutritionPlanViewProps> = ({ plan }) => {
    const [selectedWeek, setSelectedWeek] = useState(1);
    const weekDays = plan.daysByWeek[selectedWeek] || [];

    const mealNames = useMemo(() => {
        const names = new Set<string>();
        Object.values(plan.daysByWeek).flat().forEach((day: NutritionDay) => {
            day.meals.forEach(meal => names.add(meal.name));
        });

        const standardOrder: { [key: string]: number } = {
            'Petit-déjeuner': 1, 'Collation 1': 2, 'Collation du matin': 2, 'Déjeuner': 3,
            'Collation 2': 4, "Collation de l'après-midi": 4, 'Collation': 4, 'Dîner': 5,
            'Collation 3': 6, 'Collation du soir': 6
        };
        
        return Array.from(names).sort((a, b) => (standardOrder[a] || 99) - (standardOrder[b] || 99));
    }, [plan.daysByWeek]);

    const calculateMacros = (items: MealItem[]) => {
        return items.reduce((acc, item) => {
            if (!item.food) return acc;
            const ratio = item.quantity / 100;
            acc.calories += (item.food.calories || 0) * ratio;
            acc.protein += (item.food.protein || 0) * ratio;
            acc.carbs += (item.food.carbs || 0) * ratio;
            acc.fat += (item.food.fat || 0) * ratio;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    };

    return (
        <div className="text-client-light">
            <h3 className="text-xl font-bold text-primary">{plan.name}</h3>
            <p className="text-sm text-client-subtle mb-4 italic">{plan.objective}</p>
            
            {plan.weekCount > 1 && (
                <div className="mb-4 border-b border-gray-700">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Weeks">
                        {[...Array(plan.weekCount)].map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setSelectedWeek(i + 1)}
                                className={`${selectedWeek === i + 1 ? 'border-primary text-primary' : 'border-transparent text-client-subtle hover:text-client-light hover:border-gray-500'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                            >
                                Semaine {i + 1}
                            </button>
                        ))}
                    </nav>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-client-dark">
                        <tr>
                            <th className="p-2 text-left font-semibold text-client-subtle sticky left-0 bg-client-dark z-10">Jour</th>
                            {mealNames.map(name => (
                                <th key={name} className="p-2 text-left font-semibold text-client-subtle min-w-[220px]">{name}</th>
                            ))}
                            <th className="p-2 text-left font-semibold text-client-subtle min-w-[150px]">Totaux Journaliers</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {weekDays.map(day => {
                            const dailyTotals = calculateMacros(day.meals.flatMap(m => m.items));

                            return (
                                <tr key={day.id}>
                                    <td className="p-2 font-bold align-top sticky left-0 bg-client-card">{day.name}</td>
                                    {mealNames.map(mealName => {
                                        const meal = day.meals.find(m => m.name === mealName);
                                        const mealMacros = meal ? calculateMacros(meal.items) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
                                        
                                        return (
                                            <td key={mealName} className="p-2 align-top border-l border-gray-700">
                                                {meal && meal.items.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {meal.items.map(item => (
                                                            <div key={item.id} className="flex justify-between text-client-light">
                                                                <span className="pr-2">{item.food.name}</span>
                                                                <span className="font-medium text-client-light whitespace-nowrap">{item.quantity}{item.unit}</span>
                                                            </div>
                                                        ))}
                                                        <div className="pt-2 mt-2 border-t border-gray-700 text-xs text-client-subtle font-semibold space-y-0.5">
                                                            <div>{Math.round(mealMacros.calories)} kcal</div>
                                                            <div className="flex justify-between flex-wrap gap-x-2">
                                                                <span className="text-red-400">P: {Math.round(mealMacros.protein)}g</span>
                                                                <span className="text-green-400">G: {Math.round(mealMacros.carbs)}g</span>
                                                                <span className="text-yellow-400">L: {Math.round(mealMacros.fat)}g</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-gray-500">-</span>}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 align-top font-bold border-l border-gray-700">
                                        <div>{Math.round(dailyTotals.calories)} kcal</div>
                                        <div className="font-normal text-xs space-y-0.5 mt-1">
                                            <div className="text-red-400">P: {Math.round(dailyTotals.protein)}g</div>
                                            <div className="text-green-400">G: {Math.round(dailyTotals.carbs)}g</div>
                                            <div className="text-yellow-400">L: {Math.round(dailyTotals.fat)}g</div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {weekDays.length === 0 && (
                    <p className="text-center text-client-subtle py-4">Aucun jour défini pour cette semaine.</p>
                )}
            </div>
        </div>
    );
};

export default ClientNutritionPlanView;
