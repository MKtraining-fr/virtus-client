/**
 * Modale simplifiée de création de rendez-vous
 * 
 * Version simple et directe pour créer un RDV rapidement
 */

import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Clock, User } from 'lucide-react';
import { createAppointment } from '../../services/appointmentService';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';

interface SimpleCreateAppointmentModalProps {
  coachId: string;
  clientId?: string;
  initialDate?: Date;
  onClose: () => void;
  onSuccess: () => void;
}

export const SimpleCreateAppointmentModal: React.FC<SimpleCreateAppointmentModalProps> = ({
  coachId,
  clientId,
  initialDate,
  onClose,
  onSuccess,
}) => {
  const [selectedClientId, setSelectedClientId] = useState(clientId || '');
  const [clients, setClients] = useState<Array<{ id: string; full_name: string }>>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : '');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<'video' | 'phone' | 'in_person'>('video');
  const [submitting, setSubmitting] = useState(false);

  // Charger les clients du coach
  useEffect(() => {
    loadClients();
  }, [coachId]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name')
        .eq('coach_id', coachId)
        .eq('role', 'client')
        .order('full_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      toast.error('Impossible de charger les clients');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !date || !time || !description.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!selectedClientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    try {
      setSubmitting(true);

      // Construire la date/heure de début
      const startDateTime = new Date(`${date}T${time}`);
      
      // Calculer la date/heure de fin
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(duration));

      await createAppointment({
        coach_id: coachId,
        client_id: selectedClientId,
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        meeting_type: meetingType,
        status: 'scheduled',
      });

      toast.success('Rendez-vous créé avec succès !');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur création RDV:', error);
      toast.error('Impossible de créer le rendez-vous');
    } finally {
      setSubmitting(false);
    }
  };

  // Date minimum = aujourd'hui
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Nouveau rendez-vous</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sélection du client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Client *
            </label>
            {loadingClients ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                Aucun client trouvé. Ajoutez d'abord des clients à votre liste.
              </div>
            ) : (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sélectionnez un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre du rendez-vous *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Séance de coaching"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Date et heure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Heure *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Durée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée (minutes) *
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 heure</option>
              <option value="90">1h30</option>
              <option value="120">2 heures</option>
            </select>
          </div>

          {/* Type de meeting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de rendez-vous *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMeetingType('video')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  meetingType === 'video'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 text-primary-600">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium">Visioconférence</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMeetingType('phone')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  meetingType === 'phone'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 text-primary-600">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium">Téléphone</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMeetingType('in_person')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  meetingType === 'in_person'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 text-primary-600">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium">En personne</div>
                </div>
              </button>
            </div>
          </div>

          {/* Détails */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Détails du rendez-vous *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'objet du rendez-vous (visible par le client)..."
              rows={3}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ces détails seront visibles par le client dans son planning
            </p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
          </div>
        </form>
      </div>
    </div>
  );
};
