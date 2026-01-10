/**
 * Section Planning Client
 * 
 * Affiche les rendez-vous du client dans son profil
 * Permet de prendre un nouveau rendez-vous
 */

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp, Plus, Loader2, Video } from 'lucide-react';
import { AppointmentCard, CalendarView, TimeSlotPicker } from '../calendar';
import {
  getClientAppointments,
  createAppointment,
  cancelAppointment,
  getMeetingToken,
  AppointmentWithDetails,
  CreateAppointmentParams,
} from '../../services/appointmentService';
import {
  getAppointmentTypes,
  getAppointmentReasons,
  AppointmentType,
  AppointmentReason,
} from '../../services/appointmentConfigService';
import { TimeSlot } from '../../services/availabilityService';
import { toast } from 'react-hot-toast';

interface ClientPlanningSectionProps {
  clientId: string;
  coachId: string;
}

type MeetingType = 'video' | 'phone' | 'in_person';

export const ClientPlanningSection: React.FC<ClientPlanningSectionProps> = ({
  clientId,
  coachId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Réservation
  const [showBooking, setShowBooking] = useState(false);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [appointmentReasons, setAppointmentReasons] = useState<AppointmentReason[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [selectedReasonId, setSelectedReasonId] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('video');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      loadAppointments();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (showBooking) {
      loadConfig();
    }
  }, [showBooking]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getClientAppointments(clientId);
      setAppointments(data);
    } catch (error) {
      console.error('Erreur chargement RDV:', error);
      toast.error('Impossible de charger les rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const [types, reasons] = await Promise.all([
        getAppointmentTypes(coachId),
        getAppointmentReasons(coachId),
      ]);
      setAppointmentTypes(types);
      setAppointmentReasons(reasons);
      if (types.length > 0) {
        setSelectedTypeId(types[0].id);
      }
    } catch (error) {
      console.error('Erreur chargement configuration:', error);
      toast.error('Impossible de charger la configuration');
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedTypeId || !selectedSlot) {
      toast.error('Veuillez sélectionner un type et un créneau');
      return;
    }

    try {
      setSubmitting(true);
      
      const selectedType = appointmentTypes.find(t => t.id === selectedTypeId);
      const params: CreateAppointmentParams = {
        coach_id: coachId,
        client_id: clientId,
        appointment_type_id: selectedTypeId,
        appointment_reason_id: selectedReasonId || undefined,
        title: `${selectedType?.name} - Rendez-vous client`,
        description: description.trim() || undefined,
        start_time: selectedSlot.start.toISOString(),
        end_time: selectedSlot.end.toISOString(),
        meeting_type: meetingType,
      };

      await createAppointment(params);
      toast.success('Rendez-vous réservé avec succès !');
      setShowBooking(false);
      setDescription('');
      setSelectedSlot(null);
      loadAppointments();
    } catch (error) {
      console.error('Erreur réservation:', error);
      toast.error('Impossible de réserver le rendez-vous');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinMeeting = async (appointment: AppointmentWithDetails) => {
    try {
      // TODO: Récupérer le nom du client
      const meetingUrl = await getMeetingToken(appointment.id, clientId, 'Client');
      window.open(meetingUrl, '_blank');
      toast.success('Ouverture de la visioconférence...');
    } catch (error) {
      console.error('Erreur accès visio:', error);
      toast.error('Impossible de rejoindre la visioconférence');
    }
  };

  const handleCancelAppointment = async (appointment: AppointmentWithDetails) => {
    const reason = prompt('Raison de l\'annulation (optionnel) :');
    if (reason === null) return;

    try {
      await cancelAppointment(appointment.id, clientId, reason || undefined);
      toast.success('Rendez-vous annulé');
      loadAppointments();
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast.error('Impossible d\'annuler le rendez-vous');
    }
  };

  const upcomingAppointments = appointments.filter(a => 
    a.status === 'scheduled' && new Date(a.start_time) >= new Date()
  );

  const selectedType = appointmentTypes.find(t => t.id === selectedTypeId);
  const duration = selectedType?.default_duration || 60;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* En-tête */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary-600" />
          <div className="text-left">
            <div className="font-semibold text-gray-900">Planning</div>
            <div className="text-sm text-gray-600">
              {upcomingAppointments.length} rendez-vous à venir
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Contenu */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
            </div>
          ) : showBooking ? (
            /* Formulaire de réservation */
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Prendre un rendez-vous
                </h3>
                <button
                  onClick={() => setShowBooking(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Annuler
                </button>
              </div>

              {/* Type de RDV */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de rendez-vous *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {appointmentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedTypeId(type.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedTypeId === type.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full mb-1"
                        style={{ backgroundColor: type.color }}
                      />
                      <div className="font-medium text-gray-900 text-sm">{type.name}</div>
                      <div className="text-xs text-gray-600">{type.default_duration} min</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Motif */}
              {appointmentReasons.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif (optionnel)
                  </label>
                  <select
                    value={selectedReasonId}
                    onChange={(e) => setSelectedReasonId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Aucun motif --</option>
                    {appointmentReasons.map((reason) => (
                      <option key={reason.id} value={reason.id}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Type de meeting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de meeting *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setMeetingType('video')}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      meetingType === 'video'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Video className="w-5 h-5 mx-auto mb-1 text-primary-600" />
                    <div className="text-xs font-medium text-gray-900">Visio</div>
                  </button>
                  <button
                    onClick={() => setMeetingType('phone')}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      meetingType === 'phone'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-900">Téléphone</div>
                  </button>
                  <button
                    onClick={() => setMeetingType('in_person')}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      meetingType === 'in_person'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-900">Présentiel</div>
                  </button>
                </div>
              </div>

              {/* Sélection date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner une date
                </label>
                <CalendarView
                  appointments={[]}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  onMonthChange={setSelectedDate}
                />
              </div>

              {/* Sélection créneau */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un créneau
                </label>
                <TimeSlotPicker
                  coachId={coachId}
                  selectedDate={selectedDate}
                  duration={duration}
                  selectedSlot={selectedSlot || undefined}
                  onSlotSelect={setSelectedSlot}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message pour votre coach (optionnel)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ajoutez des informations complémentaires..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Bouton de réservation */}
              <button
                onClick={handleBookAppointment}
                disabled={submitting || !selectedSlot}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Réservation...
                  </>
                ) : (
                  'Réserver ce rendez-vous'
                )}
              </button>
            </div>
          ) : (
            /* Liste des rendez-vous */
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Mes rendez-vous</h3>
                <button
                  onClick={() => setShowBooking(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Prendre RDV
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-600 mb-4">Aucun rendez-vous</p>
                  <button
                    onClick={() => setShowBooking(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Prendre un rendez-vous
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      compact
                      onJoinMeeting={handleJoinMeeting}
                      onCancel={handleCancelAppointment}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
