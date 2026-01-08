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
import Button from '../Button';
import Input from '../Input';
import {
  ClientMeasurement,
  MeasurementInput,
  getClientMeasurements,
  createClientMeasurement,
  getMeasurementSettings,
  measurementLabels,
  getDefaultMeasurementSettings,
} from '../../services/measurementsService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ClientMeasurementsSectionProps {
  clientId: string;
}

export const ClientMeasurementsSection: React.FC<ClientMeasurementsSectionProps> = ({
  clientId,
}) => {
  const [measurements, setMeasurements] = useState<ClientMeasurement[]>([]);
  const [visibleFields, setVisibleFields] = useState(getDefaultMeasurementSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // États pour les nouvelles mensurations
  const [newMeasurement, setNewMeasurement] = useState<MeasurementInput>({});
  
  // Champs sélectionnés pour le graphique
  const [selectedFields, setSelectedFields] = useState<Array<keyof MeasurementInput>>(['weight']);

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Charger les mensurations
      const measurementsData = await getClientMeasurements(clientId);
      setMeasurements(measurementsData);

      // Charger les paramètres de visibilité
      const settings = await getMeasurementSettings(clientId);
      if (settings) {
        setVisibleFields({
          weight_visible: settings.weight_visible,
          neck_visible: settings.neck_visible,
          chest_visible: settings.chest_visible,
          waist_visible: settings.waist_visible,
          hips_visible: settings.hips_visible,
          glutes_visible: settings.glutes_visible,
          thigh_visible: settings.thigh_visible,
          calf_visible: settings.calf_visible,
          arm_visible: settings.arm_visible,
          forearm_visible: settings.forearm_visible,
          shoulder_visible: settings.shoulder_visible,
          body_fat_visible: settings.body_fat_visible,
          muscle_mass_visible: settings.muscle_mass_visible,
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Vérifier qu'au moins un champ est rempli
    const hasData = Object.values(newMeasurement).some((value) => value !== null && value !== undefined && value !== '');
    if (!hasData) {
      alert('Veuillez remplir au moins un champ avant d\'enregistrer.');
      return;
    }

    setIsSaving(true);
    try {
      await createClientMeasurement(clientId, newMeasurement);
      alert('Mensurations enregistrées avec succès !');
      setNewMeasurement({});
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des mensurations.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof MeasurementInput, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setNewMeasurement((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const toggleSelectedField = (field: keyof MeasurementInput) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  // Préparer les données pour le graphique
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

  // Liste des champs visibles
  const visibleFieldsList = useMemo(() => {
    const fields: Array<keyof MeasurementInput> = [];
    if (visibleFields.weight_visible) fields.push('weight');
    if (visibleFields.neck_visible) fields.push('neck');
    if (visibleFields.chest_visible) fields.push('chest');
    if (visibleFields.waist_visible) fields.push('waist');
    if (visibleFields.hips_visible) fields.push('hips');
    if (visibleFields.glutes_visible) fields.push('glutes');
    if (visibleFields.thigh_visible) fields.push('thigh');
    if (visibleFields.calf_visible) fields.push('calf');
    if (visibleFields.arm_visible) fields.push('arm');
    if (visibleFields.forearm_visible) fields.push('forearm');
    if (visibleFields.shoulder_visible) fields.push('shoulder');
    if (visibleFields.body_fat_visible) fields.push('body_fat');
    if (visibleFields.muscle_mass_visible) fields.push('muscle_mass');
    return fields;
  }, [visibleFields]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Graphique */}
      <div>
        <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
          Graphique des Mensurations
        </h4>
        {measurements.length > 0 ? (
          <>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
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
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {visibleFieldsList.map((field) => (
                <label
                  key={field}
                  className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field)}
                    onChange={() => toggleSelectedField(field)}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span>{measurementLabels[field]}</span>
                </label>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Aucune mensuration enregistrée. Commencez par enregistrer vos premières données ci-dessous.
          </p>
        )}
      </div>

      {/* Historique */}
      <div>
        <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
          Historique des mensurations
        </h4>
        {measurements.length > 0 ? (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="p-2 font-semibold sticky left-0 bg-gray-50 dark:bg-gray-800">
                    Date
                  </th>
                  {visibleFieldsList.map((field) => (
                    <th key={field} className="p-2 font-semibold">
                      {measurementLabels[field]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {measurements.map((measurement) => (
                  <tr key={measurement.id} className="bg-white dark:bg-gray-900">
                    <td className="p-2 sticky left-0 bg-white dark:bg-gray-900">
                      {new Date(measurement.recorded_at).toLocaleDateString('fr-FR')}
                    </td>
                    {visibleFieldsList.map((field) => (
                      <td key={field} className="p-2">
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
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Aucun historique de mensurations enregistré.
          </p>
        )}
      </div>

      {/* Formulaire d'enregistrement */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
          Enregistrer de nouvelles données
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleFieldsList.map((field) => (
              <Input
                key={field}
                label={measurementLabels[field]}
                type="number"
                step="0.1"
                value={newMeasurement[field] !== null && newMeasurement[field] !== undefined ? newMeasurement[field]!.toString() : ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className="!bg-gray-100 dark:!bg-gray-800 !border-gray-300 dark:!border-gray-700"
              />
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>
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
