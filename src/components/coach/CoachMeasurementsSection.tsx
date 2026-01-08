import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Settings } from 'lucide-react';
import {
  ClientMeasurement,
  MeasurementInput,
  getClientMeasurements,
  measurementLabels,
} from '../../services/measurementsService';
import { MeasurementSettingsModal } from './MeasurementSettingsModal';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface CoachMeasurementsSectionProps {
  clientId: string;
  coachId: string;
}

export const CoachMeasurementsSection: React.FC<CoachMeasurementsSectionProps> = ({
  clientId,
  coachId,
}) => {
  const [measurements, setMeasurements] = useState<ClientMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Champs sélectionnés pour le graphique et le tableau
  const [selectedFields, setSelectedFields] = useState<Array<keyof MeasurementInput>>(['weight']);

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const measurementsData = await getClientMeasurements(clientId);
      setMeasurements(measurementsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectedField = (field: keyof MeasurementInput) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  // Préparer les données pour le graphique (uniquement les champs sélectionnés)
  const chartData = useMemo(() => {
    const sortedMeasurements = [...measurements].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    const labels = sortedMeasurements.map((m) =>
      new Date(m.recorded_at).toLocaleDateString('fr-FR')
    );

    const datasets = selectedFields.map((field) => {
      const color = getColorForField(field);
      return {
        label: measurementLabels[field],
        data: sortedMeasurements.map((m) => m[field] || null),
        borderColor: color,
        backgroundColor: color + '33',
        tension: 0.3,
      };
    });

    return { labels, datasets };
  }, [measurements, selectedFields]);

  // Liste de tous les champs disponibles
  const allFields: Array<keyof MeasurementInput> = [
    'weight',
    'neck',
    'chest',
    'waist',
    'hips',
    'glutes',
    'thigh',
    'calf',
    'arm',
    'forearm',
    'shoulder',
    'body_fat',
    'muscle_mass',
  ];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header avec bouton Paramètres */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
          Suivi des Mensurations
        </h4>
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <Settings className="h-4 w-4" />
          Paramètres
        </button>
      </div>

      {/* Section de sélection des mensurations */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h5 className="font-semibold text-base mb-4 text-gray-800 dark:text-gray-200">
          Sélectionner les mensurations à afficher
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allFields.map((field) => (
            <label
              key={field}
              className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedFields.includes(field)}
                onChange={() => toggleSelectedField(field)}
                className="rounded text-blue-500 focus:ring-blue-500 h-4 w-4"
              />
              <span>{measurementLabels[field]}</span>
            </label>
          ))}
        </div>
        {selectedFields.length === 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 italic">
            Veuillez sélectionner au moins une mensuration pour afficher le graphique et l'historique.
          </p>
        )}
      </div>

      {/* Graphique */}
      {selectedFields.length > 0 && (
        <div>
          <h5 className="font-semibold text-base mb-4 text-gray-800 dark:text-gray-200">
            Graphique des Mensurations
          </h5>
          {measurements.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                    },
                  },
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              Aucune mensuration enregistrée par le client.
            </p>
          )}
        </div>
      )}

      {/* Historique (uniquement les colonnes sélectionnées) */}
      {selectedFields.length > 0 && (
        <div>
          <h5 className="font-semibold text-base mb-4 text-gray-800 dark:text-gray-200">
            Historique des mensurations
          </h5>
          {measurements.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 font-semibold sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">
                      Date
                    </th>
                    {selectedFields.map((field) => (
                      <th key={field} className="p-3 font-semibold whitespace-nowrap">
                        {measurementLabels[field]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {measurements.map((measurement) => (
                    <tr key={measurement.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3 sticky left-0 bg-white dark:bg-gray-900 z-10 font-medium">
                        {new Date(measurement.recorded_at).toLocaleDateString('fr-FR')}
                      </td>
                      {selectedFields.map((field) => (
                        <td key={field} className="p-3 whitespace-nowrap">
                          {measurement[field] !== null && measurement[field] !== undefined
                            ? measurement[field]!.toFixed(field === 'body_fat' ? 1 : 1)
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              Aucun historique de mensurations enregistré.
            </p>
          )}
        </div>
      )}

      {/* Modal de configuration */}
      <MeasurementSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        clientId={clientId}
        coachId={coachId}
        onSave={loadData}
      />
    </div>
  );
};

// Fonction pour obtenir une couleur pour chaque champ
function getColorForField(field: keyof MeasurementInput): string {
  const colors: Record<keyof MeasurementInput, string> = {
    weight: '#3B82F6', // blue
    neck: '#EF4444', // red
    chest: '#10B981', // green
    waist: '#F59E0B', // amber
    hips: '#8B5CF6', // purple
    glutes: '#EC4899', // pink
    thigh: '#14B8A6', // teal
    calf: '#F97316', // orange
    arm: '#06B6D4', // cyan
    forearm: '#84CC16', // lime
    shoulder: '#6366F1', // indigo
    body_fat: '#EAB308', // yellow
    muscle_mass: '#22C55E', // green-500
    notes: '#6B7280', // gray
  };
  return colors[field] || '#6B7280';
}
