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

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
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
  // Catégorie principale : Tout, Recettes, Repas, Brut, Autre
  const [mainCategory, setMainCategory] = useState('Tout');
  // Famille d'aliments (subcategory) - dynamique selon la catégorie principale
  const [familyFilter, setFamilyFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Reset state when modal is closed to avoid stale data on reopen
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSearchTerm('');
        setSelectedFood(null);
        setQuantity('100');
        setUnit('g');
        setMainCategory('Tout');
        setFamilyFilter('');
        setShowFilters(false);
      }, 200); // Delay to allow for animations
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Catégories principales disponibles
  const mainCategories = useMemo(() => {
    let hasRecipes = false;
    let hasMeals = false;
    let hasBrut = false;
    let hasAutre = false;

    db.forEach((item) => {
      if ('type' in item) {
        if (item.type === 'Recette') hasRecipes = true;
        if (item.type === 'Repas') hasMeals = true;
      } else if ('foodType' in item) {
        if ((item as FoodItem).foodType === 'brut') hasBrut = true;
        if ((item as FoodItem).foodType === 'autre') hasAutre = true;
      }
    });

    return [
      'Tout',
      ...(hasRecipes ? ['Recettes'] : []),
      ...(hasMeals ? ['Repas'] : []),
      ...(hasBrut ? ['🥬 Aliments bruts'] : []),
      ...(hasAutre ? ['🍰 Autres aliments'] : []),
    ];
  }, [db]);

  // Extraire les familles d'aliments uniques (filtrées par catégorie principale)
  const families = useMemo(() => {
    const fams = new Set<string>();
    db.forEach((item) => {
      if ('subcategory' in item && item.subcategory) {
        const foodItem = item as FoodItem;
        // Filtrer selon la catégorie principale sélectionnée
        if (mainCategory === 'Tout') {
          fams.add(foodItem.subcategory as string);
        } else if (mainCategory === '🥬 Aliments bruts' && foodItem.foodType === 'brut') {
          fams.add(foodItem.subcategory as string);
        } else if (mainCategory === '🍰 Autres aliments' && foodItem.foodType === 'autre') {
          fams.add(foodItem.subcategory as string);
        }
      }
    });
    return Array.from(fams).sort();
  }, [db, mainCategory]);

  // Réinitialiser la famille quand la catégorie principale change
  const handleMainCategoryChange = (category: string) => {
    setMainCategory(category);
    setFamilyFilter('');
  };

  // Catégories prioritaires pour le tri (aliments simples en premier)
  const PRIORITY_CATEGORIES = [
    'fruits, légumes, légumineuses et oléagineux',
    'viandes, oeufs, poissons',
    'produits laitiers',
    'produits céréaliers',
    'matières grasses',
  ];

  // Catégories de plats composés (affichés en dernier)
  const COMPOSED_CATEGORIES = [
    'entrées et plats composés',
    'aides culinaires et ingrédients divers',
  ];

  const filteredResults = useMemo(() => {
    if (!searchTerm && mainCategory === 'Tout' && !familyFilter) return [];

    let results: SearchableItem[] = db;

    // Filtre par catégorie principale
    if (mainCategory !== 'Tout') {
      if (mainCategory === 'Recettes') {
        results = results.filter((item) => 'type' in item && item.type === 'Recette');
      } else if (mainCategory === 'Repas') {
        results = results.filter((item) => 'type' in item && item.type === 'Repas');
      } else if (mainCategory === '🥬 Aliments bruts') {
        results = results.filter(
          (item) => 'foodType' in item && (item as FoodItem).foodType === 'brut'
        );
      } else if (mainCategory === '🍰 Autres aliments') {
        results = results.filter(
          (item) => 'foodType' in item && (item as FoodItem).foodType === 'autre'
        );
      }
    }

    // Filtre par famille d'aliments (subcategory)
    if (familyFilter) {
      results = results.filter(
        (item) => 'subcategory' in item && item.subcategory === familyFilter
      );
    }

    // Filtre par recherche textuelle
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      results = results.filter((f) => f.name.toLowerCase().includes(lowercasedFilter));
    }

    // Tri des résultats : priorité aux aliments simples
    results.sort((a, b) => {
      // Recettes et Repas en dernier
      const aIsRecipe = 'type' in a;
      const bIsRecipe = 'type' in b;
      if (aIsRecipe && !bIsRecipe) return 1;
      if (!aIsRecipe && bIsRecipe) return -1;

      // Pour les aliments, trier par catégorie
      if (!aIsRecipe && !bIsRecipe) {
        const aFood = a as FoodItem;
        const bFood = b as FoodItem;

        // Aliments bruts avant autres
        if (aFood.foodType === 'brut' && bFood.foodType !== 'brut') return -1;
        if (aFood.foodType !== 'brut' && bFood.foodType === 'brut') return 1;

        // Catégories prioritaires
        const aPriority = PRIORITY_CATEGORIES.indexOf(aFood.category || '');
        const bPriority = PRIORITY_CATEGORIES.indexOf(bFood.category || '');
        const aComposed = COMPOSED_CATEGORIES.indexOf(aFood.category || '');
        const bComposed = COMPOSED_CATEGORIES.indexOf(bFood.category || '');

        // Catégories prioritaires en premier
        if (aPriority !== -1 && bPriority === -1) return -1;
        if (aPriority === -1 && bPriority !== -1) return 1;
        if (aPriority !== -1 && bPriority !== -1 && aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // Plats composés en dernier
        if (aComposed !== -1 && bComposed === -1) return 1;
        if (aComposed === -1 && bComposed !== -1) return -1;

        // Bonus: aliments dont le nom commence par le terme recherché
        if (searchTerm) {
          const lowercasedFilter = searchTerm.toLowerCase();
          const aStartsWith = a.name.toLowerCase().startsWith(lowercasedFilter);
          const bStartsWith = b.name.toLowerCase().startsWith(lowercasedFilter);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
        }
      }

      // Tri alphabétique par défaut
      return a.name.localeCompare(b.name);
    });

    return results.slice(0, 50);
  }, [searchTerm, db, mainCategory, familyFilter]);

  const calculatedMacros = useMemo(() => {
    if (!selectedFood) return null;
    const numQuantity = parseInt(quantity, 10) || 0;
    const ratio = numQuantity / 100;
    return {
      calories: Math.round((selectedFood.calories || 0) * ratio),
      protein: Math.round((selectedFood.protein || 0) * ratio),
      carbs: Math.round((selectedFood.carbs || 0) * ratio),
      fat: Math.round((selectedFood.fat || 0) * ratio),
    };
  }, [selectedFood, quantity]);

  const handleAdd = () => {
    if (selectedFood) {
      onAddFoodItem(selectedFood, parseInt(quantity, 10) || 100, unit);
      setSelectedFood(null);
      setSearchTerm('');
    }
  };

  const hasActiveFilters = mainCategory !== 'Tout' || familyFilter;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ajouter à ${mealName}`}
      theme={theme}
    >
      {!selectedFood ? (
        <div className="space-y-3">
          <Input
            placeholder="Rechercher un aliment, une recette..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Bouton pour afficher/masquer les filtres avancés */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-client-subtle hover:text-primary transition-colors"
          >
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
            Filtres avancés
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-white rounded-full">
                {[mainCategory !== 'Tout', familyFilter].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Filtres avancés (catégorie + famille) */}
          {showFilters && (
            <div className="space-y-2 p-3 bg-gray-50 dark:bg-client-dark rounded-lg">
              {/* Filtre par catégorie principale (Brut/Autre) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-client-subtle mb-1">
                  Catégorie
                </label>
                <select
                  value={mainCategory}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-client-dark text-gray-800 dark:text-client-light focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {mainCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'Tout' ? 'Toutes les catégories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par famille d'aliments */}
              {families.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-client-subtle mb-1">
                    Famille d'aliments
                  </label>
                  <select
                    value={familyFilter}
                    onChange={(e) => setFamilyFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-client-dark text-gray-800 dark:text-client-light focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Toutes les familles</option>
                    {families.map((family) => (
                      <option key={family} value={family}>
                        {family.charAt(0).toUpperCase() + family.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bouton de réinitialisation */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setMainCategory('Tout');
                    setFamilyFilter('');
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}

          {/* Catégories rapides (pills) - visible uniquement si filtres masqués */}
          {!showFilters && (
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-1 px-1">
              {mainCategories.slice(0, 5).map((category) => (
                <button
                  key={category}
                  onClick={() => handleMainCategoryChange(category)}
                  className={`flex-shrink-0 px-3 py-1 text-sm rounded-full transition-colors ${
                    mainCategory === category
                      ? 'bg-primary text-white font-semibold'
                      : 'bg-gray-100 dark:bg-client-dark text-gray-600 dark:text-client-subtle hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
              {mainCategories.length > 5 && (
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex-shrink-0 px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-client-dark text-gray-600 dark:text-client-subtle hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  +{mainCategories.length - 5}
                </button>
              )}
            </div>
          )}

          {/* Indicateur de filtre actif */}
          {hasActiveFilters && (
            <p className="text-xs text-gray-500 dark:text-client-subtle">
              {filteredResults.length} résultat{filteredResults.length > 1 ? 's' : ''}
              {mainCategory !== 'Tout' && ` dans "${mainCategory}"`}
              {familyFilter && ` → "${familyFilter}"`}
            </p>
          )}

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {filteredResults.map((item) => {
              // FIX: Use a more general check for meal/recipe types.
              const isMealOrRecipe = 'type' in item;
              const foodItem = item as FoodItem;
              const macroString = isMealOrRecipe
                ? (() => {
                    const macros = calculateRecipeMacros((item as Meal).items);
                    return `${macros.calories} kcal | P:${macros.protein}g G:${macros.carbs}g L:${macros.fat}g`;
                  })()
                : `${foodItem.calories} kcal / 100g`;

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
                  <div className="pl-6">
                    <p className="text-xs text-gray-500 dark:text-client-subtle">
                      {macroString}
                    </p>
                    {!isMealOrRecipe && foodItem.subcategory && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {foodItem.subcategory}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">{selectedFood.name}</h3>
          {selectedFood.subcategory && (
            <p className="text-sm text-gray-500 dark:text-client-subtle -mt-2">
              {selectedFood.subcategory}
            </p>
          )}
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
              <div className="flex rounded-lg bg-gray-100 dark:bg-client-dark border border-gray-300 dark:border-gray-700">
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

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
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
