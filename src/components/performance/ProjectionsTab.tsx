import React, { useState, useEffect } from 'react';
import { Search, Activity, AlertCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { supabase } from '../../services/supabase';
import { ExerciseRecord, ExerciseProjection } from '../../types';

interface ProjectionsTabProps {
  clientId: string;
}

interface ExerciseWithRecords {
  exerciseId: string;
  exerciseName: string;
  lastRecord: ExerciseRecord;
  recordCount: number;
}

export const ProjectionsTab: React.FC<ProjectionsTabProps> = ({ clientId }) => {
  const [exercises, setExercises] = useState<ExerciseWithRecords[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [projections, setProjections] = useState<ExerciseProjection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'1M' | '3M' | '6M' | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, [clientId, periodFilter]);

  useEffect(() => {
    if (selectedExerciseId) {
      loadProjections(selectedExerciseId);
    }
  }, [selectedExerciseId]);

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

  const loadProjections = async (exerciseId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_exercise_projections')
        .select('*')
        .eq('client_id', clientId)
        .eq('exercise_id', exerciseId)
        .order('rep_range', { ascending: true });

      if (error) throw error;
      setProjections(data || []);
    } catch (error) {
      console.error('Error loading projections:', error);
    }
  };

  const filteredExercises = exercises.filter(ex =>
    ex.exerciseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedExercise = exercises.find(ex => ex.exerciseId === selectedExerciseId);

  // Préparer les données pour le profil nerveux
  const nerveProfileData = projections
    .filter(p => [1, 3, 5, 8, 10, 12, 15].includes(p.rep_range))
    .map(p => ({
      reps: `${p.rep_range}RM`,
      score: p.actual_performance && p.projected_weight
        ? Math.round((p.actual_performance / p.projected_weight) * 100)
        : 100
    }));

  const getPerformanceColor = (diff: number | null) => {
    if (!diff) return 'text-gray-500';
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getPerformanceIcon = (diff: number | null) => {
    if (!diff) return null;
    if (diff > 0) return '▲';
    if (diff < 0) return '▼';
    return '=';
  };

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
        <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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

      {/* Sélecteur d'exercice avec dropdown */}
      <div className="relative">
        <select
          value={selectedExerciseId || ''}
          onChange={(e) => setSelectedExerciseId(e.target.value)}
          className="w-full p-4 border-2 border-gray-200 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary text-base font-medium"
        >
          {filteredExercises.map((exercise) => (
            <option key={exercise.exerciseId} value={exercise.exerciseId}>
              {exercise.exerciseName} - {exercise.recordCount} performance{exercise.recordCount > 1 ? 's' : ''} - 1RM: {exercise.lastRecord.estimated_1rm ? `${Math.round(exercise.lastRecord.estimated_1rm)}kg` : 'N/A'}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Carte de l'exercice sélectionné */}
      {selectedExercise && (
        <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{selectedExercise.exerciseName}</h4>
              <p className="text-sm text-gray-500 mt-1">
                {selectedExercise.recordCount} performance{selectedExercise.recordCount > 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">1RM estimé</div>
              <div className="text-lg font-bold text-primary">
                {selectedExercise.lastRecord.estimated_1rm
                  ? `${Math.round(selectedExercise.lastRecord.estimated_1rm)}kg`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profil nerveux */}
      {nerveProfileData.length > 0 && (
        <div className="bg-gray-50 p-6 rounded-xl">
          <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Profil Nerveux
          </h4>
          <div className="flex items-start gap-4">
            <ResponsiveContainer width="50%" height={300}>
              <RadarChart data={nerveProfileData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="reps" />
                <PolarRadiusAxis angle={90} domain={[0, 120]} />
                <Radar name="Performance" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-gray-600">
                  Le profil nerveux compare vos performances réelles aux projections théoriques.
                </p>
              </div>
              <ul className="space-y-1 text-gray-600 ml-6">
                <li>• <strong>Score &gt; 100%</strong> : Force nerveuse élevée</li>
                <li>• <strong>Score ≈ 100%</strong> : Profil équilibré</li>
                <li>• <strong>Score &lt; 100%</strong> : Potentiel d'amélioration</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span className="text-xs text-gray-600">Performance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Détail de l'exercice sélectionné */}
      {selectedExercise && projections.length > 0 && (
        <div className="space-y-6">

          {/* Tableau des projections */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Tableau des Projections
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">RM</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Projection</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Réel</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((proj) => {
                    const diff = proj.actual_performance && proj.projected_weight
                      ? proj.actual_performance - proj.projected_weight
                      : null;
                    const isActual = proj.actual_performance !== null;
                    
                    return (
                      <tr key={proj.rep_range} className="border-b border-gray-100 hover:bg-white">
                        <td className="py-3 px-4 font-medium">{proj.rep_range}RM</td>
                        <td className="text-right py-3 px-4 text-gray-600">
                          {proj.projected_weight ? `${Math.round(proj.projected_weight)}kg` : 'N/A'}
                          {!isActual && <span className="ml-2 text-xs text-gray-400">(projection)</span>}
                        </td>
                        <td className="text-right py-3 px-4 font-semibold">
                          {proj.actual_performance ? `${Math.round(proj.actual_performance)}kg` : '-'}
                        </td>
                        <td className={`text-right py-3 px-4 font-semibold ${getPerformanceColor(diff)}`}>
                          {diff !== null ? (
                            <>
                              {getPerformanceIcon(diff)} {Math.abs(Math.round(diff))}kg
                            </>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
