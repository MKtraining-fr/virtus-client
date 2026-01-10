/**
 * Widget Rendez-vous du jour
 * 
 * Affiche les rendez-vous du jour sur le dashboard coach
 * - Bouton vert si RDV aujourd'hui
 * - Bouton gris si pas de RDV
 * - Dépliable pour voir le calendrier
 */

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CalendarView, AppointmentCard } from '../calendar';
import {
  getAppointmentsForDate,
  AppointmentWithDetails,
} from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';

export const TodayAppointmentsWidget: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (user?.id) {
      loadTodayAppointments();
    }
  }, [user]);

  const loadTodayAppointments = async () => {
    if (!user?.id) return;

    try {
      setLoading(false);
      const today = new Date().toISOString().split('T')[0];
      const appointments = await getAppointmentsForDate(user.id, 'coach', today);
      setTodayAppointments(appointments.filter(a => a.status === 'scheduled'));
    } catch (error) {
      console.error('Erreur chargement RDV:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAppointmentsToday = todayAppointments.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* En-tête cliquable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-4 flex items-center justify-between transition-colors ${
          hasAppointmentsToday
            ? 'bg-green-50 hover:bg-green-100 border-l-4 border-green-500'
            : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              hasAppointmentsToday ? 'bg-green-500' : 'bg-gray-400'
            }`}
          >
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900">
              Rendez-vous du jour
            </div>
            <div className="text-sm text-gray-600">
              {loading ? (
                'Chargement...'
              ) : hasAppointmentsToday ? (
                `${todayAppointments.length} rendez-vous prévu${todayAppointments.length > 1 ? 's' : ''}`
              ) : (
                'Aucun rendez-vous aujourd\'hui'
              )}
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Contenu dépliable */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
            </div>
          ) : hasAppointmentsToday ? (
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  compact
                  showActions={false}
                />
              ))}
              <button
                onClick={() => navigate('/app/planning')}
                className="w-full mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                Voir tout le planning
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-600 mb-4">Aucun rendez-vous aujourd'hui</p>
              <button
                onClick={() => navigate('/app/planning')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                Créer un rendez-vous
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
