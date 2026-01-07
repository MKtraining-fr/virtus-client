import React, { useState, useEffect } from 'react';
import { X, Save, Utensils } from 'lucide-react';
import { NutritionHabits, updateClientNutritionHabits } from '../../services/nutritionHabitsService';

interface EditNutritionHabitsModalProps {
  clientId: string;
  habits: NutritionHabits | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (habits: NutritionHabits) => void;
}

export const EditNutritionHabitsModal: React.FC<EditNutritionHabitsModalProps> = ({
  clientId,
  habits,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<NutritionHabits>({
    dietType: '',
    mealsPerDay: '',
    hydration: undefined,
    juiceSoda: undefined,
    teaCoffee: undefined,
    alcohol: undefined,
    digestiveIssues: '',
    generalHabits: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (habits) {
      setFormData({
        dietType: habits.dietType || '',
        mealsPerDay: habits.mealsPerDay || '',
        hydration: habits.hydration || undefined,
        juiceSoda: habits.juiceSoda || undefined,
        teaCoffee: habits.teaCoffee || undefined,
        alcohol: habits.alcohol || undefined,
        digestiveIssues: habits.digestiveIssues || '',
        generalHabits: habits.generalHabits || '',
      });
    }
  }, [habits]);

  const handleChange = (field: keyof NutritionHabits, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await updateClientNutritionHabits(clientId, formData);
      onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving nutrition habits:', err);
      setError('Erreur lors de la sauvegarde des habitudes alimentaires');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Utensils className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Habitudes Alimentaires
              </h3>
              <p className="text-sm text-gray-500">Modifier les informations nutritionnelles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Régime alimentaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Régime alimentaire
            </label>
            <textarea
              value={formData.dietType || ''}
              onChange={(e) => handleChange('dietType', e.target.value)}
              placeholder="Ex: Végétarien, sans gluten, etc."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>

          {/* Nombre de repas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de repas dans la journée
            </label>
            <input
              type="text"
              value={formData.mealsPerDay || ''}
              onChange={(e) => handleChange('mealsPerDay', e.target.value)}
              placeholder="Ex: 3 repas + 2 collations"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Volumes en litres */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hydratation (litres/jour)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.hydration || ''}
                onChange={(e) => handleChange('hydration', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 2"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jus de fruit/sirop/soda (litres/jour)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.juiceSoda || ''}
                onChange={(e) => handleChange('juiceSoda', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 0.5"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thé/café (litres/jour)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.teaCoffee || ''}
                onChange={(e) => handleChange('teaCoffee', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 0.3"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alcool (litres/semaine)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={formData.alcohol || ''}
                onChange={(e) => handleChange('alcohol', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 1"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Troubles digestifs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Troubles digestifs
            </label>
            <textarea
              value={formData.digestiveIssues || ''}
              onChange={(e) => handleChange('digestiveIssues', e.target.value)}
              placeholder="Décrivez les éventuels troubles digestifs..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Autres habitudes alimentaires */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Autres habitudes alimentaires
            </label>
            <textarea
              value={formData.generalHabits || ''}
              onChange={(e) => handleChange('generalHabits', e.target.value)}
              placeholder="Ex: Grignotage occasionnel, repas tardifs, etc."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNutritionHabitsModal;
