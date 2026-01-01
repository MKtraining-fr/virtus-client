import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Input from '../../../components/Input';
import ClientAccordion from '../../../components/client/ClientAccordion';
import Button from '../../../components/Button';
import { ArrowLeftIcon } from '../../../constants/icons';
import FilterChip from '../../../components/FilterChip';
import { useFavorites } from '../../../hooks/useFavorites';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const Ciqual: React.FC = () => {
  const { foodItems, user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { favorites, isFavorite, toggleFavorite, isLoading: favoritesLoading } = useFavorites(user?.id, 'food');

  const categories = useMemo(() => {
    const foodCats = new Set<string>();
    foodItems.forEach((item) => {
      if (item.category !== 'Groupe alimentaire') {
        foodCats.add(item.category);
      }
    });
    return Array.from(foodCats).sort();
  }, [foodItems]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleToggleFavorite = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await toggleFavorite(itemId);
    } catch (err) {
      console.error('[Ciqual] Erreur lors du toggle favori:', err);
    }
  };

  const filteredFood = useMemo(() => {
    return foodItems.filter((f) => {
      if (f.category === 'Groupe alimentaire') return false;

      const matchesSearch = !searchTerm || f.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(f.category);

      const matchesFavorites = !showFavoritesOnly || isFavorite(f.id);

      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [searchTerm, foodItems, selectedCategories, showFavoritesOnly, isFavorite]);

  const favoritesCount = useMemo(() => {
    return foodItems.filter((f) => f.category !== 'Groupe alimentaire' && isFavorite(f.id)).length;
  }, [foodItems, isFavorite]);

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
        <h2 className="text-xl font-bold text-gray-900 dark:text-client-light">
          Base de données Ciqual
        </h2>
      </div>

      <Input
        type="text"
        placeholder="Rechercher un aliment..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Filtre Favoris */}
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
        <button
          type="button"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-2 w-full text-left ${
            showFavoritesOnly ? 'text-yellow-700 dark:text-yellow-400 font-semibold' : 'text-gray-700 dark:text-client-light'
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

      <ClientAccordion title="Filtres par catégorie">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              selected={selectedCategories.includes(cat)}
              onClick={() => toggleCategory(cat)}
            />
          ))}
        </div>
        {selectedCategories.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setSelectedCategories([])}>
              Réinitialiser
            </Button>
          </div>
        )}
      </ClientAccordion>

      <div className="max-h-[50vh] overflow-y-auto space-y-1 pr-2">
        {filteredFood.slice(0, 200).map((food) => (
          <div
            key={food.id}
            className="p-3 bg-white dark:bg-client-card rounded-lg border border-gray-200 dark:border-transparent flex items-center gap-3"
          >
            <div className="flex-grow">
              <p className="font-semibold text-gray-900 dark:text-client-light">{food.name}</p>
              <p className="text-xs text-gray-500 dark:text-client-subtle">
                {food.calories} kcal | P:{food.protein}g | G:{food.carbs}g | L:{food.fat}g (pour 100g)
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => handleToggleFavorite(e, food.id)}
              className="p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors flex-shrink-0"
              aria-label={isFavorite(food.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              disabled={favoritesLoading}
            >
              {isFavorite(food.id) ? (
                <StarIconSolid className="w-5 h-5 text-yellow-500" />
              ) : (
                <StarIcon className="w-5 h-5 text-gray-400 hover:text-yellow-500" />
              )}
            </button>
          </div>
        ))}
        {filteredFood.length === 0 && (
          <p className="text-center text-gray-500 dark:text-client-subtle py-8">
            Aucun aliment ne correspond à votre recherche.
          </p>
        )}
      </div>
    </div>
  );
};

export default Ciqual;
