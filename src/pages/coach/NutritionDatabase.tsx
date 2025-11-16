import React, { useState, useMemo } from 'react';
import Card from '../../components/Card.tsx';
import Input from '../../components/Input.tsx';
import { FoodItem } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useSortableData } from '../../hooks/useSortableData.ts';

const SortIcon = ({ direction }: { direction: 'ascending' | 'descending' | null }) => {
  return (
    <span className="inline-block w-4 h-4 ml-1">
      {direction === 'ascending' && '▲'}
      {direction === 'descending' && '▼'}
    </span>
  );
};

const NutritionDatabase: React.FC = () => {
  const { foodItems } = useAuth();
  const [filter, setFilter] = useState('');

  const {
    items: sortedFoodItems,
    requestSort,
    getSortDirection,
  } = useSortableData(foodItems, { key: 'name', direction: 'ascending' });

  const filteredData = useMemo(() => {
    if (!filter) return sortedFoodItems;
    const lowercasedFilter = filter.toLowerCase();
    return sortedFoodItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lowercasedFilter) ||
        item.category.toLowerCase().includes(lowercasedFilter)
    );
  }, [sortedFoodItems, filter]);

  const renderHeader = (label: string, key: keyof FoodItem) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <button onClick={() => requestSort(key)} className="flex items-center hover:text-gray-700">
        {label}
        <SortIcon direction={getSortDirection(key)} />
      </button>
    </th>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Base de Données Alimentaire (Ciqual)
      </h1>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Filtrer par nom ou catégorie..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-250px)]">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-400 sticky top-0">
              <tr>
                {renderHeader('Aliment', 'name')}
                {renderHeader('Catégorie', 'category')}
                {renderHeader('Calories (kcal)', 'calories')}
                {renderHeader('Protéines (g)', 'protein')}
                {renderHeader('Glucides (g)', 'carbs')}
                {renderHeader('Lipides (g)', 'fat')}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.calories}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.protein}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.carbs}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default NutritionDatabase;
