// src/services/openFoodFactsService.ts
// Service pour interagir avec l'API Open Food Facts

import type { FoodItem } from '../types';

const API_BASE_URL = 'https://world.openfoodfacts.org/api/v2';
const USER_AGENT = 'Virtus/1.0 (contact@virtus.fr)';

// Cache pour éviter les requêtes répétées
const productCache = new Map<string, OpenFoodFactsProduct>();

export interface OpenFoodFactsNutriments {
  'energy-kcal_100g'?: number;
  'energy_100g'?: number;
  'proteins_100g'?: number;
  'carbohydrates_100g'?: number;
  'sugars_100g'?: number;
  'fat_100g'?: number;
  'saturated-fat_100g'?: number;
  'fiber_100g'?: number;
  'salt_100g'?: number;
  'sodium_100g'?: number;
}

export interface OpenFoodFactsProduct {
  code: string;
  product: {
    product_name?: string;
    product_name_fr?: string;
    brands?: string;
    quantity?: string;
    nutrition_grades?: string;
    nova_group?: number;
    ecoscore_grade?: string;
    nutriments?: OpenFoodFactsNutriments;
    categories?: string;
    categories_tags?: string[];
    ingredients_text?: string;
    ingredients_text_fr?: string;
    allergens?: string;
    allergens_tags?: string[];
    image_url?: string;
    image_front_url?: string;
  };
  status: number;
  status_verbose: string;
}

export interface BarcodeSearchResult {
  success: boolean;
  product: OpenFoodFactsProduct | null;
  error?: string;
}

/**
 * Recherche un produit par son code-barres dans Open Food Facts
 * @param barcode Le code-barres EAN-13 ou UPC du produit
 * @returns Le produit trouvé ou null si non trouvé
 */
