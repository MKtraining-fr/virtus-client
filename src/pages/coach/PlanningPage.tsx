/**
 * Page Planning Coach
 * 
 * Permet au coach de gérer ses rendez-vous :
 * - Voir le calendrier avec tous les rendez-vous
 * - Créer un nouveau rendez-vous (client ou prospect)
 * - Modifier/Annuler un rendez-vous
 * - Rejoindre une visio
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar as CalendarIcon, List, Filter, Loader2, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CalendarView, AppointmentCard } from '../../components/calendar';
import { SimpleCreateAppointmentModal } from '../../components/coach/SimpleCreateAppointmentModal';
import { AppointmentDetailsModal } from '../../components/coach/AppointmentDetailsModal';
import {
  getCoachAppointments,
  AppointmentWithDetails,
  cancelAppointment,
  getMeetingToken,
} from '../../services/appointmentService';
import { ensurePlanningInitialized } from '../../services/planningInitService';
import { toast } from 'react-hot-toast';

type ViewMode = 'calendar' | 'list';
type FilterStatus = 'all' | 'scheduled' | 'completed' | 'cancelled';

const PlanningPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Charger les rendez-vous et initialiser la configuration
  useEffect(() => {
    if (user?.id) {
      // Initialiser la configuration par défaut si nécessaire
      ensurePlanningInitialized(user.id).then(() => {
        loadAppointments();
      }).catch(error => {
        console.error('Erreur initialisation planning:', error);
        loadAppointments(); // Charger quand même les RDV
      });
    }
  }, [user]);

  // Filtrer les rendez-vous
  useEffect(() => {
    filterAppointments();
  }, [appointments, filterStatus, selectedDate, viewMode]);

  const loadAppointments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getCoachAppointments(user.id);
      setAppointments(data);
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
      toast.error('Impossible de charger les rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filtrer par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    // En mode liste, filtrer par date sélectionnée
    if (viewMode === 'list') {
      const dateStr = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.start_time).toISOString().split('T')[0];
        return aptDate === dateStr;
      });
    }

    setFilteredAppointments(filtered);
  };

  const handleCreateAppointment = () => {
    setShowCreateModal(true);
  };

  const handleAppointmentCreated = () => {
    setShowCreateModal(false);
    loadAppointments();
    toast.success('Rendez-vous créé avec succès !');
  };

  const handleAppointmentClick = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleJoinMeeting = async (appointment: AppointmentWithDetails) => {
    if (!user || !appointment.meeting_url) return;

    try {
      // Générer un token pour rejoindre la visio
      const userName = `${user.first_name} ${user.last_name}`;
      const meetingUrl = await getMeetingToken(appointment.id, user.id, userName);
      
      // Ouvrir la visio dans un nouvel onglet
      window.open(meetingUrl, '_blank');
      toast.success('Ouverture de la visioconférence...');
    } catch (error) {
      console.error('Erreur accès visio:', error);
      toast.error('Impossible de rejoindre la visioconférence');
    }
  };

  const handleCancelAppointment = async (appointment: AppointmentWithDetails) => {
    if (!user?.id) return;

    const reason = prompt('Raison de l\'annulation (optionnel) :');
    if (reason === null) return; // Annulation du prompt

    try {
      await cancelAppointment(appointment.id, user.id, reason || undefined);
      toast.success('Rendez-vous annulé');
      loadAppointments();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast.error('Impossible d\'annuler le rendez-vous');
    }
  };

  const handleEditAppointment = (appointment: AppointmentWithDetails) => {
    // TODO: Implémenter la modification
    toast('Fonctionnalité de modification à venir', { icon: '🚧' });
  };

  // Statistiques
  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  // Rendez-vous du jour sélectionné
  const todayAppointments = appointments.filter(apt => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const aptDate = new Date(apt.start_time).toISOString().split('T')[0];
    return aptDate === dateStr && apt.status === 'scheduled';
  });

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
            <p className="text-gray-600 mt-1">
              Gérez vos rendez-vous avec vos clients et prospects
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/app/planning/parametres')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Paramètres
            </button>
            <button
              onClick={handleCreateAppointment}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouveau rendez-vous
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-900">{stats.scheduled}</div>
            <div className="text-sm text-green-700">À venir</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
            <div className="text-sm text-gray-700">Terminés</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-900">{stats.cancelled}</div>
            <div className="text-sm text-red-700">Annulés</div>
          </div>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Mode d'affichage */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendrier
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
              Liste
            </button>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous les rendez-vous</option>
              <option value="scheduled">À venir</option>
              <option value="completed">Terminés</option>
              <option value="cancelled">Annulés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {viewMode === 'calendar' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendrier */}
              <div className="lg:col-span-2">
                <CalendarView
                  appointments={filteredAppointments}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  onMonthChange={setSelectedDate}
                  onAppointmentClick={handleAppointmentClick}
                />
              </div>

              {/* Rendez-vous du jour */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {selectedDate.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h3>

                  {todayAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Aucun rendez-vous ce jour</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayAppointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          compact
                          onJoinMeeting={handleJoinMeeting}
                          onCancel={handleCancelAppointment}
                          onEdit={handleEditAppointment}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Rendez-vous du{' '}
                {selectedDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>

              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">Aucun rendez-vous trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onJoinMeeting={handleJoinMeeting}
                      onCancel={handleCancelAppointment}
                      onEdit={handleEditAppointment}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showCreateModal && (
        <SimpleCreateAppointmentModal
          coachId={user!.id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleAppointmentCreated}
        />
      )}

      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          }}
          onJoinMeeting={handleJoinMeeting}
          onCancel={handleCancelAppointment}
          onEdit={handleEditAppointment}
        />
      )}
    </div>
  );
};

export default PlanningPage;
