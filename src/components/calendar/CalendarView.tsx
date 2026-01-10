/**
 * Composant CalendarView
 * 
 * Affiche un calendrier mensuel avec les rendez-vous
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppointmentWithDetails } from '../../services/appointmentService';

interface CalendarViewProps {
  appointments: AppointmentWithDetails[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onAppointmentClick?: (appointment: AppointmentWithDetails) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  selectedDate,
  onDateSelect,
  onMonthChange,
  onAppointmentClick,
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  // Jours de la semaine
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Calculer les jours du mois
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    
    // Jours du mois précédent à afficher
    const prevMonthDays = firstDayOfWeek;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // Jours du mois suivant à afficher
    const totalCells = Math.ceil((daysCount + prevMonthDays) / 7) * 7;
    const nextMonthDays = totalCells - daysCount - prevMonthDays;
    
    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      appointments: AppointmentWithDetails[];
    }> = [];
    
    // Ajouter les jours du mois précédent
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        appointments: [],
      });
    }
    
    // Ajouter les jours du mois actuel
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 1; i <= daysCount; i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Filtrer les rendez-vous de ce jour
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.start_time).toISOString().split('T')[0];
        return aptDate === dateStr;
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
        appointments: dayAppointments,
      });
    }
    
    // Ajouter les jours du mois suivant
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        appointments: [],
      });
    }
    
    return days;
  }, [currentMonth, appointments, selectedDate]);

  // Navigation mois précédent
  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(newDate);
    onMonthChange(newDate);
  };

  // Navigation mois suivant
  const handleNextMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newDate);
    onMonthChange(newDate);
  };

  // Sélection d'une date
  const handleDateClick = (date: Date) => {
    onDateSelect(date);
  };

  // Format du mois/année
  const monthYearFormat = currentMonth.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900 capitalize">
          {monthYearFormat}
        </h2>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Grille du calendrier */}
      <div className="p-4">
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Jours du mois */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(day.date)}
              className={`
                relative min-h-[80px] p-2 rounded-lg border transition-all
                ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${day.isToday ? 'border-primary-500 border-2' : 'border-gray-200'}
                ${day.isSelected ? 'bg-primary-50 border-primary-500' : ''}
                ${day.isCurrentMonth ? 'hover:bg-gray-50' : 'hover:bg-gray-100'}
                ${day.appointments.length > 0 ? 'font-medium' : ''}
              `}
            >
              {/* Numéro du jour */}
              <div
                className={`
                  text-sm mb-1
                  ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${day.isToday ? 'text-primary-600 font-bold' : ''}
                `}
              >
                {day.date.getDate()}
              </div>

              {/* Indicateurs de rendez-vous */}
              {day.appointments.length > 0 && (
                <div className="space-y-1">
                  {day.appointments.slice(0, 2).map((apt) => (
                    <div
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick?.(apt);
                      }}
                      className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                      style={{
                        backgroundColor: apt.appointment_type?.color + '20',
                        color: apt.appointment_type?.color || '#3B82F6',
                      }}
                      title={apt.title}
                    >
                      {new Date(apt.start_time).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  ))}
                  {day.appointments.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{day.appointments.length - 2}
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
