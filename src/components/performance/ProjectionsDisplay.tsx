import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Target, Activity, ChevronRight, AlertCircle, Search, X, Trophy, ArrowUp, ArrowDown, Minus, Calendar } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ExerciseProjection } from '../../types';

interface ProjectionsDisplayProps {
  clientId: string;
  selectedExerciseId?: string | null;
  selectedExerciseName?: string | null;
  onExerciseSelect?: (exerciseId: string | null, exerciseName: string | null) => void;
}

interface Exercise {
  id: string;
  name: string;
  equipment?: string | null;
}

interface ExerciseRecord {
  id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  one_rm_calculated: number;
  source: string;
  recorded_at: string;
}

interface PerformanceStats {
  currentOneRM: number | null;
  currentDate: string | null;
  personalRecord: number | null;
  prDate: string | null;
  previousOneRM: number | null;
  trend: 'up' | 'down' | 'stable' | null;
  trendPercent: number | null;
}

export const ProjectionsDisplay: React.FC<ProjectionsDisplayProps> = ({ 
  clientId,
  selectedExerciseId: externalSelectedId,
  selectedExerciseName: externalSelectedName,
  onExerciseSelect
}) => {
  const [projections, setProjections] = useState<ExerciseProjection[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Utiliser les props externes si disponibles, sinon état local
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const [localSelectedName, setLocalSelectedName] = useState<string | null>(null);
  const selectedExerciseId = externalSelectedId !== undefined ? externalSelectedId : localSelectedId;
  const selectedExerciseName = externalSelectedName !== undefined ? externalSelectedName : localSelectedName;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasNoData, setHasNoData] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjections();
    fetchAllExercises();
    fetchExerciseRecords();
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

  // Calculer les stats quand l'exercice sélectionné change
  useEffect(() => {
    if (selectedExerciseId) {
      calculatePerformanceStats(selectedExerciseId);
      // Vérifier si cet exercice a des données
      const exerciseProjections = projections.filter(p => p.exerciseId === selectedExerciseId);
      const exerciseRecs = exerciseRecords.filter(r => r.exercise_id === selectedExerciseId);
      setHasNoData(exerciseProjections.length === 0 && exerciseRecs.length === 0);
    }
  }, [selectedExerciseId, exerciseRecords, projections]);

  const fetchProjections = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_exercise_projections')
        .select(`
          *,
          exercises (name, equipment)
        `)
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(p => ({
        ...p,
        exerciseName: p.exercises?.name,
        exerciseEquipment: p.exercises?.equipment
      }));
      
      setProjections(formattedData);
      // Ne pas sélectionner automatiquement un exercice - l'utilisateur doit choisir
    } catch (error) {
      console.error('Error fetching projections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, equipment')
        .order('name', { ascending: true });

      if (error) throw error;
      setAllExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchExerciseRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('client_exercise_records')
        .select('*')
        .eq('client_id', clientId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setExerciseRecords(data || []);
    } catch (error) {
      console.error('Error fetching exercise records:', error);
    }
  };

  // Générer les projections (1-15 reps) à partir du 1RM
  const generateProjectionsFromOneRM = (oneRM: number): { targetReps: number; projectedWeight: number }[] => {
    const projections = [];
    for (let reps = 1; reps <= 15; reps++) {
      // Formule inverse de Brzycki: weight = 1RM * (1.0278 - 0.0278 * reps)
      const projectedWeight = oneRM * (1.0278 - 0.0278 * reps);
      projections.push({
        targetReps: reps,
        projectedWeight: Math.max(0, projectedWeight)
      });
    }
    return projections;
  };

  const calculatePerformanceStats = (exerciseId: string) => {
    const records = exerciseRecords
      .filter(r => r.exercise_id === exerciseId)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

    if (records.length === 0) {
      setPerformanceStats(null);
      return;
    }

    // 1RM actuel = dernière performance
    const latestRecord = records[0];
    const currentOneRM = parseFloat(latestRecord.one_rm_calculated?.toString() || '0');
    const currentDate = latestRecord.recorded_at;

    // Record Personnel (PR) = meilleur 1RM historique
    let personalRecord = 0;
    let prDate: string | null = null;
    records.forEach(r => {
      const oneRM = parseFloat(r.one_rm_calculated?.toString() || '0');
      if (oneRM > personalRecord) {
        personalRecord = oneRM;
        prDate = r.recorded_at;
      }
    });

    // Tendance = comparaison avec la performance précédente
    let previousOneRM: number | null = null;
    let trend: 'up' | 'down' | 'stable' | null = null;
    let trendPercent: number | null = null;

    if (records.length > 1) {
      previousOneRM = parseFloat(records[1].one_rm_calculated?.toString() || '0');
      const diff = currentOneRM - previousOneRM;
      trendPercent = previousOneRM > 0 ? (diff / previousOneRM) * 100 : 0;
      
      if (Math.abs(trendPercent) < 2) {
        trend = 'stable';
      } else if (diff > 0) {
        trend = 'up';
      } else {
        trend = 'down';
      }
    }

    setPerformanceStats({
      currentOneRM,
      currentDate,
      personalRecord,
      prDate,
      previousOneRM,
      trend,
      trendPercent
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getExerciseDisplayName = (name: string, equipment?: string | null) => {
    if (equipment) {
      return `${name} (${equipment})`;
    }
    return name;
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

  const handleSelectExercise = (exerciseId: string, exerciseName: string) => {
    if (onExerciseSelect) {
      onExerciseSelect(exerciseId, exerciseName);
    } else {
      setLocalSelectedId(exerciseId);
      setLocalSelectedName(exerciseName);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    if (onExerciseSelect) {
      onExerciseSelect(null, null);
    } else {
      setLocalSelectedId(null);
      setLocalSelectedName(null);
    }
    setHasNoData(false);
    setPerformanceStats(null);
  };

  // Filtrer les exercices de la BDD selon la recherche
  const filteredExercises = allExercises.filter(ex => {
    const displayName = getExerciseDisplayName(ex.name, ex.equipment);
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Projections depuis la BDD
  const dbProjections = selectedExerciseId ? getProjectionsForExercise(selectedExerciseId) : [];
  
  // Générer les projections à partir du 1RM si pas de projections en BDD
  const generatedProjections = performanceStats?.currentOneRM 
    ? generateProjectionsFromOneRM(performanceStats.currentOneRM)
    : [];
  
  // Utiliser les projections BDD si disponibles, sinon les projections générées
  const currentProjections = dbProjections.length > 0 ? dbProjections : generatedProjections.map((p, index) => ({
    id: `generated-${index}`,
    clientId: clientId,
    exerciseId: selectedExerciseId || '',
    targetReps: p.targetReps,
    projectedWeight: p.projectedWeight,
    basedOnPerformanceId: '',
    actualWeight: undefined,
    actualPerformanceId: undefined,
    difference: undefined,
    differencePercent: undefined,
    nervousProfile: undefined
  }));
  
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
              filteredExercises.map((exercise) => {
                const displayName = getExerciseDisplayName(exercise.name, exercise.equipment);
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => handleSelectExercise(exercise.id, displayName)}
                    className={`w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-b-0 ${
                      selectedExerciseId === exercise.id ? 'bg-primary/10 text-primary font-medium' : 'text-gray-900'
                    }`}
                  >
                    <span>{exercise.name}</span>
                    {exercise.equipment && (
                      <span className="text-gray-500 ml-1">({exercise.equipment})</span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">
                Aucun exercice trouvé
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vignette de l'exercice sélectionné avec croix */}
      {selectedExerciseName && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-primary text-white shadow-lg shadow-primary/20 flex items-center gap-2">
            <span>{selectedExerciseName}</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message si aucune donnée pour cet exercice */}
      {hasNoData && selectedExerciseName && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 text-center">
          <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-orange-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée disponible</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Aucune performance n'a été enregistrée pour <strong>{selectedExerciseName}</strong>. Ajoutez une performance dans l'onglet "Saisir une perf" ou validez une séance.
          </p>
        </div>
      )}

      {/* Contenu des performances et projections */}
      {!hasNoData && selectedExerciseId && (performanceStats || currentProjections.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche : Stats de performance */}
          <div className="lg:col-span-1 space-y-4">
            {/* Carte 1RM Actuel */}
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-xl shadow-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 opacity-80" />
                  <span className="text-sm font-medium opacity-90">1RM Actuel</span>
                </div>
                {performanceStats?.trend && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                    performanceStats.trend === 'up' ? 'bg-green-500/20 text-green-200' :
                    performanceStats.trend === 'down' ? 'bg-red-500/20 text-red-200' :
                    'bg-white/20 text-white/80'
                  }`}>
                    {performanceStats.trend === 'up' && <ArrowUp className="h-3 w-3" />}
                    {performanceStats.trend === 'down' && <ArrowDown className="h-3 w-3" />}
                    {performanceStats.trend === 'stable' && <Minus className="h-3 w-3" />}
                    {performanceStats.trendPercent !== null && (
                      <span>{performanceStats.trendPercent > 0 ? '+' : ''}{performanceStats.trendPercent.toFixed(1)}%</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-4xl font-bold mb-1">
                {performanceStats?.currentOneRM?.toFixed(1) || mainProjection?.projectedWeight?.toFixed(1) || 'N/A'} <span className="text-lg font-normal opacity-80">kg</span>
              </div>
              <div className="flex items-center gap-1 text-xs opacity-70">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(performanceStats?.currentDate || null)}</span>
              </div>
            </div>

            {/* Carte Record Personnel (PR) */}
            {performanceStats?.personalRecord && performanceStats.personalRecord > 0 && (
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl shadow-yellow-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-5 w-5 opacity-80" />
                  <span className="text-sm font-medium opacity-90">Record Personnel (PR)</span>
                </div>
                <div className="text-3xl font-bold mb-1">
                  {performanceStats.personalRecord.toFixed(1)} <span className="text-lg font-normal opacity-80">kg</span>
                </div>
                <div className="flex items-center gap-1 text-xs opacity-70">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(performanceStats.prDate)}</span>
                </div>
                {performanceStats.currentOneRM && performanceStats.currentOneRM < performanceStats.personalRecord && (
                  <div className="mt-3 text-xs bg-white/20 rounded-lg px-3 py-2">
                    <span className="opacity-80">Écart avec l'actuel : </span>
                    <span className="font-bold">
                      {(performanceStats.personalRecord - performanceStats.currentOneRM).toFixed(1)} kg
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Profil Nerveux */}
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
              
              {currentProjections.length > 0 ? (
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
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">Aucune projection disponible pour cet exercice.</p>
                  <p className="text-xs mt-1">Les projections seront calculées après l'ajout de performances.</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                <strong>Note :</strong> Les projections sont calculées via la formule de Brzycki. Les performances réelles écrasent les projections et permettent d'affiner le profil nerveux du client.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message si aucun exercice sélectionné */}
      {!selectedExerciseId && projections.length === 0 && exerciseRecords.length === 0 && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Target className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune projection disponible</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Enregistrez des performances pour voir les projections et le profil nerveux du client.
          </p>
        </div>
      )}
    </div>
  );
};