export const searchProductByBarcode = async (
  barcode: string
): Promise<BarcodeSearchResult> => {
  // Nettoyer le code-barres (supprimer espaces et caractères non numériques)
  const cleanBarcode = barcode.replace(/\D/g, '');
  
  if (!cleanBarcode || cleanBarcode.length < 8) {
    return {
      success: false,
      product: null,
      error: 'Code-barres invalide. Veuillez entrer un code EAN-13 ou UPC valide.',
    };
  }

  // Vérifier le cache d'abord
  if (productCache.has(cleanBarcode)) {
    return {
      success: true,
      product: productCache.get(cleanBarcode)!,
    };
  }

  try {
    const fields = [
      'product_name',
      'product_name_fr',
      'brands',
      'quantity',
      'nutrition_grades',
      'nutriments',
      'categories',
      'categories_tags',
      'ingredients_text',
      'ingredients_text_fr',
      'allergens',
      'allergens_tags',
      'nova_group',
      'ecoscore_grade',
      'image_url',
      'image_front_url',
    ].join(',');

    const response = await fetch(
      `${API_BASE_URL}/product/${cleanBarcode}?fields=${fields}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data: OpenFoodFactsProduct = await response.json();

    if (data.status === 0) {
      return {
        success: false,
        product: null,
        error: 'Produit non trouvé dans la base de données Open Food Facts.',
      };
    }

    // Mettre en cache le résultat
    productCache.set(cleanBarcode, data);

    return {
      success: true,
      product: data,
    };
  } catch (error) {
    console.error('Erreur lors de la recherche du produit:', error);
    return {
      success: false,
      product: null,
      error: 'Erreur de connexion. Veuillez vérifier votre connexion internet.',
    };
  }
};

/**
 * Valide que le produit a les données nutritionnelles essentielles
 * @param product Le produit Open Food Facts
 * @returns true si les données essentielles sont présentes
 */
export const validateProductData = (product: OpenFoodFactsProduct): boolean => {
  const nutriments = product.product.nutriments;
  
  if (!nutriments) return false;
  
  // Vérifier que les macros essentielles sont présentes
  const hasCalories = 
    nutriments['energy-kcal_100g'] !== undefined || 
    nutriments['energy_100g'] !== undefined;
  
  const hasProtein = nutriments['proteins_100g'] !== undefined;
  const hasCarbs = nutriments['carbohydrates_100g'] !== undefined;
  const hasFat = nutriments['fat_100g'] !== undefined;
  
  return hasCalories && hasProtein && hasCarbs && hasFat;
};

/**
 * Détermine la catégorie d'un produit Open Food Facts
 * @param product Le produit Open Food Facts
 * @returns La catégorie mappée pour Virtus
 */
const mapCategory = (product: OpenFoodFactsProduct): string => {
  const categories = product.product.categories_tags || [];
  
  // Mapping des catégories Open Food Facts vers les catégories Virtus
  const categoryMappings: { [key: string]: string } = {
    'en:beverages': 'eaux et autres boissons',
    'en:dairy': 'produits laitiers et assimilés',
    'en:meats': 'viandes, oeufs, poissons et assimilés',
    'en:fish': 'viandes, oeufs, poissons et assimilés',
    'en:eggs': 'viandes, oeufs, poissons et assimilés',
    'en:fruits': 'fruits, légumes, légumineuses et oléagineux',
    'en:vegetables': 'fruits, légumes, légumineuses et oléagineux',
    'en:cereals': 'produits céréaliers',
    'en:breads': 'produits céréaliers',
    'en:snacks': 'produits sucrés',
    'en:chocolates': 'produits sucrés',
    'en:desserts': 'produits sucrés',
    'en:fats': 'matières grasses',
    'en:oils': 'matières grasses',
  };
  
  for (const cat of categories) {
    for (const [key, value] of Object.entries(categoryMappings)) {
      if (cat.includes(key)) {
        return value;
      }
    }
  }
  
  return 'autres produits';
};

/**
 * Convertit un produit Open Food Facts en FoodItem Virtus
 * @param offProduct Le produit Open Food Facts
 * @returns Un FoodItem compatible avec Virtus
 */
export const convertToFoodItem = (offProduct: OpenFoodFactsProduct): FoodItem => {
  const { product, code } = offProduct;
  const nutriments = product.nutriments || {};

  // Utiliser le nom français si disponible, sinon le nom générique
  const name = product.product_name_fr || product.product_name || 'Produit inconnu';
  
  // Calculer les calories (priorité à kcal, sinon convertir depuis kJ)
  let calories = nutriments['energy-kcal_100g'];
  if (calories === undefined && nutriments['energy_100g']) {
    // Convertir kJ en kcal (1 kcal = 4.184 kJ)
    calories = Math.round(nutriments['energy_100g'] / 4.184);
  }

  // Utiliser les ingrédients français si disponibles
  const ingredients = product.ingredients_text_fr || product.ingredients_text;
  
  // Formater les allergènes
  const allergens = product.allergens_tags
    ? product.allergens_tags.map(a => a.replace('en:', '')).join(', ')
    : product.allergens;

  return {
    id: `off-${code}`,
    name: name,
    category: mapCategory(offProduct),
    calories: calories || 0,
    protein: nutriments['proteins_100g'] || 0,
    carbs: nutriments['carbohydrates_100g'] || 0,
    fat: nutriments['fat_100g'] || 0,
    sugar: nutriments['sugars_100g'],
    fiber: nutriments['fiber_100g'],
    salt: nutriments['salt_100g'],
    // Données supplémentaires Open Food Facts
    barcode: code,
    brand: product.brands,
    quantity: product.quantity,
    nutriScore: product.nutrition_grades?.toUpperCase(),
    novaGroup: product.nova_group,
    ecoScore: product.ecoscore_grade?.toUpperCase(),
    allergens: allergens,
    ingredients: ingredients,
    source: 'openfoodfacts',
    foodType: 'autre', // Les produits scannés sont généralement des produits transformés
  };
};

/**
 * Recherche un produit et le convertit directement en FoodItem
 * @param barcode Le code-barres du produit
 * @returns Le FoodItem ou null avec un message d'erreur
 */
export const searchAndConvertProduct = async (
  barcode: string
): Promise<{ foodItem: FoodItem | null; error?: string; isIncomplete?: boolean }> => {
  const result = await searchProductByBarcode(barcode);
  
  if (!result.success || !result.product) {
    return { foodItem: null, error: result.error };
  }
  
  const isComplete = validateProductData(result.product);
  const foodItem = convertToFoodItem(result.product);
  
  return {
    foodItem,
    isIncomplete: !isComplete,
  };
};

/**
 * Vide le cache des produits
 */
export const clearProductCache = (): void => {
  productCache.clear();
};

/**
 * Génère l'URL pour contribuer à Open Food Facts
 * @param barcode Le code-barres du produit
 * @returns L'URL pour ajouter le produit sur Open Food Facts
 */
export const getContributeUrl = (barcode: string): string => {
  return `https://world.openfoodfacts.org/cgi/product.pl?type=add&code=${barcode}`;
};
