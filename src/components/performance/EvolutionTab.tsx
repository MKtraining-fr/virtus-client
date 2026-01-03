import React, { useState, useEffect } from 'react';
import { Search, Activity, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../services/supabase';
import { ExerciseRecord } from '../../types';

interface EvolutionTabProps {
  clientId: string;
}

interface ExerciseWithRecords {
  exerciseId: string;
  exerciseName: string;
  lastRecord: ExerciseRecord;
  recordCount: number;
}

interface ChartDataPoint {
  date: string;
  oneRM: number;
  weight: number;
  reps: number;
}

export const EvolutionTab: React.FC<EvolutionTabProps> = ({ clientId }) => {
  const [exercises, setExercises] = useState<ExerciseWithRecords[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'1M' | '3M' | '6M' | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, [clientId, periodFilter]);

  useEffect(() => {
    if (selectedExerciseId) {
      loadChartData(selectedExerciseId);
    }
  }, [selectedExerciseId, periodFilter]);

  const loadExercises = async () => {
    setIsLoading(true);
    try {
      // Calculer la date de début selon le filtre
      let startDate = new Date();
      if (periodFilter === '1M') startDate.setMonth(startDate.getMonth() - 1);
      else if (periodFilter === '3M') startDate.setMonth(startDate.getMonth() - 3);
      else if (periodFilter === '6M') startDate.setMonth(startDate.getMonth() - 6);
      else startDate = new Date(0); // ALL

      // Charger les records avec les infos des exercices
      const { data: recordsData, error } = await supabase
        .from('client_exercise_records')
        .select(`
          *,
          exercises:exercise_id (
            id,
            name
          )
        `)
        .eq('client_id', clientId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Grouper par exercice
      const exerciseMap = new Map<string, ExerciseWithRecords>();
      
      recordsData?.forEach((record: any) => {
        const exerciseId = record.exercise_id;
        const exerciseName = record.exercises?.name || 'Exercice inconnu';
        
        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            exerciseId,
            exerciseName,
            lastRecord: record,
            recordCount: 1
          });
        } else {
          const existing = exerciseMap.get(exerciseId)!;
          existing.recordCount++;
        }
      });

      setExercises(Array.from(exerciseMap.values()));
      
      // Sélectionner automatiquement le premier exercice
      if (exerciseMap.size > 0 && !selectedExerciseId) {
        const firstExercise = Array.from(exerciseMap.values())[0];
        setSelectedExerciseId(firstExercise.exerciseId);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChartData = async (exerciseId: string) => {
    try {
      // Calculer la date de début selon le filtre
      let startDate = new Date();
      if (periodFilter === '1M') startDate.setMonth(startDate.getMonth() - 1);
      else if (periodFilter === '3M') startDate.setMonth(startDate.getMonth() - 3);
      else if (periodFilter === '6M') startDate.setMonth(startDate.getMonth() - 6);
      else startDate = new Date(0); // ALL

      const { data, error } = await supabase
        .from('client_exercise_records')
        .select('*')
        .eq('client_id', clientId)
        .eq('exercise_id', exerciseId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedData: ChartDataPoint[] = (data || []).map((record: ExerciseRecord) => ({
        date: new Date(record.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        oneRM: Math.round(record.estimated_1rm || 0),
        weight: record.weight,
        reps: record.reps
      }));

      setChartData(formattedData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const filteredExercises = exercises.filter(ex =>
    ex.exerciseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedExercise = exercises.find(ex => ex.exerciseId === selectedExerciseId);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune performance enregistrée</h3>
        <p className="text-gray-500">Commencez par ajouter une performance dans l'onglet "Saisir une perf"</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche et filtres */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un exercice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          {(['1M', '3M', '6M', 'ALL'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setPeriodFilter(period)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodFilter === period
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Liste compacte des exercices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredExercises.map((exercise) => (
          <button
            key={exercise.exerciseId}
            onClick={() => setSelectedExerciseId(exercise.exerciseId)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedExerciseId === exercise.exerciseId
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{exercise.exerciseName}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {exercise.recordCount} performance{exercise.recordCount > 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">1RM estimé</div>
                <div className="text-lg font-bold text-primary">
                  {exercise.lastRecord.estimated_1rm
                    ? `${Math.round(exercise.lastRecord.estimated_1rm)}kg`
                    : 'N/A'}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Graphiques d'évolution */}
      {selectedExercise && chartData.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">{selectedExercise.exerciseName}</h3>

          {/* Graphique d'évolution du 1RM */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Évolution du 1RM
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="oneRM"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="1RM Estimé (kg)"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique Charge & Répétitions */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Charge & Répétitions
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Répétitions', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Charge (kg)"
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="reps"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Répétitions"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
