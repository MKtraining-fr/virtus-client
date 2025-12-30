import React, { useState, useMemo } from 'react';
import Card from './Card';
import Input from './Input';
import FilterChip from './FilterChip';
import { FoodItem, Meal, MealItem } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { useAuthStore } from '../stores/useAuthStore';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

type SidebarItem = FoodItem | (Meal & { type: 'Repas' | 'Recette' });

interface FoodFilterSidebarProps {
  db: SidebarItem[];
}

const FoodFilterSidebar: React.FC<FoodFilterSidebarProps> = ({ db }) => {
  const { user } = useAuthStore();
  const { favorites, isFavorite, toggleFavorite, isLoading: favoritesLoading } = useFavorites(user?.id, 'food');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);

  const foodCategories = useMemo(() => {
    const categories = new Set<string>();
    db.forEach((item) => {
      if ('items' in item) {
        // Meal or Recipe
        categories.add(item.type);
      } else {
        // FoodItem
        categories.add(item.category);
      }
    });
    const categoryArray = Array.from(categories);
    const special = ['Repas', 'Recette', 'Groupe alimentaire'];

    const specialPresent = special.filter((s) => categoryArray.includes(s));
    const otherCategories = categoryArray.filter((c) => !special.includes(c)).sort();

    return [...specialPresent, ...otherCategories];
  }, [db]);

  const toggleSelection = (item: string) => {
    setSelectedCategories((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: SidebarItem) => {
    const isMealOrRecipe = 'items' in item;
    const transferData = {
      type: isMealOrRecipe ? 'meal' : 'food',
      data: item,
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(transferData));
    // Ajouter un feedback visuel
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Restaurer l'opacité
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await toggleFavorite(itemId);
    } catch (err) {
      console.error('[FoodFilterSidebar] Erreur lors du toggle favori:', err);
    }
  };

  const filteredResults = useMemo(() => {
    // Séparer les mots-clés de recherche et filtrer les mots vides
    const searchTerms = searchTerm
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    return db.filter((item) => {
      const itemNameLower = item.name.toLowerCase();
      
      // Tous les mots-clés doivent être présents dans le nom (recherche AND)
      const matchesSearch = searchTerms.length === 0 || 
        searchTerms.every((term) => itemNameLower.includes(term));

      let itemCategory: string;
      if ('items' in item) {
        itemCategory = item.type;
      } else {
        itemCategory = item.category;
      }

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(itemCategory);
      
      // Filtrer par favoris si activé
      const matchesFavorites = !showFavoritesOnly || isFavorite(item.id);

      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [db, searchTerm, selectedCategories, showFavoritesOnly, isFavorite]);

  const calculateMealMacros = (items: MealItem[]) => {
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

  const favoritesCount = useMemo(() => {
    return db.filter((item) => isFavorite(item.id)).length;
  }, [db, isFavorite]);

  return (
    <Card className="p-4 h-full flex flex-col min-h-0 text-sm">
      <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <h2 className="text-base font-semibold mb-1">Aliments</h2>
      </div>
      <Input
        placeholder="Rechercher un aliment..."
        className="mb-4"
        aria-label="Rechercher un aliment"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Filtre Favoris */}
      <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <button
          type="button"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-2 w-full text-left ${
            showFavoritesOnly ? 'text-yellow-700 font-semibold' : 'text-gray-700'
          }`}
        >
          {showFavoritesOnly ? (
            <StarIconSolid className="w-5 h-5 text-yellow-500" />
          ) : (
            <StarIcon className="w-5 h-5 text-yellow-500" />
          )}
          <span>Favoris uniquement ({favoritesCount})</span>
        </button>
      </div>

      {db.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Aucun aliment chargé. Veuillez vérifier votre connexion à la base de données.
          </p>
        </div>
      )}

      {foodCategories.length > 0 && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-1 gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              Catégories
            </h3>
            <button
              type="button"
              className="text-[11px] font-medium text-blue-700 hover:text-blue-900"
              aria-expanded={isCategoryOpen}
              onClick={() => setIsCategoryOpen((prev) => !prev)}
            >
              {isCategoryOpen ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          {isCategoryOpen && (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
              {foodCategories.map((category) => (
                <FilterChip
                  key={category}
                  label={category}
                  selected={selectedCategories.includes(category)}
                  onClick={() => toggleSelection(category)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <hr className="my-4" />

      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-700">
          Résultats ({filteredResults.length})
        </h3>
      </div>
      <div className="space-y-3 overflow-y-auto flex-grow pr-2 mt-2 min-h-0">
        {filteredResults.map((item, index) => {
          const isMealOrRecipe = 'items' in item;
          return (
            <div
              key={`${item.name}-${index}`}
              className="cursor-grab active:cursor-grabbing group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-opacity"
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragEnd={(e) => handleDragEnd(e)}
            >
              <div className="font-semibold text-gray-800 group-hover:text-primary flex-grow">
                <p>{item.name}</p>
                <p className="text-xs text-gray-500 font-normal">
                  {isMealOrRecipe
                    ? (() => {
                        const macros = calculateMealMacros((item as Meal).items);
                        return `${macros.calories} kcal | P: ${macros.protein}g, G: ${macros.carbs}g, L: ${macros.fat}g`;
                      })()
                    : (() => {
                        const food = item as FoodItem;
                        return `${food.calories} kcal | P: ${food.protein}g, G: ${food.carbs}g, L: ${food.fat}g`;
                      })()}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => handleToggleFavorite(e, item.id)}
                className="p-1 rounded-full hover:bg-yellow-100 transition-colors flex-shrink-0"
                aria-label={isFavorite(item.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                disabled={favoritesLoading}
              >
                {isFavorite(item.id) ? (
                  <StarIconSolid className="w-5 h-5 text-yellow-500" />
                ) : (
                  <StarIcon className="w-5 h-5 text-gray-400 group-hover:text-yellow-500" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default FoodFilterSidebar;
