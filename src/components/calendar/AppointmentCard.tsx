/**
 * Composant AppointmentCard
 * 
 * Affiche les détails d'un rendez-vous sous forme de carte
 */

import React from 'react';
import { Calendar, Clock, Video, Phone, MapPin, User, X } from 'lucide-react';
import { AppointmentWithDetails } from '../../services/appointmentService';

interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  onJoinMeeting?: (appointment: AppointmentWithDetails) => void;
  onCancel?: (appointment: AppointmentWithDetails) => void;
  onEdit?: (appointment: AppointmentWithDetails) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onJoinMeeting,
  onCancel,
  onEdit,
  showActions = true,
  compact = false,
}) => {
  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);
  const now = new Date();
  
  // Statut du rendez-vous
  const isUpcoming = startTime > now && appointment.status === 'scheduled';
  const isOngoing = startTime <= now && endTime >= now && appointment.status === 'scheduled';
  const isPast = endTime < now || appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled';

  // Icône du type de meeting
  const MeetingIcon = appointment.meeting_type === 'video' ? Video :
                       appointment.meeting_type === 'phone' ? Phone :
                       MapPin;

  // Couleur de statut
  const getStatusColor = () => {
    if (isCancelled) return 'bg-red-100 text-red-800 border-red-200';
    if (isOngoing) return 'bg-green-100 text-green-800 border-green-200';
    if (isUpcoming) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = () => {
    if (isCancelled) return 'Annulé';
    if (isOngoing) return 'En cours';
    if (isUpcoming) return 'À venir';
    return 'Terminé';
  };

  // Format compact
  if (compact) {
    return (
      <div
        className="p-3 rounded-lg border-l-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
        style={{ borderLeftColor: appointment.appointment_type?.color || '#3B82F6' }}
        onClick={() => onEdit?.(appointment)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{appointment.title}</h4>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex items-center gap-1">
                <MeetingIcon className="w-4 h-4" />
                {appointment.meeting_type === 'video' ? 'Visio' :
                 appointment.meeting_type === 'phone' ? 'Téléphone' : 'Présentiel'}
              </span>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
            {getStatusLabel()}
          </span>
        </div>
      </div>
    );
  }

  // Format complet
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* En-tête avec couleur du type */}
      <div
        className="h-2"
        style={{ backgroundColor: appointment.appointment_type?.color || '#3B82F6' }}
      />

      <div className="p-4">
        {/* Titre et statut */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {appointment.title}
            </h3>
            {appointment.appointment_type && (
              <span className="text-sm text-gray-600">
                {appointment.appointment_type.name}
              </span>
            )}
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor()}`}>
            {getStatusLabel()}
          </span>
        </div>

        {/* Informations */}
        <div className="space-y-2 mb-4">
          {/* Date et heure */}
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              {startTime.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              {startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {' '}
              ({appointment.appointment_type?.default_duration || 60} min)
            </span>
          </div>

          {/* Type de meeting */}
          <div className="flex items-center gap-2 text-gray-700">
            <MeetingIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              {appointment.meeting_type === 'video' && 'Visioconférence'}
              {appointment.meeting_type === 'phone' && 'Appel téléphonique'}
              {appointment.meeting_type === 'in_person' && 'Rendez-vous en présentiel'}
            </span>
          </div>

          {/* Client/Prospect */}
          <div className="flex items-center gap-2 text-gray-700">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              {appointment.client
                ? `${appointment.client.first_name} ${appointment.client.last_name}`
                : appointment.prospect_name}
            </span>
          </div>

          {/* Motif */}
          {appointment.appointment_reason && (
            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Motif :</span> {appointment.appointment_reason.label}
            </div>
          )}

          {/* Description */}
          {appointment.description && (
            <div className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-lg">
              {appointment.description}
            </div>
          )}

          {/* Raison d'annulation */}
          {isCancelled && appointment.cancellation_reason && (
            <div className="text-sm text-red-600 mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="font-medium">Raison de l'annulation :</span> {appointment.cancellation_reason}
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="text-sm text-gray-600 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="font-medium">Notes :</span> {appointment.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && !isCancelled && (
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            {/* Rejoindre la visio */}
            {appointment.meeting_type === 'video' && isOngoing && appointment.meeting_url && (
              <button
                onClick={() => onJoinMeeting?.(appointment)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                Rejoindre la visio
              </button>
            )}

            {/* Modifier */}
            {isUpcoming && onEdit && (
              <button
                onClick={() => onEdit(appointment)}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Modifier
              </button>
            )}

            {/* Annuler */}
            {isUpcoming && onCancel && (
              <button
                onClick={() => onCancel(appointment)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
