import React, { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';
import {
  getMeasurementSettings,
  upsertMeasurementSettings,
  getDefaultMeasurementSettings,
  measurementLabels,
  MeasurementSettings,
} from '../../services/measurementsService';

interface MeasurementSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  coachId: string;
  onSave?: () => void;
}

export const MeasurementSettingsModal: React.FC<MeasurementSettingsModalProps> = ({
  isOpen,
  onClose,
  clientId,
  coachId,
  onSave,
}) => {
  const [settings, setSettings] = useState(getDefaultMeasurementSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && clientId) {
      loadSettings();
    }
  }, [isOpen, clientId]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getMeasurementSettings(clientId);
      if (data) {
        setSettings({
          weight_visible: data.weight_visible,
          neck_visible: data.neck_visible,
          chest_visible: data.chest_visible,
          waist_visible: data.waist_visible,
          hips_visible: data.hips_visible,
          glutes_visible: data.glutes_visible,
          thigh_visible: data.thigh_visible,
          calf_visible: data.calf_visible,
          arm_visible: data.arm_visible,
          forearm_visible: data.forearm_visible,
          shoulder_visible: data.shoulder_visible,
          body_fat_visible: data.body_fat_visible,
          muscle_mass_visible: data.muscle_mass_visible,
        });
      } else {
        setSettings(getDefaultMeasurementSettings());
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (field: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertMeasurementSettings(clientId, coachId, settings);
      alert('Paramètres enregistrés avec succès !');
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des paramètres.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const measurementFields: Array<{
    key: keyof typeof settings;
    label: string;
  }> = [
    { key: 'weight_visible', label: measurementLabels.weight },
    { key: 'neck_visible', label: measurementLabels.neck },
    { key: 'chest_visible', label: measurementLabels.chest },
    { key: 'waist_visible', label: measurementLabels.waist },
    { key: 'hips_visible', label: measurementLabels.hips },
    { key: 'glutes_visible', label: measurementLabels.glutes },
    { key: 'thigh_visible', label: measurementLabels.thigh },
    { key: 'calf_visible', label: measurementLabels.calf },
    { key: 'arm_visible', label: measurementLabels.arm },
    { key: 'forearm_visible', label: measurementLabels.forearm },
    { key: 'shoulder_visible', label: measurementLabels.shoulder },
    { key: 'body_fat_visible', label: measurementLabels.body_fat },
    { key: 'muscle_mass_visible', label: measurementLabels.muscle_mass },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Configuration des Mensurations
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Choisissez les mensurations que votre client pourra saisir. Les champs désactivés ne
                seront pas visibles pour le client.
              </p>

              <div className="space-y-3">
                {measurementFields.map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                    <button
                      onClick={() => handleToggle(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        settings[key]
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings[key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};
