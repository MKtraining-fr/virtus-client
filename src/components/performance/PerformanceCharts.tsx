import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Calendar, TrendingUp, BarChart2, Search, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ExerciseRecord } from '../../types';

interface PerformanceChartsProps {
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

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ 
  clientId,
  selectedExerciseId: externalSelectedId,
  selectedExerciseName: externalSelectedName,
  onExerciseSelect
}) => {
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Utiliser les props externes si disponibles, sinon état local
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const [localSelectedName, setLocalSelectedName] = useState<string | null>(null);
  const selectedExerciseId = externalSelectedId !== undefined ? externalSelectedId : localSelectedId;
  const selectedExerciseName = externalSelectedName !== undefined ? externalSelectedName : localSelectedName;
  
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRecords();
    fetchAllExercises();
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

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_exercise_records')
        .select(`
          *,
          exercises (name, equipment)
        `)
        .eq('client_id', clientId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      
      const formattedData = (data || []).map(r => ({
        ...r,
        exerciseName: r.exercises?.name,
        exerciseEquipment: r.exercises?.equipment,
        date: new Date(r.recorded_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        fullDate: new Date(r.recorded_at).toLocaleDateString('fr-FR')
      }));
      
      setRecords(formattedData);
      // Ne pas sélectionner automatiquement un exercice - l'utilisateur doit choisir
    } catch (error) {
      console.error('Error fetching records:', error);
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

  const getExerciseDisplayName = (name: string, equipment?: string | null) => {
    if (equipment) {
      return `${name} (${equipment})`;
    }
    return name;
  };

  const getUniqueExercises = () => {
    const exercises = new Map();
    records.forEach(r => {
      if (!exercises.has(r.exercise_id)) {
        exercises.set(r.exercise_id, {
          name: r.exerciseName,
          equipment: r.exerciseEquipment
        });
      }
    });
    return Array.from(exercises.entries());
  };

  const getChartData = () => {
    if (!selectedExerciseId) return [];
    
    let filteredRecords = records.filter(r => r.exercise_id === selectedExerciseId);
    
    // Appliquer le filtre de période
    if (timeRange !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (timeRange) {
        case '1m':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3m':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case '6m':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
      }
      
      filteredRecords = filteredRecords.filter(r => new Date(r.recorded_at) >= cutoffDate);
    }
    
    return filteredRecords;
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
  };

  // Filtrer les exercices selon la recherche
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

  const uniqueExercises = getUniqueExercises();
  const chartData = getChartData();
  const hasData = chartData.length > 0;

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

      {/* Vignette de l'exercice sélectionné + Filtres de période */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {selectedExerciseName && (
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
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

        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(['1m', '3m', '6m', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === range 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Message si aucune donnée */}
      {!hasData && selectedExerciseId && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 text-center">
          <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="h-6 w-6 text-orange-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée disponible</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Aucune performance n'a été enregistrée pour cet exercice sur la période sélectionnée.
          </p>
        </div>
      )}

      {/* Message si aucun exercice sélectionné */}
      {!selectedExerciseId && records.length === 0 && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <BarChart2 className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée graphique</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Enregistrez plusieurs performances pour visualiser l'évolution du client.
          </p>
        </div>
      )}

      {/* Graphiques */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique 1RM */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Évolution du 1RM</h3>
                  <p className="text-xs text-gray-500">Force maximale estimée (kg)</p>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="color1rm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    labelStyle={{fontWeight: 'bold', marginBottom: '4px'}}
                    formatter={(value: number) => [`${value.toFixed(1)} kg`, '1RM Estimé']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="one_rm_calculated" 
                    name="1RM Estimé"
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#color1rm)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphique Volume/Charge */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Charge & Répétitions</h3>
                  <p className="text-xs text-gray-500">Performances réelles enregistrées</p>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '20px'}} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="weight" 
                    name="Poids (kg)"
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}}
                    activeDot={{r: 6}}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="reps" 
                    name="Répétitions"
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{r: 3, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff'}}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
