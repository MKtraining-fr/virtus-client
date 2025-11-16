import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../Modal';
import Input from '../Input';
import { FoodItem, Meal, MealItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

const ClipboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75c0-.231-.035-.454-.1-.664M6.75 7.5h.75v.75h-.75V7.5ZM6.75 10.5h.75v.75h-.75v-.75ZM6.75 13.5h.75v.75h-.75v-.75Z"
    />
  </svg>
);

// FIX: Update SearchableItem to accept 'Repas' type as well.
type SearchableItem = FoodItem | (Meal & { type: 'Recette' | 'Repas' });

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFoodItem: (food: FoodItem, quantity: number, unit: 'g' | 'ml') => void;
  onAddRecipe: (recipe: Meal) => void;
  db: SearchableItem[];
  mealName: string;
}

const calculateRecipeMacros = (items: MealItem[]) => {
  const totals = items.reduce(
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
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
  };
};

const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isOpen,
  onClose,
  onAddFoodItem,
  onAddRecipe,
  db,
  mealName,
}) => {
  const { theme } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState<'g' | 'ml'>('g');
  const [activeCategory, setActiveCategory] = useState('Tout');

  // Reset state when modal is closed to avoid stale data on reopen
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSearchTerm('');
        setSelectedFood(null);
        setQuantity('100');
        setUnit('g');
        setActiveCategory('Tout');
      }, 200); // Delay to allow for animations
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // FIX: Update category detection to include 'Repas'.
  const categories = useMemo(() => {
    const foodCats = new Set<string>();
    let hasRecipes = false;
    let hasMeals = false;
    db.forEach((item) => {
      if ('type' in item) {
        if (item.type === 'Recette') hasRecipes = true;
        if (item.type === 'Repas') hasMeals = true;
      } else if ('category' in item && item.category !== 'Groupe alimentaire') {
        foodCats.add(item.category);
      }
    });
    const sortedFoodCats = Array.from(foodCats).sort();
    return [
      'Tout',
      ...(hasRecipes ? ['Recettes'] : []),
      ...(hasMeals ? ['Repas'] : []),
      ...sortedFoodCats,
    ];
  }, [db]);

  const filteredResults = useMemo(() => {
    if (!searchTerm && activeCategory === 'Tout') return [];

    let results: SearchableItem[] = db;

    // FIX: Update filtering logic to handle the 'Repas' category.
    // 1. Filter by category
    if (activeCategory !== 'Tout') {
      if (activeCategory === 'Recettes') {
        results = db.filter((item) => 'type' in item && item.type === 'Recette');
      } else if (activeCategory === 'Repas') {
        results = db.filter((item) => 'type' in item && item.type === 'Repas');
      } else {
        results = db.filter((item) => 'category' in item && item.category === activeCategory);
      }
    }

    // 2. Filter by search term
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      results = results.filter((f) => f.name.toLowerCase().includes(lowercasedFilter));
    }

    return results.slice(0, 50);
  }, [searchTerm, db, activeCategory]);

  const calculatedMacros = useMemo(() => {
    if (!selectedFood) return null;
    const numQuantity = parseInt(quantity, 10) || 0;
    const ratio = numQuantity / 100;
    return {
      calories: Math.round(selectedFood.calories * ratio),
      protein: (selectedFood.protein * ratio).toFixed(1),
      carbs: (selectedFood.carbs * ratio).toFixed(1),
      fat: (selectedFood.fat * ratio).toFixed(1),
    };
  }, [selectedFood, quantity]);

  const handleAdd = () => {
    if (selectedFood && quantity) {
      onAddFoodItem(selectedFood, parseInt(quantity, 10), unit);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ajouter à : ${mealName}`} theme={theme}>
      {!selectedFood ? (
        <div className="space-y-3">
          <Input
            autoFocus
            type="text"
            placeholder="Rechercher aliment ou recette..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex space-x-2 overflow-x-auto pb-2 -mx-1 px-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex-shrink-0 px-3 py-1 text-sm rounded-full transition-colors ${
                  activeCategory === category
                    ? 'bg-primary text-white font-semibold'
                    : 'bg-gray-100 dark:bg-client-dark text-gray-600 dark:text-client-subtle hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {filteredResults.map((item) => {
              // FIX: Use a more general check for meal/recipe types.
              const isMealOrRecipe = 'type' in item;
              const macroString = isMealOrRecipe
                ? (() => {
                    const macros = calculateRecipeMacros((item as Meal).items);
                    return `${macros.calories} kcal | P:${macros.protein}g G:${macros.carbs}g L:${macros.fat}g`;
                  })()
                : `${(item as FoodItem).calories} kcal / 100g`;

              return (
                <button
                  key={isMealOrRecipe ? item.id : item.name}
                  onClick={() => {
                    // FIX: Correctly handle both 'Repas' and 'Recette' as selectable meal entities.
                    if (isMealOrRecipe) {
                      onAddRecipe(item as Meal);
                    } else {
                      setSelectedFood(item as FoodItem);
                    }
                  }}
                  className="w-full text-left p-2 rounded-md hover:bg-gray-100 dark:hover:bg-client-dark"
                >
                  <div className="flex items-center gap-2">
                    {isMealOrRecipe && <ClipboardIcon className="w-4 h-4 text-primary shrink-0" />}
                    <p className="text-gray-800 dark:text-client-light">{item.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-client-subtle pl-6">
                    {macroString}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">{selectedFood.name}</h3>
          <div className="grid grid-cols-2 gap-4 items-end">
            <Input
              label="Quantité"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-client-subtle mb-1">
                Unité
              </label>
              <div className="flex rounded-lg bg-gray-100 dark:bg-client-dark border border-gray-500 dark:border-gray-700">
                <button
                  onClick={() => setUnit('g')}
                  className={`flex-1 py-2 rounded-l-md text-sm font-semibold transition-colors ${unit === 'g' ? 'bg-primary text-white' : 'text-gray-600 dark:text-client-subtle'}`}
                >
                  g
                </button>
                <button
                  onClick={() => setUnit('ml')}
                  className={`flex-1 py-2 rounded-r-md text-sm font-semibold transition-colors ${unit === 'ml' ? 'bg-primary text-white' : 'text-gray-600 dark:text-client-subtle'}`}
                >
                  ml
                </button>
              </div>
            </div>
          </div>

          {calculatedMacros && (
            <div className="p-3 bg-gray-100 dark:bg-client-dark rounded-lg text-center">
              <p className="font-bold text-xl text-gray-900 dark:text-client-light">
                {calculatedMacros.calories} kcal
              </p>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <span className="font-semibold text-red-500 dark:text-red-400">
                  P: {calculatedMacros.protein}g
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  G: {calculatedMacros.carbs}g
                </span>
                <span className="font-semibold text-yellow-500 dark:text-yellow-400">
                  L: {calculatedMacros.fat}g
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-400 dark:border-gray-700">
            <button
              onClick={() => setSelectedFood(null)}
              className="text-gray-600 dark:text-client-subtle hover:text-gray-900 dark:hover:text-client-light px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Retour
            </button>
            <button
              onClick={handleAdd}
              className="bg-primary text-white font-semibold px-4 py-2 rounded-lg"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AddFoodModal;
