import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Calendar, TrendingUp, BarChart2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ExerciseRecord } from '../../types';

interface PerformanceChartsProps {
  clientId: string;
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ clientId }) => {
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | 'all'>('3m');

  useEffect(() => {
    fetchRecords();
  }, [clientId]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_exercise_records')
        .select(`
          *,
          exercises (name)
        `)
        .eq('client_id', clientId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      
      const formattedData = (data || []).map(r => ({
        ...r,
        exerciseName: r.exercises?.name,
        date: new Date(r.recorded_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        fullDate: new Date(r.recorded_at).toLocaleDateString('fr-FR')
      }));
      
      setRecords(formattedData);
      if (formattedData.length > 0 && !selectedExerciseId) {
        setSelectedExerciseId(formattedData[0].exerciseId);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUniqueExercises = () => {
    const exercises = new Map();
    records.forEach(r => {
      if (!exercises.has(r.exerciseId)) {
        exercises.set(r.exerciseId, r.exerciseName);
      }
    });
    return Array.from(exercises.entries());
  };

  const getChartData = () => {
    if (!selectedExerciseId) return [];
    return records.filter(r => r.exerciseId === selectedExerciseId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <BarChart2 className="h-8 w-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée graphique</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Enregistrez plusieurs performances pour visualiser l'évolution du client.
        </p>
      </div>
    );
  }

  const uniqueExercises = getUniqueExercises();
  const chartData = getChartData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {uniqueExercises.map(([id, name]) => (
            <button
              key={id}
              onClick={() => setSelectedExerciseId(id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedExerciseId === id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-white text-gray-600 border border-gray-100 hover:border-primary/30'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

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
    </div>
  );
};
