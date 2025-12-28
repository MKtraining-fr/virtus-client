import React, { useState, useMemo } from 'react';
import Card from './Card';
import Input from './Input';
import { FoodItem, Meal, MealItem } from '../types';

type SidebarItem = FoodItem | (Meal & { type: 'Repas' | 'Recette' });

interface FoodFilterSidebarProps {
  db: SidebarItem[];
}

const FilterChip = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-sm rounded-full border transition-all ${selected ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'}`}
  >
    {label}
  </button>
);

const FoodFilterSidebar: React.FC<FoodFilterSidebarProps> = ({ db }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
  };

  const filteredResults = useMemo(() => {
    return db.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());

      let itemCategory: string;
      if ('items' in item) {
        itemCategory = item.type;
      } else {
        itemCategory = item.category;
      }

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(itemCategory);
      return matchesSearch && matchesCategory;
    });
  }, [db, searchTerm, selectedCategories]);

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

  return (
    <Card className="p-4 h-full flex flex-col overflow-hidden">
      <h2 className="text-xl font-bold mb-4">Aliments</h2>
      <Input
        placeholder="Rechercher..."
        className="mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="mb-4">
        <h3 className="font-semibold mb-2 text-gray-700">Catégories :</h3>
        <div className="flex flex-wrap gap-2">
          {foodCategories.map((category) => (
            <FilterChip
              key={category}
              label={category}
              selected={selectedCategories.includes(category)}
              onClick={() => toggleSelection(category)}
            />
          ))}
        </div>
      </div>

      <hr className="my-4" />

      <h3 className="font-semibold mb-2 text-gray-700 flex-shrink-0">Résultats ({filteredResults.length})</h3>
      <div 
        className="space-y-3 overflow-y-auto min-h-0 flex-1" 
        style={{ 
          scrollbarWidth: 'thin', 
          scrollbarColor: '#9ca3af #f3f4f6',
          paddingRight: '8px'
        }}
      >
        {filteredResults.map((item, index) => {
          const isMealOrRecipe = 'items' in item;
          return (
            <div
              key={`${item.name}-${index}`}
              className="cursor-grab group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
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
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default FoodFilterSidebar;
