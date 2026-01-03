import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Target, Activity, ChevronRight, AlertCircle, Search } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ExerciseProjection } from '../../types';

interface ProjectionsDisplayProps {
  clientId: string;
}

export const ProjectionsDisplay: React.FC<ProjectionsDisplayProps> = ({ clientId }) => {
  const [projections, setProjections] = useState<ExerciseProjection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjections();
  }, [clientId]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjections = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_exercise_projections')
        .select(`
          *,
          exercises (name)
        `)
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Mapper les noms d'exercices
      const formattedData = (data || []).map(p => ({
        ...p,
        exerciseName: p.exercises?.name
      }));
      
      setProjections(formattedData);
      if (formattedData.length > 0 && !selectedExerciseId) {
        setSelectedExerciseId(formattedData[0].exerciseId);
      }
    } catch (error) {
      console.error('Error fetching projections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUniqueExercises = () => {
    const exercises = new Map();
    projections.forEach(p => {
      if (!exercises.has(p.exerciseId)) {
        exercises.set(p.exerciseId, p.exerciseName);
      }
    });
    return Array.from(exercises.entries());
  };

  const getProjectionsForExercise = (exerciseId: string) => {
    return projections
      .filter(p => p.exerciseId === exerciseId)
      .sort((a, b) => a.targetReps - b.targetReps);
  };

  const getNervousProfileColor = (profile?: string) => {
    switch (profile) {
      case 'force': return 'text-red-600 bg-red-50 border-red-100';
      case 'endurance': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'balanced': return 'text-green-600 bg-green-50 border-green-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getNervousProfileLabel = (profile?: string) => {
    switch (profile) {
      case 'force': return 'Profil Force (Explosif)';
      case 'endurance': return 'Profil Endurance';
      case 'balanced': return 'Profil Équilibré';
      default: return 'Non déterminé';
    }
  };

  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setSearchTerm('');
    setShowDropdown(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (projections.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Target className="h-8 w-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune projection disponible</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Enregistrez des performances pour voir les projections et le profil nerveux du client.
        </p>
      </div>
    );
  }

  const uniqueExercises = getUniqueExercises();
  const filteredExercises = uniqueExercises.filter(([_, name]) => 
    name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const selectedExerciseName = uniqueExercises.find(([id]) => id === selectedExerciseId)?.[1];
  const currentProjections = selectedExerciseId ? getProjectionsForExercise(selectedExerciseId) : [];
  const mainProjection = currentProjections.find(p => p.targetReps === 1) || currentProjections[0];

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un exercice..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-base bg-white"
          />
        </div>
        
        {/* Dropdown des exercices */}
        {showDropdown && searchTerm && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
            {filteredExercises.length > 0 ? (
              filteredExercises.map(([id, name]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectExercise(id)}
                  className={`w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedExerciseId === id ? 'bg-primary/10 text-primary font-medium' : 'text-gray-900'
                  }`}
                >
                  {name}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">
                Aucun exercice trouvé
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vignette de l'exercice sélectionné */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {selectedExerciseName && (
          <div className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-primary text-white shadow-lg shadow-primary/20">
            {selectedExerciseName}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Résumé du profil */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Profil Nerveux</h3>
            </div>
            
            <div className={`px-4 py-3 rounded-xl border text-center font-bold mb-4 ${getNervousProfileColor(mainProjection?.nervousProfile)}`}>
              {getNervousProfileLabel(mainProjection?.nervousProfile)}
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              Le profil nerveux est déterminé par l'écart entre les performances réelles et les projections théoriques sur différentes plages de répétitions.
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-xl shadow-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">1RM Estimé</span>
            </div>
            <div className="text-4xl font-bold mb-1">
              {mainProjection?.projectedWeight?.toFixed(1) || 'N/A'} <span className="text-lg font-normal opacity-80">kg</span>
            </div>
            <div className="text-xs opacity-70">
              Basé sur la dernière performance enregistrée
            </div>
          </div>
        </div>

        {/* Tableau des projections */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Tableau des Projections</h3>
              <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary"></div> Projection
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div> Réel
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-50">
              {currentProjections.map((p) => (
                <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                      {p.targetReps}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Répétitions</div>
                      <div className="text-xs text-gray-500">Objectif de série</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-0.5">Projection</div>
                      <div className="text-sm font-bold text-primary">{p.projectedWeight?.toFixed(1) || 'N/A'} kg</div>
                    </div>
                    
                    <div className="text-right min-w-[80px]">
                      <div className="text-xs text-gray-400 mb-0.5">Réel</div>
                      {p.actualWeight ? (
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-bold text-green-600">{p.actualWeight.toFixed(1)} kg</div>
                          <div className={`text-[10px] font-bold ${p.difference && p.difference > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {p.difference && p.difference > 0 ? '+' : ''}{p.difference?.toFixed(1)} kg ({p.differencePercent?.toFixed(1)}%)
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-300 italic">N/A</div>
                      )}
                    </div>
                    
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-blue-700 leading-relaxed">
              <strong>Note :</strong> Les projections sont calculées via la formule de Brzycki. Les performances réelles écrasent les projections et permettent d'affiner le profil nerveux du client.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
