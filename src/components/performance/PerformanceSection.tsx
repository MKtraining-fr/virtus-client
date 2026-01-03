import React, { useState } from 'react';
import { Calculator, TrendingUp, BarChart2, Info, Target } from 'lucide-react';
import { PerformanceEntry } from './PerformanceEntry';
import { ProjectionsDisplay } from './ProjectionsDisplay';
import { PerformanceCharts } from './PerformanceCharts';

interface PerformanceSectionProps {
  clientId: string;
  isCoach?: boolean;
}

export const PerformanceSection: React.FC<PerformanceSectionProps> = ({
  clientId,
  isCoach = false
}) => {
  const [activeTab, setActiveTab] = useState<'entry' | 'projections' | 'charts'>('projections');
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePerformanceAdded = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('projections');
  };

  return (
    <div className="space-y-6">
      {/* Navigation interne */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('projections')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'projections'
                ? 'bg-primary/10 text-primary'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Target className="h-4 w-4" />
            Projections & Profil
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'charts'
                ? 'bg-primary/10 text-primary'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            Évolution
          </button>
          <button
            onClick={() => setActiveTab('entry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'entry'
                ? 'bg-primary/10 text-primary'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Calculator className="h-4 w-4" />
            Saisir une perf
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-[10px] font-bold text-blue-600 uppercase tracking-wider">
          <Info className="h-3 w-3" />
          Données synchronisées en temps réel
        </div>
      </div>

      {/* Contenu des onglets */}
      <div key={refreshKey} className="animate-in fade-in duration-500">
        {activeTab === 'entry' && (
          <PerformanceEntry 
            clientId={clientId} 
            onPerformanceAdded={handlePerformanceAdded} 
          />
        )}
        {activeTab === 'projections' && (
          <ProjectionsDisplay clientId={clientId} />
        )}
        {activeTab === 'charts' && (
          <PerformanceCharts clientId={clientId} />
        )}
      </div>
    </div>
  );
};

