import React, { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import { ClientGeneralInfo, updateClientGeneralInfo } from '../../services/clientGeneralInfoService';
import Input from '../Input';
import Select from '../Select';

interface EditGeneralInfoModalProps {
  clientId: string;
  info: ClientGeneralInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (info: ClientGeneralInfo) => void;
}

export const EditGeneralInfoModal: React.FC<EditGeneralInfoModalProps> = ({
  clientId,
  info,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<ClientGeneralInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    sex: undefined,
    height: undefined,
    weight: undefined,
    energyExpenditureLevel: undefined,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (info) {
      setFormData({
        firstName: info.firstName || '',
        lastName: info.lastName || '',
        email: info.email || '',
        phone: info.phone || '',
        dob: info.dob || '',
        sex: info.sex || undefined,
        height: info.height || undefined,
        weight: info.weight || undefined,
        energyExpenditureLevel: info.energyExpenditureLevel || undefined,
      });
    }
  }, [info]);

  const handleChange = (field: keyof ClientGeneralInfo, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validation des champs obligatoires
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Le prénom, le nom et l\'email sont obligatoires.');
      setIsSaving(false);
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('L\'adresse email n\'est pas valide.');
      setIsSaving(false);
      return;
    }

    try {
      await updateClientGeneralInfo(clientId, formData);
      onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving general info:', err);
      setError('Erreur lors de la sauvegarde des informations générales');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Informations Générales
              </h3>
              <p className="text-sm text-gray-500">Modifier les informations du client</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Informations civiles */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Informations Civiles
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
              />
              <Input
                label="Nom"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />

            <Input
              label="Téléphone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date de Naissance"
                type="date"
                value={formData.dob || ''}
                onChange={(e) => handleChange('dob', e.target.value)}
              />
              <Select
                label="Sexe"
                value={formData.sex || ''}
                onChange={(value) => handleChange('sex', value as 'male' | 'female' | undefined)}
              >
                <option value="">-- Sélectionnez --</option>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
              </Select>
            </div>
          </div>

          {/* Informations physiques */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Informations Physiques
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Taille (cm)"
                type="number"
                value={formData.height || ''}
                onChange={(e) => handleChange('height', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 180"
              />
              <Input
                label="Poids (kg)"
                type="number"
                value={formData.weight || ''}
                onChange={(e) => handleChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 75"
              />
            </div>

            <Select
              label="Niveau d'Activité Physique"
              value={formData.energyExpenditureLevel || ''}
              onChange={(value) => handleChange('energyExpenditureLevel', value as ClientGeneralInfo['energyExpenditureLevel'])}
            >
              <option value="">-- Sélectionnez --</option>
              <option value="sedentary">Sédentaire</option>
              <option value="lightly_active">Légèrement actif</option>
              <option value="moderately_active">Modérément actif</option>
              <option value="very_active">Très actif</option>
              <option value="extremely_active">Extrêmement actif</option>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGeneralInfoModal;
