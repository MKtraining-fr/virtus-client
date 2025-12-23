import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { supabase } from '../../services/supabase';
import { logger } from '../../utils/logger';

// Icons
const UserCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
);

const PhotoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
    />
  </svg>
);

const AccountSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccessMessage('Vos informations ont été mises à jour avec succès !');
      logger.info('Profil mis à jour avec succès', { userId: user.id });

      // Rafraîchir les données utilisateur
      window.location.reload();
    } catch (error: any) {
      logger.error('Erreur lors de la mise à jour du profil', { error });
      setErrorMessage('Une erreur est survenue lors de la mise à jour de vos informations.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Veuillez sélectionner une image valide.');
      return;
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('L\'image ne doit pas dépasser 5 Mo.');
      return;
    }

    setIsUploadingAvatar(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Upload vers Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'virtus_avatars'); // À configurer dans Cloudinary
      formData.append('folder', 'avatars');

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;

      const uploadResponse = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Erreur lors de l\'upload sur Cloudinary');
      }

      const uploadData = await uploadResponse.json();
      const avatarUrl = uploadData.secure_url;

      // Mettre à jour l'avatar dans Supabase
      const { error } = await supabase
        .from('clients')
        .update({
          avatar: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccessMessage('Votre photo de profil a été mise à jour avec succès !');
      logger.info('Avatar mis à jour avec succès', { userId: user.id, avatarUrl });

      // Rafraîchir les données utilisateur
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      logger.error('Erreur lors de l\'upload de l\'avatar', { error });
      setErrorMessage('Une erreur est survenue lors de l\'upload de votre photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const hasChanges =
    firstName !== user?.firstName || lastName !== user?.lastName || phone !== user?.phone;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-client-light">Mon Compte</h1>
        <p className="mt-2 text-gray-600 dark:text-client-subtle">
          Gérez vos informations personnelles et votre photo de profil
        </p>
      </div>

      {/* Messages de succès/erreur */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Photo de profil */}
      <div className="bg-white dark:bg-client-card rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-client-light mb-4 flex items-center">
          <PhotoIcon className="w-6 h-6 mr-2" />
          Photo de profil
        </h2>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={user?.avatar || `https://i.pravatar.cc/150?u=${user?.id}`}
              alt={`${user?.firstName} ${user?.lastName}`}
              className="w-32 h-32 rounded-full object-cover border-4 border-primary"
            />
            {isUploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-client-subtle mb-4">
              Choisissez une photo professionnelle qui vous représente. Format JPG ou PNG, max 5 Mo.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="bg-primary hover:bg-primary-dark"
            >
              {isUploadingAvatar ? 'Upload en cours...' : 'Changer ma photo'}
            </Button>
          </div>
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="bg-white dark:bg-client-card rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-client-light mb-4 flex items-center">
          <UserCircleIcon className="w-6 h-6 mr-2" />
          Informations personnelles
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Votre prénom"
            />
            <Input
              label="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Votre nom"
            />
          </div>
          <Input
            label="Email"
            value={user?.email || ''}
            disabled
            className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
          />
          <Input
            label="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Votre numéro de téléphone"
            type="tel"
          />
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveProfile}
              disabled={!hasChanges || isSaving}
              className="bg-primary hover:bg-primary-dark"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
      </div>

      {/* Sécurité */}
      <div className="bg-white dark:bg-client-card rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-client-light mb-4">
          Sécurité
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-client-subtle mb-4">
              Modifiez votre mot de passe pour sécuriser votre compte.
            </p>
            <Button
              onClick={() => setIsPasswordModalOpen(true)}
              variant="outline"
              className="border-gray-300 dark:border-gray-600"
            >
              Changer mon mot de passe
            </Button>
          </div>
        </div>
      </div>

      {/* Déconnexion */}
      <div className="bg-white dark:bg-client-card rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-client-light mb-4">
          Déconnexion
        </h2>
        <div>
          <p className="text-sm text-gray-600 dark:text-client-subtle mb-4">
            Vous serez redirigé vers la page de connexion.
          </p>
          <Button onClick={logout} className="bg-red-600 hover:bg-red-700">
            Se déconnecter
          </Button>
        </div>
      </div>

      {/* Modal de changement de mot de passe */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default AccountSettings;
