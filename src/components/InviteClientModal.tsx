import React, { useState } from 'react';
import Button from './Button';
import Input from './Input';

interface InviteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: InviteClientData) => Promise<void>;
}

export interface InviteClientData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

/**
 * Modal d'invitation d'un nouveau client
 * Permet à un coach d'inviter un client par email
 * Le client recevra un email avec un lien pour définir son mot de passe
 */
const InviteClientModal: React.FC<InviteClientModalProps> = ({ isOpen, onClose, onInvite }) => {
  const [formData, setFormData] = useState<InviteClientData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onInvite(formData);
      // Réinitialiser le formulaire après succès
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite lors de l'envoi de l'invitation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
    });
    setError(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Inviter un nouveau client</h3>
            <p className="mt-1 text-sm text-gray-500">
              Le client recevra un email avec un lien pour créer son compte.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Input
                label="Prénom *"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Prénom du client"
                required
              />

              <Input
                label="Nom *"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Nom du client"
                required
              />

              <Input
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@exemple.com"
                required
              />

              <Input
                label="Téléphone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="06 12 34 56 78"
              />
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Envoi en cours...' : 'Envoyer l\'invitation'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteClientModal;
