/**
 * Modale de création de rendez-vous
 * 
 * Permet au coach de créer un rendez-vous avec :
 * - Un client existant OU un prospect (email + nom)
 * - Type de rendez-vous
 * - Motif
 * - Date et heure (sélection de créneau)
 * - Type de meeting (visio/téléphone/présentiel)
 */

import React, { useState, useEffect } from 'react';
import { X, User, Users, Video, Phone, MapPin, Loader2 } from 'lucide-react';
import { CalendarView, TimeSlotPicker } from '../calendar';
import {
  createAppointment,
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

interface CreateAppointmentModalProps {
  coachId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ParticipantType = 'client' | 'prospect';
type MeetingType = 'video' | 'phone' | 'in_person';

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  coachId,
  onClose,
  onSuccess,
}) => {
  // États du formulaire
  const [step, setStep] = useState(1); // 1: Participant, 2: Type & Motif, 3: Date & Heure, 4: Détails
  const [participantType, setParticipantType] = useState<ParticipantType>('client');
  const [clientId, setClientId] = useState('');
  const [prospectName, setProspectName] = useState('');
  const [prospectEmail, setProspectEmail] = useState('');
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [appointmentReasonId, setAppointmentReasonId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [meetingType, setMeetingType] = useState<MeetingType>('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Configuration
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [appointmentReasons, setAppointmentReasons] = useState<AppointmentReason[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Charger la configuration
  useEffect(() => {
    loadConfig();
  }, [coachId]);

  // Mettre à jour le titre automatiquement
  useEffect(() => {
    if (appointmentTypeId) {
      const type = appointmentTypes.find(t => t.id === appointmentTypeId);
      if (type) {
        const participant = participantType === 'client' ? 'Client' : prospectName || 'Prospect';
        setTitle(`${type.name} - ${participant}`);
      }
    }
  }, [appointmentTypeId, participantType, prospectName, appointmentTypes]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const [types, reasons] = await Promise.all([
        getAppointmentTypes(coachId),
        getAppointmentReasons(coachId),
      ]);
      setAppointmentTypes(types);
      setAppointmentReasons(reasons);

      // Sélectionner le premier type par défaut
      if (types.length > 0) {
        setAppointmentTypeId(types[0].id);
      }
    } catch (error) {
      console.error('Erreur chargement configuration:', error);
      toast.error('Impossible de charger la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (participantType === 'client' && !clientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    if (participantType === 'prospect' && (!prospectName || !prospectEmail)) {
      toast.error('Veuillez renseigner le nom et l\'email du prospect');
      return;
    }
    if (!appointmentTypeId) {
      toast.error('Veuillez sélectionner un type de rendez-vous');
      return;
    }
    if (!selectedSlot) {
      toast.error('Veuillez sélectionner un créneau horaire');
      return;
    }
    if (!title.trim()) {
      toast.error('Veuillez renseigner un titre');
      return;
    }

    try {
      setSubmitting(true);

      const params: CreateAppointmentParams = {
        coach_id: coachId,
        appointment_type_id: appointmentTypeId,
        appointment_reason_id: appointmentReasonId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: selectedSlot.start.toISOString(),
        end_time: selectedSlot.end.toISOString(),
        meeting_type: meetingType,
      };

      if (participantType === 'client') {
        params.client_id = clientId;
      } else {
        params.prospect_name = prospectName.trim();
        params.prospect_email = prospectEmail.trim();
      }

      await createAppointment(params);
      onSuccess();
    } catch (error) {
      console.error('Erreur création rendez-vous:', error);
      toast.error('Impossible de créer le rendez-vous');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = appointmentTypes.find(t => t.id === appointmentTypeId);
  const duration = selectedType?.default_duration || 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Nouveau rendez-vous</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 border-b border-gray-200">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step
                    ? 'bg-primary-600 text-white'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 mx-1 ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Étape 1 : Participant */}
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Avec qui est ce rendez-vous ?
                  </h3>

                  {/* Type de participant */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setParticipantType('client')}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        participantType === 'client'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <User className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                      <div className="font-medium text-gray-900">Client existant</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Sélectionnez un client de votre liste
                      </div>
                    </button>

                    <button
                      onClick={() => setParticipantType('prospect')}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        participantType === 'prospect'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                      <div className="font-medium text-gray-900">Prospect</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Nouveau contact non encore client
                      </div>
                    </button>
                  </div>

                  {/* Formulaire selon le type */}
                  {participantType === 'client' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sélectionner un client
                      </label>
                      <select
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">-- Choisir un client --</option>
                        {/* TODO: Charger la liste des clients */}
                        <option value="client-1">Client 1</option>
                        <option value="client-2">Client 2</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom du prospect *
                        </label>
                        <input
                          type="text"
                          value={prospectName}
                          onChange={(e) => setProspectName(e.target.value)}
                          placeholder="Jean Dupont"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email du prospect *
                        </label>
                        <input
                          type="email"
                          value={prospectEmail}
                          onChange={(e) => setProspectEmail(e.target.value)}
                          placeholder="jean.dupont@example.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Étape 2 : Type & Motif */}
              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Type et motif du rendez-vous
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de rendez-vous *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {appointmentTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setAppointmentTypeId(type.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            appointmentTypeId === type.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full mb-2"
                            style={{ backgroundColor: type.color }}
                          />
                          <div className="font-medium text-gray-900">{type.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {type.default_duration} minutes
                          </div>
                          {type.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {type.description}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motif (optionnel)
                    </label>
                    <select
                      value={appointmentReasonId}
                      onChange={(e) => setAppointmentReasonId(e.target.value)}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de meeting *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setMeetingType('video')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          meetingType === 'video'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Video className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                        <div className="text-sm font-medium text-gray-900">Visio</div>
                      </button>
                      <button
                        onClick={() => setMeetingType('phone')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          meetingType === 'phone'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Phone className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                        <div className="text-sm font-medium text-gray-900">Téléphone</div>
                      </button>
                      <button
                        onClick={() => setMeetingType('in_person')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          meetingType === 'in_person'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <MapPin className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                        <div className="text-sm font-medium text-gray-900">Présentiel</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 3 : Date & Heure */}
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Date et heure du rendez-vous
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calendrier */}
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

                    {/* Créneaux */}
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
                  </div>
                </div>
              )}

              {/* Étape 4 : Détails */}
              {step === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Détails du rendez-vous
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre du rendez-vous *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Consultation initiale - Jean Dupont"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optionnel)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ajoutez des notes ou des informations complémentaires..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Résumé */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Résumé</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Participant :</span>
                        <span className="font-medium text-gray-900">
                          {participantType === 'client' ? 'Client' : prospectName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type :</span>
                        <span className="font-medium text-gray-900">
                          {selectedType?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date :</span>
                        <span className="font-medium text-gray-900">
                          {selectedDate.toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {selectedSlot && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Heure :</span>
                          <span className="font-medium text-gray-900">
                            {selectedSlot.start.toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {selectedSlot.end.toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Meeting :</span>
                        <span className="font-medium text-gray-900">
                          {meetingType === 'video' && 'Visioconférence'}
                          {meetingType === 'phone' && 'Téléphone'}
                          {meetingType === 'in_person' && 'Présentiel'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pied de page */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={submitting}
          >
            {step === 1 ? 'Annuler' : 'Précédent'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              disabled={loading}
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le rendez-vous'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
