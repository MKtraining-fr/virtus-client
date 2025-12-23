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
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('');

  const {
    items: sortedFoodItems,
    requestSort,
    getSortDirection,
  } = useSortableData(foodItems, { key: 'name', direction: 'ascending' });

  // Extraire les catégories uniques
  const categories = useMemo(() => {
    const cats = new Set<string>();
    foodItems.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [foodItems]);

  // Extraire les sous-catégories uniques (filtrées par catégorie sélectionnée)
  const subcategories = useMemo(() => {
    const subcats = new Set<string>();
    foodItems.forEach((item) => {
      if (item.subcategory && (!categoryFilter || item.category === categoryFilter)) {
        subcats.add(item.subcategory);
      }
    });
    return Array.from(subcats).sort();
  }, [foodItems, categoryFilter]);

  // Réinitialiser la sous-catégorie quand la catégorie change
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setSubcategoryFilter('');
  };

  const filteredData = useMemo(() => {
    let results = sortedFoodItems;

    // Filtre par catégorie
    if (categoryFilter) {
      results = results.filter((item) => item.category === categoryFilter);
    }

    // Filtre par sous-catégorie (famille)
    if (subcategoryFilter) {
      results = results.filter((item) => item.subcategory === subcategoryFilter);
    }

    // Filtre par recherche textuelle
    if (searchFilter) {
      const lowercasedFilter = searchFilter.toLowerCase();
      results = results.filter(
        (item) =>
          item.name.toLowerCase().includes(lowercasedFilter) ||
          (item.category && item.category.toLowerCase().includes(lowercasedFilter)) ||
          (item.subcategory && item.subcategory.toLowerCase().includes(lowercasedFilter))
      );
    }

    return results;
  }, [sortedFoodItems, searchFilter, categoryFilter, subcategoryFilter]);

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

      {/* Filtres */}
      <div className="mb-4 space-y-3">
        {/* Recherche textuelle */}
        <Input
          type="text"
          placeholder="Rechercher par nom..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />

        {/* Filtres par catégorie et sous-catégorie */}
        <div className="flex flex-wrap gap-3">
          {/* Filtre par catégorie */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par sous-catégorie (famille) */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Famille d'aliments
            </label>
            <select
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
              disabled={subcategories.length === 0}
            >
              <option value="">Toutes les familles</option>
              {subcategories.map((subcat) => (
                <option key={subcat} value={subcat}>
                  {subcat.charAt(0).toUpperCase() + subcat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton de réinitialisation */}
          {(categoryFilter || subcategoryFilter || searchFilter) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setCategoryFilter('');
                  setSubcategoryFilter('');
                  setSearchFilter('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          )}
        </div>

        {/* Compteur de résultats */}
        <p className="text-sm text-gray-500">
          {filteredData.length} aliment{filteredData.length > 1 ? 's' : ''} trouvé{filteredData.length > 1 ? 's' : ''}
          {categoryFilter && ` dans "${categoryFilter}"`}
          {subcategoryFilter && ` → "${subcategoryFilter}"`}
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-350px)]">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                {renderHeader('Aliment', 'name')}
                {renderHeader('Catégorie', 'category')}
                {renderHeader('Famille', 'subcategory')}
                {renderHeader('Calories (kcal)', 'calories')}
                {renderHeader('Protéines (g)', 'protein')}
                {renderHeader('Glucides (g)', 'carbs')}
                {renderHeader('Lipides (g)', 'fat')}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id || item.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.subcategory || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.calories ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.protein ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.carbs ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.fat ?? '-'}
                  </td>
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
