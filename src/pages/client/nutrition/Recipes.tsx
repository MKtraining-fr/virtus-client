import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meal, MealItem } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../../components/Modal';
import { ArrowLeftIcon } from '../../../constants/icons';

const Recipes: React.FC = () => {
  const navigate = useNavigate();
  const { user, recipes, theme } = useAuth();
  const [selectedRecipe, setSelectedRecipe] = useState<Meal | null>(null);

  const visibleRecipes = useMemo(() => {
    if (!user) return [];
    // Show system recipes (no coachId or system) AND recipes from the client's assigned coach
    return recipes.filter(
      (recipe) => !recipe.coachId || recipe.coachId === 'system' || recipe.coachId === user.coachId
    );
  }, [recipes, user]);

  const calculateMacros = (items: MealItem[]) => {
    return items.reduce(
      (acc, item) => {
        const ratio = item.quantity / 100;
        acc.calories += (item.food.calories || 0) * ratio;
        acc.protein += (item.food.protein || 0) * ratio;
        acc.carbs += (item.food.carbs || 0) * ratio;
        acc.fat += (item.food.fat || 0) * ratio;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white dark:bg-client-card rounded-full text-gray-800 dark:text-client-light hover:bg-gray-100 dark:hover:bg-primary/20 border border-gray-500 dark:border-gray-700"
          aria-label="Retour"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-client-light">
          Bibliothèque de recettes
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleRecipes.map((recipe) => {
          const macros = calculateMacros(recipe.items);
          return (
            <div
              key={recipe.id}
              className="bg-white dark:bg-client-card rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-primary/20 border border-gray-400 dark:border-transparent"
              onClick={() => setSelectedRecipe(recipe)}
            >
              <h3 className="font-semibold text-gray-900 dark:text-client-light">{recipe.name}</h3>
              <p className="text-xs text-gray-500 dark:text-client-subtle">
                {Math.round(macros.calories)} kcal &middot; P:{Math.round(macros.protein)}g G:
                {Math.round(macros.carbs)}g L:{Math.round(macros.fat)}g
              </p>
            </div>
          );
        })}
      </div>

      {selectedRecipe && (
        <Modal
          isOpen={!!selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          title={selectedRecipe.name}
          theme={theme}
        >
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-lg mb-2 text-primary">Ingrédients</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-client-light">
                {selectedRecipe.items.map((item) => (
                  <li key={item.id}>
                    {item.food.name} - {item.quantity}
                    {item.unit}
                  </li>
                ))}
              </ul>
            </div>

            {selectedRecipe.steps &&
              selectedRecipe.steps.length > 0 &&
              selectedRecipe.steps.some((s) => s.trim() !== '') && (
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-primary">Préparation</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-client-light">
                    {selectedRecipe.steps.map(
                      (step, index) => step.trim() && <li key={index}>{step}</li>
                    )}
                  </ol>
                </div>
              )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Recipes;
