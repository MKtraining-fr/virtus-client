import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Calendar, Activity, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { supabase } from '../../services/supabase';
import { ExerciseRecord, ExerciseProjection } from '../../types';

interface ExerciseDetailProps {
  clientId: string;
  exerciseId: string;
  exerciseName: string;
  onBack: () => void;
}

export const ExerciseDetail: React.FC<ExerciseDetailProps> = ({
  clientId,
  exerciseId,
  exerciseName,
  onBack
}) => {
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [projections, setProjections] = useState<ExerciseProjection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [clientId, exerciseId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Charger les records
      const { data: recordsData, error: recordsError } = await supabase
        .from('client_exercise_records')
        .select('*')
        .eq('client_id', clientId)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: true });

      if (recordsError) throw recordsError;
      setRecords(recordsData || []);

      // Charger les projections
      const { data: projectionsData, error: projectionsError } = await supabase
        .from('client_exercise_projections')
        .select('*')
        .eq('client_id', clientId)
        .eq('exercise_id', exerciseId)
        .order('rep_range', { ascending: true });

      if (projectionsError) throw projectionsError;
      setProjections(projectionsData || []);
    } catch (error) {
      console.error('Error loading exercise data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Préparer les données pour le graphique d'évolution du 1RM
  const chartData = records.map((record) => ({
    date: new Date(record.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    '1RM': record.estimated_1rm ? Math.round(record.estimated_1rm) : null,
    charge: record.weight,
    reps: record.reps
  }));

  // Préparer les données pour le profil nerveux (radar chart)
  const nerveProfileData = projections
    .filter(p => [1, 3, 5, 8, 10, 12, 15].includes(p.rep_range))
    .map(p => ({
      reps: `${p.rep_range}RM`,
      score: p.actual_performance && p.projected_weight
        ? Math.round((p.actual_performance / p.projected_weight) * 100)
        : 100
    }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

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
        <p className="mt-4 text-gray-500">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{exerciseName}</h3>
          <p className="text-sm text-gray-500">{records.length} performance{records.length > 1 ? 's' : ''} enregistrée{records.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Graphique d'évolution du 1RM */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Évolution du 1RM
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Charge (kg)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="1RM" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tableau des projections */}
      {projections.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
                    <tr key={proj.rep_range} className="border-b border-gray-100 hover:bg-gray-50">
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
      )}

      {/* Profil nerveux */}
      {nerveProfileData.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
            </div>
          </div>
        </div>
      )}

      {/* Historique des performances */}
      <div className="bg-white p-6 rounded-xl border border-gray-100">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Historique
        </h4>
        <div className="space-y-3">
          {records.slice().reverse().map((record) => (
            <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900">
                  {record.weight}kg × {record.reps} reps
                  {record.sets && record.sets > 1 && ` × ${record.sets} séries`}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatDate(record.created_at)}
                  {record.rir !== null && record.rir !== undefined && (
                    <span className="ml-2">• RIR: {record.rir}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">1RM estimé</div>
                <div className="text-lg font-bold text-primary">
                  {record.estimated_1rm ? `${Math.round(record.estimated_1rm)}kg` : 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
