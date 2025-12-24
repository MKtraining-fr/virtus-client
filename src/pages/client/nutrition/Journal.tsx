import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Meal, MealItem, FoodItem, Client } from '../../../types';
import AddFoodModal from '../../../components/client/AddFoodModal';
import CircularProgress from '../../../components/CircularProgress';
import { INITIAL_RECIPES, INITIAL_MEALS } from '../../../data/initialData';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { ArrowLeftIcon, TrashIcon, PlusIcon } from '../../../constants/icons';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const MEAL_STRUCTURE_TEMPLATE: { id: string; name: string }[] = [
  { id: 'breakfast', name: 'Petit-déjeuner' },
  { id: 'snack1', name: 'Collation 1' },
  { id: 'lunch', name: 'Déjeuner' },
  { id: 'snack2', name: 'Collation 2' },
  { id: 'dinner', name: 'Dîner' },
  { id: 'snack3', name: 'Collation 3' },
];

const Journal: React.FC = () => {
  const { user, setClients, clients, foodItems, recipes, meals, theme } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [mealToAddTo, setMealToAddTo] = useState<Meal | null>(null);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [isAddMealMenuOpen, setIsAddMealMenuOpen] = useState(false);
  const addMealMenuRef = useRef<HTMLDivElement>(null);

  const foodAndRecipeDb = useMemo(() => {
    const recipesForSidebar = recipes.map((r) => ({ ...r, type: 'Recette' as const }));
    const mealsForSidebar = meals.map((m) => ({ ...m, type: 'Repas' as const }));
    return [...recipesForSidebar, ...mealsForSidebar, ...foodItems];
  }, [foodItems, recipes, meals]);

  const dateKey = formatDate(selectedDate);

  const { journalDayMeals, isFromPlan } = useMemo(() => {
    const currentDateKey = formatDate(selectedDate);

    if (user?.nutrition.foodJournal && currentDateKey in user.nutrition.foodJournal) {
      return { journalDayMeals: user.nutrition.foodJournal[currentDateKey], isFromPlan: false };
    }

    const assignedPlan = user?.assignedNutritionPlans?.[0];
    if (assignedPlan) {
      const planDaysForWeek1 = assignedPlan.daysByWeek[1] || [];
      if (planDaysForWeek1.length > 0) {
        const dayOfWeekIndex = (selectedDate.getDay() + 6) % 7; // Monday is 0
        const planDayToShow = planDaysForWeek1[dayOfWeekIndex % planDaysForWeek1.length];
        return { journalDayMeals: planDayToShow.meals || [], isFromPlan: true };
      }
    }
    return { journalDayMeals: [], isFromPlan: false };
  }, [user, selectedDate]);

  const macroGoals = useMemo(() => {
    if (
      !user?.nutrition.macros ||
      (user.nutrition.macros.protein === 0 &&
        user.nutrition.macros.carbs === 0 &&
        user.nutrition.macros.fat === 0)
    ) {
      return { protein: 150, carbs: 200, fat: 60, calories: 1940 };
    }
    const { protein, carbs, fat } = user.nutrition.macros;
    return { protein, carbs, fat, calories: protein * 4 + carbs * 4 + fat * 9 };
  }, [user]);

  const dailyTotals = useMemo(() => {
    return journalDayMeals.reduce(
      (acc, meal) => {
        meal.items.forEach((item) => {
          const ratio = item.quantity / 100;
          acc.calories += item.food.calories * ratio;
          acc.protein += item.food.protein * ratio;
          acc.carbs += item.food.carbs * ratio;
          acc.fat += item.food.fat * ratio;
        });
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [journalDayMeals]);

  const updateJournal = async (newJournalForDay: Meal[]) => {
    if (!user) return;
    const currentJournal = user.nutrition.foodJournal || {};
    const updatedJournal = { ...currentJournal, [dateKey]: newJournalForDay };
    const updatedNutrition = { ...user.nutrition, foodJournal: updatedJournal };
    
    // Mise à jour locale immédiate pour une UX réactive
    const updatedClients = clients.map((c) => {
      if (c.id === user.id) {
        return { ...c, nutrition: updatedNutrition };
      }
      return c;
    });
    setClients(updatedClients as Client[]);
    
    // Persistance dans Supabase
    try {
      const { error } = await supabase
        .from('clients')
        .update({ nutrition: updatedNutrition })
        .eq('id', user.id);
      
      if (error) {
        console.error('Erreur lors de la sauvegarde du journal:', error);
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du journal:', err);
    }
  };

  const getEditableJournalForDay = (): Meal[] => {
    if (!user) return [];
    // If an entry already exists, return a deep copy of it.
    if (user.nutrition.foodJournal?.[dateKey]) {
      return JSON.parse(JSON.stringify(user.nutrition.foodJournal[dateKey]));
    }
    // If it's from a plan and doesn't exist in the journal, return a deep copy of the plan.
    if (isFromPlan) {
      return JSON.parse(JSON.stringify(journalDayMeals));
    }
    // Otherwise, it's a blank day.
    return journalDayMeals;
  };

  const handleUpdateQuantity = (mealId: string, itemId: string, newQuantity: string) => {
    const dayToUpdate = getEditableJournalForDay();
    const numQuantity = parseInt(newQuantity, 10);

    const updatedMeals = dayToUpdate.map((meal) => {
      if (meal.id === mealId) {
        return {
          ...meal,
          items: meal.items.map((item) => {
            if (item.id === itemId) {
              return { ...item, quantity: isNaN(numQuantity) ? 0 : numQuantity };
            }
            return item;
          }),
        };
      }
      return meal;
    });
    updateJournal(updatedMeals);
  };

  const handleAddFoodItem = (food: FoodItem, quantity: number, unit: 'g' | 'ml') => {
    if (!mealToAddTo || !user) return;
    const newMealItem: MealItem = { id: `item-${Date.now()}`, food, quantity, unit };
    const dayToUpdate = getEditableJournalForDay();

    let mealFound = false;
    const updatedMeals = dayToUpdate.map((meal: Meal) => {
      if (meal.id === mealToAddTo.id) {
        mealFound = true;
        return { ...meal, items: [...meal.items, newMealItem] };
      }
      return meal;
    });

    if (!mealFound) {
      updatedMeals.push({ ...mealToAddTo, items: [newMealItem] });
    }

    updateJournal(updatedMeals);
    setIsAddFoodModalOpen(false);
    setMealToAddTo(null);
  };

  const handleAddRecipeItems = (recipe: Meal) => {
    if (!mealToAddTo || !user) return;
    const newItems: MealItem[] = recipe.items.map((item) => ({
      ...item,
      id: `item-${Date.now()}-${Math.random()}`,
    }));

    const dayToUpdate = getEditableJournalForDay();
    let mealFound = false;
    const updatedMeals = dayToUpdate.map((meal: Meal) => {
      if (meal.id === mealToAddTo.id) {
        mealFound = true;
        return { ...meal, items: [...meal.items, ...newItems] };
      }
      return meal;
    });

    if (!mealFound) {
      updatedMeals.push({ ...mealToAddTo, items: newItems });
    }

    updateJournal(updatedMeals);
    setIsAddFoodModalOpen(false);
    setMealToAddTo(null);
  };

  const handleDeleteFood = (mealId: string, itemId: string) => {
    const dayToUpdate = getEditableJournalForDay();
    const newJournalDay = dayToUpdate.map((m: Meal) =>
      m.id === mealId ? { ...m, items: m.items.filter((i) => i.id !== itemId) } : m
    );
    updateJournal(newJournalDay);
  };

  const handleAddCustomMeal = () => {
    if (!newMealName.trim() || !user) return;
    const newMeal: Meal = { id: `custom-${Date.now()}`, name: newMealName.trim(), items: [] };
    const dayToUpdate = getEditableJournalForDay();
    dayToUpdate.push(newMeal);
    updateJournal(dayToUpdate);
    setIsAddMealModalOpen(false);
    setNewMealName('');
  };

  const handleAddStandardMeal = (mealTemplate: { id: string; name: string }) => {
    if (!user) return;
    const dayToUpdate = getEditableJournalForDay();
    const newMeal: Meal = { ...mealTemplate, items: [] };
    const newMeals = [...dayToUpdate, newMeal];

    newMeals.sort((a, b) => {
      const indexA = MEAL_STRUCTURE_TEMPLATE.findIndex((m) => m.id === a.id);
      const indexB = MEAL_STRUCTURE_TEMPLATE.findIndex((m) => m.id === b.id);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    updateJournal(newMeals);
    setIsAddMealMenuOpen(false);
  };

  const handleDeleteMeal = (mealId: string) => {
    if (!user || !window.confirm('Êtes-vous sûr de vouloir supprimer ce repas ?')) return;
    const dayToUpdate = getEditableJournalForDay();
    const newJournalDay = dayToUpdate.filter((m: Meal) => m.id !== mealId);
    updateJournal(newJournalDay);
  };

  const openAddFoodModal = (meal: Meal) => {
    setMealToAddTo(meal);
    setIsAddFoodModalOpen(true);
  };

  const mealsForMenu = useMemo(() => {
    const currentMealIds = new Set(journalDayMeals.map((m) => m.id));
    return MEAL_STRUCTURE_TEMPLATE.filter((template) => !currentMealIds.has(template.id));
  }, [journalDayMeals]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMealMenuRef.current && !addMealMenuRef.current.contains(event.target as Node)) {
        setIsAddMealMenuOpen(false);
      }
    };
    if (isAddMealMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddMealMenuOpen]);

  const MealCard = ({ meal }: { meal: Meal }) => {
    const isCustom = !MEAL_STRUCTURE_TEMPLATE.some((t) => t.id === meal.id);
    const canDelete = isCustom || !isFromPlan;

    return (
      <div className="bg-white dark:bg-client-card rounded-lg p-4 border border-gray-200 dark:border-transparent">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-lg text-gray-900 dark:text-client-light">
            {meal.name}
          </h4>
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={() => handleDeleteMeal(meal.id)}
                className="p-1.5 text-gray-500 dark:text-client-subtle hover:text-red-500 rounded-full"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => openAddFoodModal(meal)}
              className="p-1.5 bg-primary/10 dark:bg-primary/20 text-primary rounded-full"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {meal.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-client-dark rounded-md"
            >
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-800 dark:text-client-light">
                  {item.food.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-client-subtle">
                  {Math.round(item.food.calories * (item.quantity / 100))} kcal
                </p>
              </div>
              <div className="flex items-center">
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleUpdateQuantity(meal.id, item.id, e.target.value)}
                  className="w-16 text-center !py-1 h-8"
                />
                <span className="ml-2 text-sm text-gray-500 dark:text-client-subtle">
                  {item.unit}
                </span>
              </div>
              <button onClick={() => handleDeleteFood(meal.id, item.id)} className="p-1">
                <TrashIcon className="w-4 h-4 text-gray-500 dark:text-client-subtle" />
              </button>
            </div>
          ))}
          {meal.items.length === 0 && (
            <p className="text-sm text-center text-gray-500 dark:text-client-subtle py-2">
              Aucun aliment ajouté.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white dark:bg-client-card rounded-full text-gray-800 dark:text-client-light hover:bg-gray-100 dark:hover:bg-primary/20 border border-gray-300 dark:border-gray-700"
          aria-label="Retour"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
      </div>

      <input
        type="date"
        value={dateKey}
        onChange={(e) => setSelectedDate(new Date(e.target.value))}
        className="w-full p-2 rounded-lg bg-white dark:bg-client-card border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-client-light"
        style={{ colorScheme: theme }}
      />

      {isFromPlan && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md text-center text-sm text-blue-800 dark:text-blue-200">
          Ceci est le <strong>plan assigné</strong>. Toute modification sera enregistrée dans votre
          journal.
        </div>
      )}

      <div className="bg-white dark:bg-client-card rounded-lg p-4 border border-gray-200 dark:border-transparent">
        <h3 className="font-semibold text-lg mb-4 text-center text-gray-900 dark:text-client-light">
          Résumé du jour
        </h3>
        <div className="flex items-center justify-around flex-wrap gap-4">
          <CircularProgress
            size={100}
            strokeWidth={8}
            percentage={(dailyTotals.calories / macroGoals.calories) * 100}
            color="#7A68FA"
            surplusColor="#5a4fbf"
          >
            <span className="text-xl font-bold">{Math.round(dailyTotals.calories)}</span>
            <span className="text-xs text-gray-500 dark:text-client-subtle">kcal</span>
          </CircularProgress>
          <div className="flex gap-4">
            <CircularProgress
              size={70}
              strokeWidth={6}
              percentage={(dailyTotals.protein / macroGoals.protein) * 100}
              color="#ef4444"
              surplusColor="#b91c1c"
            >
              <span className="font-bold text-sm">{Math.round(dailyTotals.protein)}g</span>
              <span className="text-xs text-gray-500 dark:text-client-subtle">Prot</span>
            </CircularProgress>
            <CircularProgress
              size={70}
              strokeWidth={6}
              percentage={(dailyTotals.carbs / macroGoals.carbs) * 100}
              color="#10b981"
              surplusColor="#065f46"
            >
              <span className="font-bold text-sm">{Math.round(dailyTotals.carbs)}g</span>
              <span className="text-xs text-gray-500 dark:text-client-subtle">Gluc</span>
            </CircularProgress>
            <CircularProgress
              size={70}
              strokeWidth={6}
              percentage={(dailyTotals.fat / macroGoals.fat) * 100}
              color="#facc15"
              surplusColor="#ca8a04"
            >
              <span className="font-bold text-sm">{Math.round(dailyTotals.fat)}g</span>
              <span className="text-xs text-gray-500 dark:text-client-subtle">Lip</span>
            </CircularProgress>
          </div>
        </div>
      </div>

      {journalDayMeals.length > 0 ? (
        journalDayMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)
      ) : (
        <p className="text-center text-client-subtle py-4">Commencez par ajouter un repas.</p>
      )}

      <div className="pt-4 relative" ref={addMealMenuRef}>
        <button
          onClick={() => setIsAddMealMenuOpen((prev) => !prev)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-client-card border-2 border-dashed border-gray-300 dark:border-client-subtle rounded-lg text-gray-800 dark:text-client-light hover:border-primary hover:text-primary transition-colors"
        >
          <PlusIcon className="w-6 h-6" />
          <span>Ajouter une section repas</span>
        </button>
        {isAddMealMenuOpen && (
          <div className="absolute bottom-full mb-2 w-full bg-white dark:bg-client-card rounded-lg shadow-lg py-1 z-10 ring-1 ring-black/5 dark:ring-white/10">
            {mealsForMenu.map((meal) => (
              <button
                key={meal.id}
                onClick={() => handleAddStandardMeal(meal)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-client-light hover:bg-gray-100 dark:hover:bg-primary/20"
              >
                {meal.name}
              </button>
            ))}
            <button
              onClick={() => {
                setIsAddMealModalOpen(true);
                setIsAddMealMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-primary font-semibold hover:bg-gray-100 dark:hover:bg-primary/20"
            >
              + Repas personnalisé
            </button>
          </div>
        )}
      </div>

      <AddFoodModal
        isOpen={isAddFoodModalOpen}
        onClose={() => setIsAddFoodModalOpen(false)}
        onAddFoodItem={handleAddFoodItem}
        onAddRecipe={handleAddRecipeItems}
        db={foodAndRecipeDb}
        mealName={mealToAddTo?.name || ''}
      />

      <Modal
        isOpen={isAddMealModalOpen}
        onClose={() => setIsAddMealModalOpen(false)}
        title="Ajouter un repas personnalisé"
        theme={theme}
      >
        <div className="space-y-4">
          <Input
            label="Nom du repas"
            value={newMealName}
            onChange={(e) => setNewMealName(e.target.value)}
            placeholder="Ex: Collation post-entraînement"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsAddMealModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddCustomMeal} disabled={!newMealName.trim()}>
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Journal;
