import { Meal } from '../types.ts';
import { CIQUAL_DATA } from './ciqualData.ts';

// Helper to find food items easily and handle potential missing items gracefully.
const findFood = (name: string) => {
    const food = CIQUAL_DATA.find(f => f.name.toLowerCase() === name.toLowerCase());
    if (!food) {
        console.warn(`Food item "${name}" not found in CIQUAL_DATA. Using default values.`);
        return { name: name, category: 'Inconnu', calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    return food;
};

export const INITIAL_RECIPES: (Meal & { type: 'Recette' })[] = [
    {
        id: 'recipe-pancakes',
        name: 'Pancakes Protéinés',
        type: 'Recette',
        items: [
            { id: 'p1', food: findFood("Flocons d'avoine"), quantity: 50, unit: 'g' },
            { id: 'p2', food: findFood("Oeuf, entier, cuit dur"), quantity: 100, unit: 'g' }, // Assuming 2 eggs
            { id: 'p3', food: findFood("Fromage blanc 0% MG"), quantity: 100, unit: 'g' },
            { id: 'p4', food: findFood("Banane"), quantity: 50, unit: 'g' }, // Half a banana
        ]
    },
    {
        id: 'recipe-salade-poulet',
        name: 'Salade César Poulet',
        type: 'Recette',
        items: [
            { id: 's1', food: findFood("Poulet, blanc, sans peau"), quantity: 150, unit: 'g' },
            { id: 's2', food: findFood("Salade verte"), quantity: 100, unit: 'g' },
            { id: 's3', food: findFood("Pain complet"), quantity: 30, unit: 'g' },
            { id: 's4', food: findFood("Huile d'olive"), quantity: 10, unit: 'ml' },
        ]
    }
];

export const INITIAL_MEALS: (Meal & { type: 'Repas' })[] = [
    {
        id: 'meal-breakfast-1',
        name: 'Petit-déjeuner Équilibré',
        type: 'Repas',
        items: [
            { id: 'm1i1', food: findFood("Pain complet"), quantity: 80, unit: 'g' },
            { id: 'm1i2', food: findFood("Jambon blanc, cuit"), quantity: 50, unit: 'g' },
            { id: 'm1i3', food: findFood("Oeuf, entier, cuit dur"), quantity: 50, unit: 'g' },
            { id: 'm1i4', food: findFood("Kiwi"), quantity: 100, unit: 'g' },
        ]
    },
    {
        id: 'meal-lunch-1',
        name: 'Déjeuner Prise de Masse',
        type: 'Repas',
        items: [
            { id: 'm2i1', food: findFood("Boeuf, steak haché 5% MG"), quantity: 150, unit: 'g' },
            { id: 'm2i2', food: findFood("Riz blanc, cuit"), quantity: 250, unit: 'g' },
            { id: 'm2i3', food: findFood("Haricots verts, cuits"), quantity: 200, unit: 'g' },
            { id: 'm2i4', food: findFood("Huile d'olive"), quantity: 15, unit: 'ml' },
        ]
    }
];