import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Input from '../../../components/Input';
import ClientAccordion from '../../../components/client/ClientAccordion';
import Button from '../../../components/Button';
import { ArrowLeftIcon } from '../../../constants/icons';
import FilterChip from '../../../components/FilterChip';

const Ciqual: React.FC = () => {
  const { foodItems } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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

  const filteredFood = useMemo(() => {
    return foodItems.filter((f) => {
      if (f.category === 'Groupe alimentaire') return false;

      const matchesSearch = !searchTerm || f.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(f.category);

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, foodItems, selectedCategories]);

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
            key={food.name}
            className="p-3 bg-white dark:bg-client-card rounded-lg border border-gray-200 dark:border-transparent"
          >
            <p className="font-semibold text-gray-900 dark:text-client-light">{food.name}</p>
            <p className="text-xs text-gray-500 dark:text-client-subtle">
              {food.calories} kcal | P:{food.protein}g | G:{food.carbs}g | L:{food.fat}g (pour 100g)
            </p>
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
