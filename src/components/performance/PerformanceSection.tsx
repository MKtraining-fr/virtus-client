import React, { useState } from 'react';
import { Target, TrendingUp, Plus } from 'lucide-react';
import { PerformanceEntry } from './PerformanceEntry';
import { ProjectionsTab } from './ProjectionsTab';
import { EvolutionTab } from './EvolutionTab';

interface PerformanceSectionProps {
  clientId: string;
  isCoach?: boolean;
}

export const PerformanceSection: React.FC<PerformanceSectionProps> = ({
  clientId,
  isCoach = false
}) => {
  const [activeTab, setActiveTab] = useState<'projections' | 'evolution' | 'entry'>('projections');
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePerformanceAdded = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('projections');
  };

  return (
    <div className="space-y-6">
      {/* Navigation par onglets */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('projections')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'projections'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Target className="h-4 w-4" />
            Projections & Profil
          </button>
          <button
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'evolution'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Évolution
          </button>
          <button
            onClick={() => setActiveTab('entry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'entry'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Plus className="h-4 w-4" />
            Saisir une perf
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {activeTab === 'projections' && (
          <ProjectionsTab key={refreshKey} clientId={clientId} />
        )}

        {activeTab === 'evolution' && (
          <EvolutionTab key={refreshKey} clientId={clientId} />
        )}

        {activeTab === 'entry' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold mb-1">Ajouter une performance</h4>
              <p className="text-sm text-gray-500">Enregistrer un nouveau record personnel</p>
            </div>
            <PerformanceEntry
              clientId={clientId}
              onPerformanceAdded={handlePerformanceAdded}
            />
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 text-lg">💡</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">Comment ça marche ?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Le 1RM est calculé automatiquement selon la formule de Brzycki</li>
              <li>• Les projections estiment vos performances sur différentes plages de répétitions</li>
              <li>• Le profil nerveux compare vos performances réelles aux projections théoriques</li>
              <li>• Ajoutez régulièrement vos performances pour suivre votre progression</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
