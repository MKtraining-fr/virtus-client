import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getClientPerformanceLogsWithDetails } from '../../services/performanceLogService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { ArrowLeftIcon } from '../../constants/icons';

interface PerformanceLogDetail {
  id: string;
  session_date: string;
  week_number: number;
  session_number: number;
  exercises_performed: any[];
  total_tonnage: number;
  total_duration_minutes: number;
  notes: string;
  created_at: string;
  program_assignments: {
    id: string;
    client_created_programs: {
      name: string;
      objective: string;
    };
  };
  client_created_sessions: {
    name: string;
  };
}

const ClientProgressionView: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [logs, setLogs] = useState<PerformanceLogDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<PerformanceLogDetail | null>(null);
  const [filterProgram, setFilterProgram] = useState<string>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      if (!clientId) return;
      
      setLoading(true);
      const data = await getClientPerformanceLogsWithDetails(clientId, 100);
      setLogs(data);
      setLoading(false);
    };

    fetchLogs();
  }, [clientId]);

  // Extraire les programmes uniques pour le filtre
  const uniquePrograms = Array.from(
    new Set(
      logs
        .filter((log) => log.program_assignments?.client_created_programs)
        .map((log) => log.program_assignments.client_created_programs.name)
    )
  );

  // Filtrer les logs selon le programme sélectionné
  const filteredLogs = filterProgram === 'all'
    ? logs
    : logs.filter(
        (log) =>
          log.program_assignments?.client_created_programs?.name === filterProgram
      );

  // Calculer les statistiques globales
  const totalSessions = filteredLogs.length;
  const totalTonnage = filteredLogs.reduce((sum, log) => sum + (log.total_tonnage || 0), 0);
  const averageTonnage = totalSessions > 0 ? (totalTonnage / totalSessions).toFixed(0) : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
        <div className="text-center py-10">Chargement de la progression...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100 border border-gray-500"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Progression du Client</h1>
          <p className="text-gray-600 mt-1">Historique des séances et performances</p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Séances réalisées</p>
            <p className="text-3xl font-bold text-primary mt-2">{totalSessions}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Tonnage total</p>
            <p className="text-3xl font-bold text-primary mt-2">{totalTonnage.toFixed(0)} kg</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Tonnage moyen/séance</p>
            <p className="text-3xl font-bold text-primary mt-2">{averageTonnage} kg</p>
          </div>
        </Card>
      </div>

      {/* Filtre par programme */}
      {uniquePrograms.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrer par programme
          </label>
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-500 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">Tous les programmes</option>
            {uniquePrograms.map((programName) => (
              <option key={programName} value={programName}>
                {programName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Liste des séances */}
      {filteredLogs.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">
            Aucune séance enregistrée pour ce client.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Historique des séances</h2>
          {filteredLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div onClick={() => setSelectedLog(log)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {log.client_created_sessions?.name || 'Séance sans nom'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Programme : {log.program_assignments?.client_created_programs?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Date : {new Date(log.session_date).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Semaine {log.week_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Tonnage</p>
                    <p className="text-2xl font-bold text-primary">
                      {log.total_tonnage?.toFixed(0) || 0} kg
                    </p>
                    {log.total_duration_minutes && (
                      <p className="text-sm text-gray-600 mt-1">
                        Durée : {log.total_duration_minutes} min
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {log.exercises_performed?.length || 0} exercices
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de détail d'une séance */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedLog.client_created_sessions?.name || 'Séance'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {new Date(selectedLog.session_date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Détail des exercices */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Exercices réalisés</h3>
                {selectedLog.exercises_performed?.map((exercise: any, index: number) => (
                  <Card key={index}>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {exercise.exerciseName}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Série
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Reps
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Charge
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Commentaire
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {exercise.loggedSets?.map((set: any, setIndex: number) => (
                            <tr key={setIndex}>
                              <td className="px-3 py-2 text-sm text-gray-900">{setIndex + 1}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{set.reps}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{set.load}</td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                {set.comment || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Notes */}
              {selectedLog.notes && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                  <Card>
                    <p className="text-gray-700">{selectedLog.notes}</p>
                  </Card>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setSelectedLog(null)} variant="secondary">
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProgressionView;
