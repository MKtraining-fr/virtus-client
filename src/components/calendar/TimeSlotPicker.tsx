/**
 * Composant TimeSlotPicker
 * 
 * Permet de sélectionner un créneau horaire disponible
 */

import React, { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { TimeSlot, getAvailableSlots } from '../../services/availabilityService';

interface TimeSlotPickerProps {
  coachId: string;
  selectedDate: Date;
  duration: number;
  selectedSlot?: TimeSlot;
  onSlotSelect: (slot: TimeSlot) => void;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  coachId,
  selectedDate,
  duration,
  selectedSlot,
  onSlotSelect,
}) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les créneaux disponibles
  useEffect(() => {
    loadSlots();
  }, [coachId, selectedDate, duration]);

  const loadSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateStr = selectedDate.toISOString().split('T')[0];
      const availableSlots = await getAvailableSlots(coachId, dateStr, duration);

      // Ne garder que les créneaux disponibles
      const filteredSlots = availableSlots.filter(slot => slot.available);

      setSlots(filteredSlots);
    } catch (err) {
      console.error('Erreur chargement créneaux:', err);
      setError('Impossible de charger les créneaux disponibles');
    } finally {
      setLoading(false);
    }
  };

  // Grouper les créneaux par période de la journée
  const groupedSlots = React.useMemo(() => {
    const groups = {
      morning: [] as TimeSlot[],
      afternoon: [] as TimeSlot[],
      evening: [] as TimeSlot[],
    };

    slots.forEach(slot => {
      const hour = slot.start.getHours();
      if (hour < 12) {
        groups.morning.push(slot);
      } else if (hour < 18) {
        groups.afternoon.push(slot);
      } else {
        groups.evening.push(slot);
      }
    });

    return groups;
  }, [slots]);

  // Formater l'heure
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Vérifier si un créneau est sélectionné
  const isSelected = (slot: TimeSlot) => {
    return selectedSlot?.start.getTime() === slot.start.getTime();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        <span className="ml-2 text-gray-600">Chargement des créneaux...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadSlots}
          className="mt-2 text-primary-600 hover:text-primary-700 underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Aucun créneau disponible pour cette date</p>
        <p className="text-sm text-gray-500 mt-1">
          Veuillez sélectionner une autre date
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Matin */}
      {groupedSlots.morning.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Matin</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {groupedSlots.morning.map((slot, index) => (
              <button
                key={index}
                onClick={() => onSlotSelect(slot)}
                className={`
                  px-3 py-2 rounded-lg border text-sm font-medium transition-all
                  ${isSelected(slot)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                  }
                `}
              >
                {formatTime(slot.start)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Après-midi */}
      {groupedSlots.afternoon.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Après-midi</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {groupedSlots.afternoon.map((slot, index) => (
              <button
                key={index}
                onClick={() => onSlotSelect(slot)}
                className={`
                  px-3 py-2 rounded-lg border text-sm font-medium transition-all
                  ${isSelected(slot)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                  }
                `}
              >
                {formatTime(slot.start)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Soir */}
      {groupedSlots.evening.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Soir</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {groupedSlots.evening.map((slot, index) => (
              <button
                key={index}
                onClick={() => onSlotSelect(slot)}
                className={`
                  px-3 py-2 rounded-lg border text-sm font-medium transition-all
                  ${isSelected(slot)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                  }
                `}
              >
                {formatTime(slot.start)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Résumé */}
      {selectedSlot && (
        <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm text-primary-900">
            <span className="font-medium">Créneau sélectionné :</span>{' '}
            {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
          </p>
        </div>
      )}
    </div>
  );
};
