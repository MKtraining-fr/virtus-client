import React, { useState, useEffect } from 'react';
import { Utensils, Edit2, Droplet, Coffee, Wine, AlertCircle } from 'lucide-react';
import { NutritionHabits, getClientNutritionHabits } from '../../services/nutritionHabitsService';
import { EditNutritionHabitsModal } from './EditNutritionHabitsModal';

interface NutritionHabitsDisplayProps {
  clientId: string;
}

export const NutritionHabitsDisplay: React.FC<NutritionHabitsDisplayProps> = ({ clientId }) => {
  const [habits, setHabits] = useState<NutritionHabits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, [clientId]);

  const fetchHabits = async () => {
    setIsLoading(true);
    try {
      const data = await getClientNutritionHabits(clientId);
      setHabits(data);
    } catch (error) {
      console.error('Error fetching nutrition habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (updatedHabits: NutritionHabits) => {
    setHabits(updatedHabits);
  };

  const formatValue = (value: string | number | undefined, unit?: string): string => {
    if (value === undefined || value === null || value === '') {
      return 'Non renseigné';
    }
    return unit ? `${value} ${unit}` : String(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* En-tête avec bouton Modifier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Utensils className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Habitudes Alimentaires</h4>
              <p className="text-xs text-gray-500">
                Informations sur les habitudes et préférences nutritionnelles
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            <Edit2 className="h-4 w-4" />
            Modifier
          </button>
        </div>

        {/* Grille des informations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Régime alimentaire */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Régime alimentaire
              </span>
            </div>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {formatValue(habits?.dietType)}
            </p>
          </div>

          {/* Nombre de repas */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre de repas/jour
              </span>
            </div>
            <p className="text-sm text-gray-900">
              {formatValue(habits?.mealsPerDay)}
            </p>
          </div>

          {/* Hydratation */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hydratation
              </span>
            </div>
            <p className="text-sm text-gray-900">
              {formatValue(habits?.hydration, 'L/jour')}
            </p>
          </div>

          {/* Jus/Soda */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jus/Sirop/Soda
              </span>
            </div>
            <p className="text-sm text-gray-900">
              {formatValue(habits?.juiceSoda, 'L/jour')}
            </p>
          </div>

          {/* Thé/Café */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coffee className="h-4 w-4 text-brown-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thé/Café
              </span>
            </div>
            <p className="text-sm text-gray-900">
              {formatValue(habits?.teaCoffee, 'L/jour')}
            </p>
          </div>

          {/* Alcool */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wine className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alcool
              </span>
            </div>
            <p className="text-sm text-gray-900">
              {formatValue(habits?.alcohol, 'L/semaine')}
            </p>
          </div>

          {/* Troubles digestifs - Prend toute la largeur */}
          <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Troubles digestifs
              </span>
            </div>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {formatValue(habits?.digestiveIssues)}
            </p>
          </div>

          {/* Autres habitudes alimentaires - Prend toute la largeur */}
          <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Autres habitudes alimentaires
              </span>
            </div>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {formatValue(habits?.generalHabits)}
            </p>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      <EditNutritionHabitsModal
        clientId={clientId}
        habits={habits}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
};

export default NutritionHabitsDisplay;
