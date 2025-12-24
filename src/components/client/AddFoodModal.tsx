import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../Modal';
import BarcodeScanner from './BarcodeScanner';
import Input from '../Input';
import { FoodItem, Meal, MealItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  searchAndConvertProduct,
  getContributeUrl,
} from '../../services/openFoodFactsService';

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

const BarcodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"
    />
  </svg>
);

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
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

// Composant pour afficher les badges Nutri-Score, Eco-Score, NOVA
const ScoreBadge: React.FC<{ type: 'nutri' | 'eco' | 'nova'; value: string | number }> = ({
  type,
  value,
}) => {
  const getColor = () => {
    const strValue = String(value).toUpperCase();
    if (type === 'nova') {
      const novaColors: { [key: string]: string } = {
        '1': 'bg-green-500',
        '2': 'bg-yellow-500',
        '3': 'bg-orange-500',
        '4': 'bg-red-500',
      };
      return novaColors[strValue] || 'bg-gray-400';
    }
    const scoreColors: { [key: string]: string } = {
      A: 'bg-green-500',
      B: 'bg-lime-500',
      C: 'bg-yellow-500',
      D: 'bg-orange-500',
      E: 'bg-red-500',
    };
    return scoreColors[strValue] || 'bg-gray-400';
  };

  const getLabel = () => {
    if (type === 'nutri') return 'Nutri';
    if (type === 'eco') return 'Eco';
    return 'NOVA';
  };

  return (
    <span className={`${getColor()} text-white text-xs px-1.5 py-0.5 rounded font-semibold`}>
      {getLabel()}: {String(value).toUpperCase()}
    </span>
  );
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
  // Type d'aliment : Tout, Recettes, Repas, Brut, Autre
  const [foodTypeFilter, setFoodTypeFilter] = useState('');
  // Catégorie (category) - les catégories Ciqual existantes
  const [categoryFilter, setCategoryFilter] = useState('');
  // Famille d'aliments (subcategory) - dynamique selon le type et la catégorie
  const [familyFilter, setFamilyFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // États pour le scanner de code-barres
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<FoodItem | null>(null);
  const [isIncompleteData, setIsIncompleteData] = useState(false);

  // Reset state when modal is closed to avoid stale data on reopen
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSearchTerm('');
        setSelectedFood(null);
        setQuantity('100');
        setUnit('g');
        setFoodTypeFilter('');
        setCategoryFilter('');
        setFamilyFilter('');
        setShowFilters(false);
        setShowBarcodeInput(false);
        setIsScannerOpen(false);
        setBarcode('');
        setBarcodeError(null);
        setScannedProduct(null);
        setIsIncompleteData(false);
      }, 200); // Delay to allow for animations
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fonction appelée quand un code-barres est scanné par la caméra
  const handleBarcodeScan = async (scannedBarcode: string) => {
    setBarcode(scannedBarcode);
    setShowBarcodeInput(true);
    setIsScannerOpen(false);
    
    // Lancer automatiquement la recherche
    setIsSearchingBarcode(true);
    setBarcodeError(null);
    setScannedProduct(null);

    try {
      const result = await searchAndConvertProduct(scannedBarcode);

      if (result.foodItem) {
        setScannedProduct(result.foodItem);
        setIsIncompleteData(result.isIncomplete || false);
      } else {
        setBarcodeError(result.error || 'Produit non trouvé');
      }
    } catch (error) {
      setBarcodeError('Erreur lors de la recherche. Vérifiez votre connexion.');
    } finally {
      setIsSearchingBarcode(false);
    }
  };

  // Fonction de recherche par code-barres (saisie manuelle)
  const handleBarcodeSearch = async () => {
    if (!barcode.trim()) {
      setBarcodeError('Veuillez entrer un code-barres');
      return;
    }

    setIsSearchingBarcode(true);
    setBarcodeError(null);
    setScannedProduct(null);

    try {
      const result = await searchAndConvertProduct(barcode);

      if (result.foodItem) {
        setScannedProduct(result.foodItem);
        setIsIncompleteData(result.isIncomplete || false);
      } else {
        setBarcodeError(result.error || 'Produit non trouvé');
      }
    } catch (error) {
      setBarcodeError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setIsSearchingBarcode(false);
    }
  };

  // Sélectionner le produit scanné
  const handleSelectScannedProduct = () => {
    if (scannedProduct) {
      setSelectedFood(scannedProduct);
      setShowBarcodeInput(false);
      setScannedProduct(null);
      setBarcode('');
    }
  };

  // Types d'aliments disponibles
  const foodTypes = useMemo(() => {
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
      { value: '', label: 'Tous les types' },
      ...(hasRecipes ? [{ value: 'recette', label: 'Recettes' }] : []),
      ...(hasMeals ? [{ value: 'repas', label: 'Repas' }] : []),
      ...(hasBrut ? [{ value: 'brut', label: '🥬 Aliments bruts' }] : []),
      ...(hasAutre ? [{ value: 'autre', label: '🍰 Autres aliments' }] : []),
    ];
  }, [db]);

  // Extraire les catégories uniques (filtrées par type d'aliment)
  const categories = useMemo(() => {
    const cats = new Set<string>();
    db.forEach((item) => {
      if ('category' in item && item.category) {
        const foodItem = item as FoodItem;
        // Filtrer selon le type sélectionné
        if (!foodTypeFilter || foodTypeFilter === 'recette' || foodTypeFilter === 'repas') {
          cats.add(foodItem.category);
        } else if (foodTypeFilter === 'brut' && foodItem.foodType === 'brut') {
          cats.add(foodItem.category);
        } else if (foodTypeFilter === 'autre' && foodItem.foodType === 'autre') {
          cats.add(foodItem.category);
        }
      }
    });
    return Array.from(cats).sort();
  }, [db, foodTypeFilter]);

  // Extraire les familles d'aliments uniques (filtrées par type et catégorie)
  const families = useMemo(() => {
    const fams = new Set<string>();
    db.forEach((item) => {
      if ('subcategory' in item && item.subcategory) {
        const foodItem = item as FoodItem;
        const matchesType =
          !foodTypeFilter ||
          foodTypeFilter === 'recette' ||
          foodTypeFilter === 'repas' ||
          foodItem.foodType === foodTypeFilter;
        const matchesCategory = !categoryFilter || foodItem.category === categoryFilter;
        if (matchesType && matchesCategory) {
          fams.add(foodItem.subcategory as string);
        }
      }
    });
    return Array.from(fams).sort();
  }, [db, foodTypeFilter, categoryFilter]);

  // Réinitialiser les filtres en cascade quand le type change
  const handleFoodTypeChange = (value: string) => {
    setFoodTypeFilter(value);
    setCategoryFilter('');
    setFamilyFilter('');
  };

  // Réinitialiser la famille quand la catégorie change
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
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
    if (!searchTerm && !foodTypeFilter && !categoryFilter && !familyFilter) return [];

    let results: SearchableItem[] = db;

    // Filtre par type d'aliment
    if (foodTypeFilter) {
      if (foodTypeFilter === 'recette') {
        results = results.filter((item) => 'type' in item && item.type === 'Recette');
      } else if (foodTypeFilter === 'repas') {
        results = results.filter((item) => 'type' in item && item.type === 'Repas');
      } else if (foodTypeFilter === 'brut') {
        results = results.filter(
          (item) => 'foodType' in item && (item as FoodItem).foodType === 'brut'
        );
      } else if (foodTypeFilter === 'autre') {
        results = results.filter(
          (item) => 'foodType' in item && (item as FoodItem).foodType === 'autre'
        );
      }
    }

    // Filtre par catégorie
    if (categoryFilter) {
      results = results.filter(
        (item) => 'category' in item && item.category === categoryFilter
      );
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
  }, [searchTerm, db, foodTypeFilter, categoryFilter, familyFilter]);

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

  const hasActiveFilters = foodTypeFilter || categoryFilter || familyFilter;
  const activeFiltersCount = [foodTypeFilter, categoryFilter, familyFilter].filter(Boolean).length;

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={`Ajouter à ${mealName}`} theme={theme}>
      {!selectedFood ? (
        <div className="space-y-3">
          {/* Boutons Scanner de code-barres */}
          <div className="flex gap-2">
            {/* Bouton pour ouvrir la caméra */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-client-subtle hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              <BarcodeIcon className="w-5 h-5" />
              <span className="font-medium">Scanner</span>
            </button>
            
            {/* Bouton pour saisie manuelle */}
            <button
              onClick={() => {
                setShowBarcodeInput(!showBarcodeInput);
                setBarcodeError(null);
                setScannedProduct(null);
              }}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                showBarcodeInput
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-client-subtle hover:border-primary hover:text-primary'
              }`}
            >
              <ClipboardIcon className="w-5 h-5" />
              <span className="font-medium">Saisir code</span>
            </button>
          </div>

          {/* Zone de saisie du code-barres */}
          {showBarcodeInput && (
            <div className="p-4 bg-gray-50 dark:bg-client-dark rounded-lg space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Entrez le code-barres (ex: 3017624010701)"
                  value={barcode}
                  onChange={(e) => {
                    setBarcode(e.target.value);
                    setBarcodeError(null);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                  className="flex-1"
                />
                <button
                  onClick={handleBarcodeSearch}
                  disabled={isSearchingBarcode}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSearchingBarcode ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Recherche...</span>
                    </>
                  ) : (
                    <>
                      <SearchIcon className="w-4 h-4" />
                      <span>Rechercher</span>
                    </>
                  )}
                </button>
              </div>

              {/* Message d'erreur */}
              {barcodeError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{barcodeError}</p>
                  {barcodeError.includes('non trouvé') && (
                    <a
                      href={getContributeUrl(barcode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      Ajouter ce produit sur Open Food Facts →
                    </a>
                  )}
                </div>
              )}

              {/* Résultat du scan */}
              {scannedProduct && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
                  {isIncompleteData && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                      ⚠️ Données nutritionnelles incomplètes
                    </p>
                  )}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-client-light">
                        {scannedProduct.name}
                      </p>
                      {scannedProduct.brand && (
                        <p className="text-sm text-gray-500 dark:text-client-subtle">
                          {scannedProduct.brand}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleSelectScannedProduct}
                      className="px-3 py-1 bg-primary text-white text-sm rounded-lg font-semibold hover:bg-primary/90"
                    >
                      Sélectionner
                    </button>
                  </div>

                  {/* Macros */}
                  <div className="text-sm text-gray-600 dark:text-client-subtle">
                    <span className="font-medium">{scannedProduct.calories} kcal</span>
                    <span className="mx-2">|</span>
                    <span>P: {scannedProduct.protein}g</span>
                    <span className="mx-1">•</span>
                    <span>G: {scannedProduct.carbs}g</span>
                    <span className="mx-1">•</span>
                    <span>L: {scannedProduct.fat}g</span>
                  </div>

                  {/* Scores */}
                  <div className="flex flex-wrap gap-1">
                    {scannedProduct.nutriScore && (
                      <ScoreBadge type="nutri" value={scannedProduct.nutriScore} />
                    )}
                    {scannedProduct.ecoScore && (
                      <ScoreBadge type="eco" value={scannedProduct.ecoScore} />
                    )}
                    {scannedProduct.novaGroup && (
                      <ScoreBadge type="nova" value={scannedProduct.novaGroup} />
                    )}
                  </div>

                  {/* Allergènes */}
                  {scannedProduct.allergens && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      ⚠️ Allergènes: {scannedProduct.allergens}
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Données fournies par{' '}
                <a
                  href="https://world.openfoodfacts.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Open Food Facts
                </a>
              </p>
            </div>
          )}

          {/* Séparateur */}
          {showBarcodeInput && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 dark:text-gray-500">ou rechercher</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
          )}

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
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Filtres avancés (type + catégorie + famille) */}
          {showFilters && (
            <div className="space-y-2 p-3 bg-gray-50 dark:bg-client-dark rounded-lg">
              {/* Filtre par type d'aliment */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-client-subtle mb-1">
                  Type d'aliment
                </label>
                <select
                  value={foodTypeFilter}
                  onChange={(e) => handleFoodTypeChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-client-dark text-gray-800 dark:text-client-light focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {foodTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par catégorie */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-client-subtle mb-1">
                    Catégorie
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-client-dark text-gray-800 dark:text-client-light focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                    setFoodTypeFilter('');
                    setCategoryFilter('');
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
              {foodTypes.slice(0, 5).map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleFoodTypeChange(type.value)}
                  className={`flex-shrink-0 px-3 py-1 text-sm rounded-full transition-colors ${
                    foodTypeFilter === type.value
                      ? 'bg-primary text-white font-semibold'
                      : 'bg-gray-100 dark:bg-client-dark text-gray-600 dark:text-client-subtle hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
              {foodTypes.length > 5 && (
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex-shrink-0 px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-client-dark text-gray-600 dark:text-client-subtle hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  +{foodTypes.length - 5}
                </button>
              )}
            </div>
          )}

          {/* Indicateur de filtre actif */}
          {hasActiveFilters && (
            <p className="text-xs text-gray-500 dark:text-client-subtle">
              {filteredResults.length} résultat{filteredResults.length > 1 ? 's' : ''}
              {foodTypeFilter &&
                ` (${foodTypes.find((t) => t.value === foodTypeFilter)?.label})`}
              {categoryFilter && ` → "${categoryFilter}"`}
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
                    {isMealOrRecipe && (
                      <ClipboardIcon className="w-4 h-4 text-primary shrink-0" />
                    )}
                    <p className="text-gray-800 dark:text-client-light">{item.name}</p>
                  </div>
                  <div className="pl-6">
                    <p className="text-xs text-gray-500 dark:text-client-subtle">{macroString}</p>
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
          {selectedFood.brand && (
            <p className="text-sm text-gray-500 dark:text-client-subtle -mt-2">
              {selectedFood.brand}
            </p>
          )}
          {selectedFood.subcategory && !selectedFood.brand && (
            <p className="text-sm text-gray-500 dark:text-client-subtle -mt-2">
              {selectedFood.subcategory}
            </p>
          )}

          {/* Scores pour les produits scannés */}
          {(selectedFood.nutriScore || selectedFood.ecoScore || selectedFood.novaGroup) && (
            <div className="flex flex-wrap gap-1">
              {selectedFood.nutriScore && (
                <ScoreBadge type="nutri" value={selectedFood.nutriScore} />
              )}
              {selectedFood.ecoScore && <ScoreBadge type="eco" value={selectedFood.ecoScore} />}
              {selectedFood.novaGroup && (
                <ScoreBadge type="nova" value={selectedFood.novaGroup} />
              )}
            </div>
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

          {/* Allergènes si présents */}
          {selectedFood.allergens && (
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm text-orange-600 dark:text-orange-400">
                ⚠️ Allergènes: {selectedFood.allergens}
              </p>
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

      {/* Composant Scanner de code-barres avec caméra */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
    </>
  );
};

export default AddFoodModal;
