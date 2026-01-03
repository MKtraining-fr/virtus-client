import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ExerciseList } from './ExerciseList';
import { ExerciseDetail } from './ExerciseDetail';
import { PerformanceEntry } from './PerformanceEntry';

interface PerformanceSectionProps {
  clientId: string;
  isCoach?: boolean;
}

export const PerformanceSection: React.FC<PerformanceSectionProps> = ({
  clientId,
  isCoach = false
}) => {
  const [view, setView] = useState<'list' | 'detail' | 'entry'>('list');
  const [selectedExercise, setSelectedExercise] = useState<{ id: string; name: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectExercise = (exerciseId: string, exerciseName: string) => {
    setSelectedExercise({ id: exerciseId, name: exerciseName });
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedExercise(null);
    setRefreshKey(prev => prev + 1); // Rafraîchir la liste
  };

  const handlePerformanceAdded = () => {
    setRefreshKey(prev => prev + 1);
    setView('list');
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'ajout */}
      {view === 'list' && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Performances & Évolution</h3>
            <p className="text-sm text-gray-500 mt-1">
              Suivez vos records et visualisez votre progression
            </p>
          </div>
          <button
            onClick={() => setView('entry')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            Ajouter une perf
          </button>
        </div>
      )}

      {/* Contenu principal */}
      <div className="bg-white p-6 rounded-xl border border-gray-100">
        {view === 'list' && (
          <ExerciseList
            key={refreshKey}
            clientId={clientId}
            onSelectExercise={handleSelectExercise}
          />
        )}

        {view === 'detail' && selectedExercise && (
          <ExerciseDetail
            clientId={clientId}
            exerciseId={selectedExercise.id}
            exerciseName={selectedExercise.name}
            onBack={handleBackToList}
          />
        )}

        {view === 'entry' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Saisir une nouvelle performance</h4>
              <button
                onClick={handleBackToList}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
            </div>
            <PerformanceEntry
              clientId={clientId}
              onPerformanceAdded={handlePerformanceAdded}
            />
          </div>
        )}
      </div>

      {/* Info box */}
      {view === 'list' && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-lg">💡</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">Comment ça marche ?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Cliquez sur un exercice pour voir son évolution et ses projections</li>
                <li>• Le 1RM est calculé automatiquement selon la formule de Brzycki</li>
                <li>• Le profil nerveux compare vos performances réelles aux projections</li>
                <li>• Ajoutez régulièrement vos performances pour suivre votre progression</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
