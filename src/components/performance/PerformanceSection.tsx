import React, { useState } from 'react';
import { Calculator, TrendingUp, BarChart2, Info, Target, FileText, Activity } from 'lucide-react';
import { PerformanceEntry } from './PerformanceEntry';
import { ProjectionsDisplay } from './ProjectionsDisplay';
import { PerformanceCharts } from './PerformanceCharts';
import { BilanInfoDisplay } from './BilanInfoDisplay';
import { TrainingInfoDisplay } from './TrainingInfoDisplay';
import { useFormPersistence } from '../../hooks/useFormPersistence';

interface PerformanceSectionProps {
  clientId: string;
  isCoach?: boolean;
}

export const PerformanceSection: React.FC<PerformanceSectionProps> = ({
  clientId,
  isCoach = false
}) => {
  // Sous-section active : 'bilan' ou 'performance'
  const [activeSubSection, setActiveSubSection] = useState<'bilan' | 'performance'>('bilan');
  
  // Onglet actif dans la sous-section Performance
  const [activeTab, setActiveTab] = useState<'entry' | 'projections' | 'charts'>('projections');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Persistance de la sélection d'exercice entre les onglets et les rechargements de page
  const [exerciseSelection, setExerciseSelection] = useFormPersistence<{
    exerciseId: string | null;
    exerciseName: string | null;
  }>(
    `performance_exercise_selection_${clientId}`,
    { exerciseId: null, exerciseName: null },
    { debounceMs: 100, expirationMs: 24 * 60 * 60 * 1000 } // 24h
  );
  
  const selectedExerciseId = exerciseSelection.exerciseId;
  const selectedExerciseName = exerciseSelection.exerciseName;

  const handlePerformanceAdded = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('projections');
  };

  const handleExerciseSelect = (exerciseId: string | null, exerciseName: string | null) => {
    setExerciseSelection({ exerciseId, exerciseName });
  };

  return (
    <div className="space-y-6">
      {/* Navigation principale entre les deux sous-sections */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveSubSection('bilan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeSubSection === 'bilan'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          Informations du Bilan
        </button>
        <button
          onClick={() => setActiveSubSection('performance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeSubSection === 'performance'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Activity className="h-4 w-4" />
          Suivi des Performances
        </button>
      </div>

      {/* Contenu de la sous-section Bilan */}
      {activeSubSection === 'bilan' && (
        <div className="animate-in fade-in duration-300 space-y-6">
          {/* Section Objectifs et Conditions d'Entraînement */}
          <TrainingInfoDisplay clientId={clientId} />
          
          {/* Séparateur */}
          <div className="border-t border-gray-200"></div>
          
          {/* Section Informations du Bilan Initial */}
          <BilanInfoDisplay clientId={clientId} />
        </div>
      )}

      {/* Contenu de la sous-section Performance */}
      {activeSubSection === 'performance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Navigation interne des performances */}
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
              <ProjectionsDisplay 
                clientId={clientId}
                selectedExerciseId={selectedExerciseId}
                selectedExerciseName={selectedExerciseName}
                onExerciseSelect={handleExerciseSelect}
              />
            )}
            {activeTab === 'charts' && (
              <PerformanceCharts 
                clientId={clientId}
                selectedExerciseId={selectedExerciseId}
                selectedExerciseName={selectedExerciseName}
                onExerciseSelect={handleExerciseSelect}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
