/**
 * Page Paramètres du Planning
 * 
 * Permet au coach de configurer :
 * - Types de rendez-vous (nom, durée, couleur, description)
 * - Disponibilités hebdomadaires
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Clock, Loader2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAppointmentTypes,
  createAppointmentType,
  deleteAppointmentType,
  AppointmentType,
} from '../../services/appointmentConfigService';
import {
  getCoachAvailability,
  createAvailability,
  deleteAvailability,
  CoachAvailability,
} from '../../services/availabilityService';
import { toast } from 'react-hot-toast';

type Tab = 'types' | 'availability';

const PlanningSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('types');
  const [loading, setLoading] = useState(true);

  // Types de rendez-vous
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [newTypeDuration, setNewTypeDuration] = useState(60);
  const [newTypeColor, setNewTypeColor] = useState('#3B82F6');

  // Disponibilités
  const [availabilities, setAvailabilities] = useState<CoachAvailability[]>([]);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('12:00');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [types, avail] = await Promise.all([
        getAppointmentTypes(user.id, false),
        getCoachAvailability(user.id, false),
      ]);
      setAppointmentTypes(types);
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
        description: newTypeDescription.trim() || undefined,
        default_duration: newTypeDuration,
        color: newTypeColor,
      });
      toast.success('Type ajouté');
      setNewTypeName('');
      setNewTypeDescription('');
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

  // Gestion des disponibilités
  const handleAddSlot = async () => {
    if (!user?.id) return;

    try {
      await createAvailability({
        coach_id: user.id,
        day_of_week: selectedDay,
        start_time: newSlotStart,
        end_time: newSlotEnd,
      });
      toast.success('Créneau ajouté');
      setShowAddSlotModal(false);
      setNewSlotStart('09:00');
      setNewSlotEnd('12:00');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du créneau');
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Supprimer cette disponibilité ?')) return;

    try {
      await deleteAvailability(id);
      toast.success('Disponibilité supprimée');
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
          Configurez vos types de rendez-vous et disponibilités
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
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
                      <input
                        type="color"
                        value={newTypeColor}
                        onChange={(e) => setNewTypeColor(e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer border border-gray-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newTypeDescription}
                      onChange={(e) => setNewTypeDescription(e.target.value)}
                      placeholder="Décrivez ce type de rendez-vous (visible par les clients)"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    onClick={handleAddType}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
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
                    <div key={type.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div
                            className="w-4 h-4 rounded mt-1"
                            style={{ backgroundColor: type.color }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{type.name}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {type.default_duration} minutes
                            </div>
                            {type.description && (
                              <div className="text-sm text-gray-600 mt-2">
                                {type.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteType(type.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

          {/* Onglet Disponibilités */}
          {activeTab === 'availability' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Astuce :</strong> Définissez vos plages horaires disponibles pour chaque jour de la semaine. 
                  Ces créneaux seront proposés aux clients lors de la prise de rendez-vous.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Vos disponibilités hebdomadaires</h3>
                {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                  const dayAvailabilities = availabilities.filter(a => a.day_of_week === day);
                  return (
                    <div key={day} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-gray-900">{dayNames[day]}</div>
                        <button
                          onClick={() => {
                            setSelectedDay(day);
                            setShowAddSlotModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Ajouter un créneau
                        </button>
                      </div>
                      {dayAvailabilities.length > 0 ? (
                        <div className="space-y-2">
                          {dayAvailabilities.map((avail) => (
                            <div key={avail.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                              <span className="text-gray-700">
                                {avail.start_time.substring(0, 5)} - {avail.end_time.substring(0, 5)}
                              </span>
                              <button
                                onClick={() => handleDeleteSlot(avail.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">Non disponible</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'ajout de créneau */}
      {showAddSlotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Ajouter un créneau - {dayNames[selectedDay]}
              </h3>
              <button
                onClick={() => setShowAddSlotModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de début
                </label>
                <input
                  type="time"
                  value={newSlotStart}
                  onChange={(e) => setNewSlotStart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de fin
                </label>
                <input
                  type="time"
                  value={newSlotEnd}
                  onChange={(e) => setNewSlotEnd(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddSlotModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddSlot}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningSettingsPage;
