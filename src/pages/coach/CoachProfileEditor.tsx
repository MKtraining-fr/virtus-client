import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { supabase } from '../../lib/supabaseClient';
import { logger } from '../../utils/logger';
import { CoachProfile } from '../../types';

// Icons
const AcademicCapIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
    />
  </svg>
);

const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const CoachProfileEditor: React.FC = () => {
  const { user } = useAuth();

  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');
  const [publicUrl, setPublicUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [facebookProfile, setFacebookProfile] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Charger le profil existant
  useEffect(() => {
    const loadCoachProfile = async () => {
      if (!user || user.role !== 'coach') return;

      try {
        const { data, error } = await supabase
          .from('coach_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = pas de résultat trouvé (normal si premier accès)
          throw error;
        }

        if (data) {
          setBio(data.bio || '');
          setSpecialties(data.specialties || []);
          setExperienceYears(data.experience_years || '');
          setCertifications(data.certifications || []);
          setPublicUrl(data.public_url || '');
          setInstagramHandle(data.instagram_handle || '');
          setFacebookProfile(data.facebook_profile || '');
          setWebsiteUrl(data.website_url || '');
        }
      } catch (error: any) {
        logger.error('Erreur lors du chargement du profil coach', { error });
        setErrorMessage('Impossible de charger votre profil.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCoachProfile();
  }, [user]);

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter((s) => s !== specialty));
  };

  const handleAddCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (certification: string) => {
    setCertifications(certifications.filter((c) => c !== certification));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const profileData = {
        id: user.id,
        bio: bio.trim() || null,
        specialties: specialties.length > 0 ? specialties : null,
        experience_years: experienceYears || null,
        certifications: certifications.length > 0 ? certifications : null,
        public_url: publicUrl.trim() || null,
        instagram_handle: instagramHandle.trim() || null,
        facebook_profile: facebookProfile.trim() || null,
        website_url: websiteUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // Upsert (insert ou update)
      const { error } = await supabase.from('coach_profiles').upsert(profileData, {
        onConflict: 'id',
      });

      if (error) throw error;

      setSuccessMessage('Votre fiche coach a été enregistrée avec succès !');
      logger.info('Profil coach mis à jour avec succès', { userId: user.id });
    } catch (error: any) {
      logger.error('Erreur lors de la sauvegarde du profil coach', { error });
      setErrorMessage('Une erreur est survenue lors de la sauvegarde de votre fiche.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ma Fiche Coach</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Créez et personnalisez votre fiche de présentation professionnelle
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

      {/* Biographie */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Biographie</h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Présentez-vous, votre parcours, votre approche du coaching..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Spécialités */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Spécialités</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              placeholder="Ex: Perte de poids, Prise de masse..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialty()}
            />
            <Button onClick={handleAddSpecialty} className="whitespace-nowrap">
              Ajouter
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <span
                key={specialty}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-full text-sm"
              >
                {specialty}
                <button
                  onClick={() => handleRemoveSpecialty(specialty)}
                  className="hover:bg-primary-dark rounded-full p-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Expérience et Certifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <AcademicCapIcon className="w-6 h-6 mr-2" />
          Expérience et Certifications
        </h2>
        <div className="space-y-6">
          <Input
            label="Années d'expérience"
            type="number"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="Ex: 5"
            min="0"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Certifications et diplômes
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="Ex: BPJEPS, CQP, Licence STAPS..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddCertification()}
              />
              <Button onClick={handleAddCertification} className="whitespace-nowrap">
                Ajouter
              </Button>
            </div>
            <div className="space-y-2">
              {certifications.map((cert) => (
                <div
                  key={cert}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <span className="text-gray-900 dark:text-white">{cert}</span>
                  <button
                    onClick={() => handleRemoveCertification(cert)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Réseaux sociaux et web */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Présence en ligne
        </h2>
        <div className="space-y-4">
          <Input
            label="URL personnalisée (slug)"
            value={publicUrl}
            onChange={(e) => setPublicUrl(e.target.value)}
            placeholder="Ex: jean-dupont"
          />
          <Input
            label="Instagram"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
            placeholder="Votre pseudo Instagram (sans @)"
          />
          <Input
            label="Facebook"
            value={facebookProfile}
            onChange={(e) => setFacebookProfile(e.target.value)}
            placeholder="URL de votre profil Facebook"
            type="url"
          />
          <Input
            label="Site web"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://votre-site.com"
            type="url"
          />
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="bg-primary hover:bg-primary-dark px-8"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer ma fiche'}
        </Button>
      </div>
    </div>
  );
};

export default CoachProfileEditor;
