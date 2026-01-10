/**
 * Page Paramètres du Planning
 * 
 * Permet au coach de configurer :
 * - Types de rendez-vous (nom, durée, couleur)
 * - Motifs de rendez-vous
 * - Disponibilités hebdomadaires
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Clock, Palette, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAppointmentTypes,
  getAppointmentReasons,
  createAppointmentType,
  createAppointmentReason,
  deleteAppointmentType,
  deleteAppointmentReason,
  AppointmentType,
  AppointmentReason,
} from '../../services/appointmentConfigService';
import {
  getCoachAvailability,
  createAvailability,
  deleteAvailability,
} from '../../services/availabilityService';
import { toast } from 'react-hot-toast';

type Tab = 'types' | 'reasons' | 'availability';

const PlanningSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('types');
  const [loading, setLoading] = useState(true);

  // Types de rendez-vous
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDuration, setNewTypeDuration] = useState(60);
  const [newTypeColor, setNewTypeColor] = useState('#3B82F6');

  // Motifs
  const [appointmentReasons, setAppointmentReasons] = useState<AppointmentReason[]>([]);
  const [newReasonLabel, setNewReasonLabel] = useState('');

  // Disponibilités
  const [availabilities, setAvailabilities] = useState<CoachAvailability[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [types, reasons, avail] = await Promise.all([
        getAppointmentTypes(user.id, false),
        getAppointmentReasons(user.id, false),
        getCoachAvailability(user.id, false),
      ]);
      setAppointmentTypes(types);
      setAppointmentReasons(reasons);
      setAvailabilities(avail);
    } catch (error) {
      console.error('Erreur chargement configuration:', error);
      toast.error('Impossible de charger la configuration');
    } finally {
      setLoading(false);
    }
  };

  // Gestion des types
  const handleAddType = async () => {
    if (!user?.id || !newTypeName.trim()) {
      toast.error('Veuillez renseigner un nom');
      return;
    }

    try {
      await createAppointmentType({
        coach_id: user.id,
        name: newTypeName.trim(),
        default_duration: newTypeDuration,
        color: newTypeColor,
      });
      toast.success('Type ajouté');
      setNewTypeName('');
      setNewTypeDuration(60);
      setNewTypeColor('#3B82F6');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm('Supprimer ce type de rendez-vous ?')) return;

    try {
      await deleteAppointmentType(id);
      toast.success('Type supprimé');
      loadData();
    } catch (error: any) {
      if (error.message?.includes('rendez-vous l\'utilisent')) {
        toast.error('Impossible de supprimer : des rendez-vous utilisent ce type');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  // Gestion des motifs
  const handleAddReason = async () => {
    if (!user?.id || !newReasonLabel.trim()) {
      toast.error('Veuillez renseigner un motif');
      return;
    }

    try {
      await createAppointmentReason({
        coach_id: user.id,
        label: newReasonLabel.trim(),
      });
      toast.success('Motif ajouté');
      setNewReasonLabel('');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDeleteReason = async (id: string) => {
    if (!confirm('Supprimer ce motif ?')) return;

    try {
      await deleteAppointmentReason(id);
      toast.success('Motif supprimé');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres du Planning</h1>
        <p className="text-gray-600 mt-1">
          Configurez vos types de rendez-vous, motifs et disponibilités
        </p>
      </div>

      {/* Onglets */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'types'
                ? 'border-primary-600 text-primary-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Types de rendez-vous
          </button>
          <button
            onClick={() => setActiveTab('reasons')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'reasons'
                ? 'border-primary-600 text-primary-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Motifs
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'availability'
                ? 'border-primary-600 text-primary-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Disponibilités
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Onglet Types */}
          {activeTab === 'types' && (
            <div className="space-y-6">
              {/* Formulaire d'ajout */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ajouter un type de rendez-vous
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="Ex: Consultation initiale"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée (min) *
                    </label>
                    <input
                      type="number"
                      value={newTypeDuration}
                      onChange={(e) => setNewTypeDuration(parseInt(e.target.value) || 60)}
                      min="15"
                      step="15"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={newTypeColor}
                        onChange={(e) => setNewTypeColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <button
                        onClick={handleAddType}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste des types */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    Types existants ({appointmentTypes.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {appointmentTypes.map((type) => (
                    <div key={type.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: type.color }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{type.name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {type.default_duration} minutes
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteType(type.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {appointmentTypes.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      Aucun type de rendez-vous configuré
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Motifs */}
          {activeTab === 'reasons' && (
            <div className="space-y-6">
              {/* Formulaire d'ajout */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ajouter un motif
                </h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newReasonLabel}
                    onChange={(e) => setNewReasonLabel(e.target.value)}
                    placeholder="Ex: Suivi de progression"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={handleAddReason}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Liste des motifs */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    Motifs existants ({appointmentReasons.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {appointmentReasons.map((reason) => (
                    <div key={reason.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="font-medium text-gray-900">{reason.label}</div>
                      <button
                        onClick={() => handleDeleteReason(reason.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {appointmentReasons.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      Aucun motif configuré
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Disponibilités */}
          {activeTab === 'availability' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Vos disponibilités hebdomadaires
                </h3>
                <p className="text-gray-600 mb-6">
                  Définissez vos plages horaires disponibles pour chaque jour de la semaine.
                  Ces créneaux seront proposés aux clients lors de la prise de rendez-vous.
                </p>

                {/* Affichage des disponibilités par jour */}
                <div className="space-y-4">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                    const dayAvailabilities = availabilities.filter(a => a.day_of_week === day);
                    return (
                      <div key={day} className="border border-gray-200 rounded-lg p-4">
                        <div className="font-medium text-gray-900 mb-2">{dayNames[day]}</div>
                        {dayAvailabilities.length > 0 ? (
                          <div className="space-y-2">
                            {dayAvailabilities.map((avail) => (
                              <div key={avail.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">
                                  {avail.start_time.substring(0, 5)} - {avail.end_time.substring(0, 5)}
                                </span>
                                <button
                                  onClick={async () => {
                                    if (confirm('Supprimer cette disponibilité ?')) {
                                      try {
                                        await deleteAvailability(avail.id);
                                        toast.success('Disponibilité supprimée');
                                        loadData();
                                      } catch (error) {
                                        toast.error('Erreur lors de la suppression');
                                      }
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Non disponible</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Astuce :</strong> Les disponibilités par défaut ont été créées automatiquement
                    (Lundi-Vendredi, 9h-12h et 14h-18h). Vous pouvez les modifier selon vos besoins.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanningSettingsPage;
