/**
 * Modale de détails de rendez-vous
 * 
 * Affiche les détails complets d'un rendez-vous avec actions
 */

import React from 'react';
import { X } from 'lucide-react';
import { AppointmentCard } from '../calendar';
import { AppointmentWithDetails } from '../../services/appointmentService';

interface AppointmentDetailsModalProps {
  appointment: AppointmentWithDetails;
  onClose: () => void;
  onJoinMeeting?: (appointment: AppointmentWithDetails) => void;
  onCancel?: (appointment: AppointmentWithDetails) => void;
  onEdit?: (appointment: AppointmentWithDetails) => void;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  onClose,
  onJoinMeeting,
  onCancel,
  onEdit,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Détails du rendez-vous</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-auto p-6">
          <AppointmentCard
            appointment={appointment}
            onJoinMeeting={onJoinMeeting}
            onCancel={onCancel}
            onEdit={onEdit}
            showActions={true}
          />
        </div>

        {/* Pied de page */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
