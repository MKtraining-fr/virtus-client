import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Measurement,
  NutritionLogEntry,
  Client,
  SharedFile,
  DataPoint,
  BilanTemplate,
  BilanResult,
} from '../../types';
import ClientAccordion from '../../components/client/ClientAccordion';
import { Measurement as MeasurementType } from '../../types';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import MeasurementsLineChart from '../../components/charts/MeasurementsLineChart';
import BilanSection from '../../components/BilanSection';
import { PerformanceSection } from '../../components/performance/PerformanceSection';
import AccountSettingsModal from '../../components/AccountSettingsModal';
import { supabase } from '../../services/supabase';
import { useDataStore } from '../../stores/useDataStore';
import BodyMapModal from '../../components/coach/BodyMapModal';
import { InjuryData } from '../../types';
import { 
  getClientInjuries, 
  createMultipleInjuries, 
  deleteInjury,
  ClientInjury,
  CreateInjuryData,
  INJURY_TYPE_LABELS,
  INJURY_SEVERITY_LABELS,
  INJURY_STATUS_LABELS,
  INJURY_SEVERITY_COLORS
} from '../../services/injuryService';
import { getMuscleById } from '../../data/muscleConfig';
import { HeartPulse, User } from 'lucide-react';
import { ClientMeasurementsSection } from '../../components/client/ClientMeasurementsSection';
import {
  uploadClientDocument,
  getClientPhotos,
  getClientFiles,
  deleteClientDocument,
  uploadMultiplePhotos,
  ClientDocument as SupabaseClientDocument
} from '../../services/clientDocumentService';

// Type pour les documents Supabase
interface ClientDocument {
  id: string;
  client_id: string;
  coach_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: 'medical' | 'identity' | 'contract' | 'progress' | 'nutrition' | 'other';
  description: string | null;
  uploaded_by: string;
  created_at: string;
}

// Catégories de documents
const DOCUMENT_CATEGORIES = [
  { value: 'medical', label: 'Médical' },
  { value: 'identity', label: 'Identité' },
  { value: 'contract', label: 'Contrat' },
  { value: 'progress', label: 'Progression' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'other', label: 'Autre' },
];

// Traduction du niveau d'activité
const translateActivityLevel = (level: string | undefined): string => {
  if (!level) return 'Non défini';
  const translations: Record<string, string> = {
    'sedentary': 'Sédentaire',
    'lightly_active': 'Légèrement actif',
    'moderately_active': 'Modérément actif',
    'very_active': 'Très actif',
    'extra_active': 'Extrêmement actif',
  };
  return translations[level] || level;
};

// Traduction du sexe
const translateSex = (sex: string | undefined): string => {
  if (!sex) return 'Non défini';
  const translations: Record<string, string> = {
    'male': 'Homme',
    'female': 'Femme',
    'Homme': 'Homme',
    'Femme': 'Femme',
  };
  return translations[sex] || sex;
};

// Formatage de la date
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Non défini';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// --- ICONS ---
const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Zm0 13.036h.008v.008h-.008v-.008Z"
    />
  </svg>
);
const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
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
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {' '}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />{' '}
  </svg>
);

const InfoRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-client-card">
    <span className="text-gray-500 dark:text-client-subtle capitalize">{label}</span>
    <span className="font-semibold text-gray-800 dark:text-client-light text-right">
      {value || 'Non défini'}
    </span>
  </div>
);

const ClientProfile: React.FC = () => {
  const { user, clients, setClients, logout, theme, setTheme, bilanTemplates } = useAuth();
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [selectedMeasurements, setSelectedMeasurements] = useState<Array<keyof MeasurementType>>([
    'chest',
  ]);
  const [editableWeight, setEditableWeight] = useState(user?.weight?.toString() || '');
  const [editableMeasurements, setEditableMeasurements] = useState<MeasurementType>(
    user?.nutrition.measurements || {}
  );
  const [selectedBilan, setSelectedBilan] = useState<BilanResult | null>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  // États pour les documents Supabase
  const [supabaseDocuments, setSupabaseDocuments] = useState<ClientDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // États pour les blessures
  const [injuries, setInjuries] = useState<ClientInjury[]>([]);
  const [isBodyMapModalOpen, setIsBodyMapModalOpen] = useState(false);
  const [isLoadingInjuries, setIsLoadingInjuries] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('other');
  const [docDescription, setDocDescription] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);

  const measurementLabels: Record<keyof MeasurementType, string> = {
    neck: 'Cou (cm)',
    chest: 'Poitrine (cm)',
    l_bicep: 'Biceps G. (cm)',
    r_bicep: 'Biceps D. (cm)',
    waist: 'Taille (cm)',
    hips: 'Hanches (cm)',
    l_thigh: 'Cuisse G. (cm)',
    r_thigh: 'Cuisse D. (cm)',
  };

  const bilanTemplateForModal = useMemo(() => {
    if (!selectedBilan) return null;
    return bilanTemplates.find((t) => t.id === selectedBilan.templateId);
  }, [selectedBilan, bilanTemplates]);

  const photoFiles = useMemo(() => {
    return supabaseDocuments.filter((doc) => doc.category === 'photo');
  }, [supabaseDocuments]);

  const documentFiles = useMemo(() => {
    if (!user?.sharedFiles) return [];
    return user.sharedFiles.filter((file) => !file.fileType.startsWith('image/'));
  }, [user?.sharedFiles]);

  const measurementHistoryForChart = useMemo(() => {
    if (!user?.nutrition.historyLog) return [];
    return [...user.nutrition.historyLog]
      .filter((log) => log.measurements)
      .reverse()
      .map((log) => ({
        date: log.date,
        ...log.measurements,
      }));
  }, [user]);

  const availableMeasurementsForSelect = useMemo(() => {
    if (!user?.nutrition.historyLog) return [];
    const available = new Set<keyof MeasurementType>();
    user.nutrition.historyLog.forEach((log) => {
      if (log.measurements) {
        (Object.keys(log.measurements) as Array<keyof MeasurementType>).forEach((key) => {
          if (log.measurements![key] !== undefined && log.measurements![key] !== null) {
            available.add(key);
          }
        });
      }
    });
    return Array.from(available);
  }, [user]);

  const measurementHistoryTable = useMemo(() => {
    if (!user?.nutrition.historyLog) return { data: [], headers: [] };
    const headers = new Set<keyof MeasurementType>();
    const validLogs = user.nutrition.historyLog.filter(
      (log) => log.weight || (log.measurements && Object.keys(log.measurements).length > 0)
    );

    validLogs.forEach((log) => {
      if (log.measurements) {
        (Object.keys(log.measurements) as (keyof MeasurementType)[]).forEach((key) => {
          if (log.measurements?.[key]) headers.add(key);
        });
      }
    });

    const sortedHeaders = Array.from(headers).sort();

    const data = validLogs.map((log) => ({
      date: log.date,
      weight: log.weight,
      ...log.measurements,
    }));

    return { data, headers: sortedHeaders };
  }, [user]);

  // Charger les documents depuis Supabase
  const loadSupabaseDocuments = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSupabaseDocuments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [user]);

  useEffect(() => {
    loadSupabaseDocuments();
  }, [loadSupabaseDocuments]);

  // Charger les blessures du client
  useEffect(() => {
    const loadInjuries = async () => {
      if (!user?.id) return;
      setIsLoadingInjuries(true);
      try {
        const clientInjuries = await getClientInjuries(user.id);
        setInjuries(clientInjuries);
      } catch (error) {
        console.error('Erreur lors du chargement des blessures:', error);
      } finally {
        setIsLoadingInjuries(false);
      }
    };
    loadInjuries();
  }, [user?.id]);

  const handleDocFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Taille maximum : 10 Mo');
      return;
    }
    
    setSelectedDocFile(file);
    setShowUploadModal(true);
    
    if (docInputRef.current) {
      docInputRef.current.value = '';
    }
  };

  const handleDocUpload = async () => {
    if (!selectedDocFile || !user || !consentChecked) return;
    
    setIsUploadingDoc(true);
    
    try {
      // 1. Upload vers Supabase Storage
      const fileName = `${Date.now()}_${selectedDocFile.name}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, selectedDocFile, {
          contentType: selectedDocFile.type,
        });
      
      if (uploadError) throw uploadError;
      
      // 2. Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('client-documents')
        .getPublicUrl(filePath);
      
      // 3. Créer l'entrée dans la table client_documents
      const { data: docData, error: docError } = await supabase
        .from('client_documents')
        .insert({
          client_id: user.id,
          coach_id: user.coachId || null,
          file_name: selectedDocFile.name,
          file_url: urlData.publicUrl,
          file_type: selectedDocFile.type,
          file_size: selectedDocFile.size,
          category: selectedCategory,
          description: docDescription || null,
          uploaded_by: user.id,
        })
        .select()
        .single();
      
      if (docError) throw docError;
      
      // Ajouter le nouveau document à la liste
      setSupabaseDocuments((prev) => [docData, ...prev]);
      
      // 4. Envoyer une notification au coach
      if (user.coachId) {
        const { addNotification } = useDataStore.getState();
        await addNotification({
          userId: user.coachId,
          title: 'Nouveau document reçu',
          message: `${user.firstName} ${user.lastName} vous a envoyé un document : ${selectedDocFile.name}`,
          type: 'document',
          fromName: `${user.firstName} ${user.lastName}`,
          link: `/app/client/${user.id}`,
        });
      }
      
      // Fermer la modal et réinitialiser
      setShowUploadModal(false);
      setSelectedDocFile(null);
      setSelectedCategory('other');
      setDocDescription('');
      setConsentChecked(false);
      
      alert('Document téléversé avec succès !');
    } catch (error) {
      console.error('Erreur lors du téléversement:', error);
      alert('Erreur lors du téléversement du document. Veuillez réessayer.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDocDownload = async (doc: ClientDocument) => {
    try {
      const filePath = doc.file_url.split('/client-documents/')[1];
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(filePath, 3600);
      
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      window.open(doc.file_url, '_blank');
    }
  };

  const handleDocDelete = async (doc: ClientDocument) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    
    try {
      const filePath = doc.file_url.split('/client-documents/')[1];
      await supabase.storage.from('client-documents').remove([filePath]);
      
      const { error } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', doc.id);
      
      if (error) throw error;
      
      setSupabaseDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du document.');
    }
  };

  const handleToggleMeasurement = (key: keyof MeasurementType) => {
    setSelectedMeasurements((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  const handleMeasurementChange = (field: keyof MeasurementType, value: string) => {
    const numValue = parseFloat(value);
    setEditableMeasurements((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : isNaN(numValue) ? prev[field] : numValue,
    }));
  };

  const hasChanges = useMemo(() => {
    if (!user) return false;
    const weightChanged = editableWeight !== (user.weight?.toString() || '');
    const measurementsChanged =
      JSON.stringify(editableMeasurements) !== JSON.stringify(user.nutrition.measurements || {});
    return weightChanged || measurementsChanged;
  }, [user, editableWeight, editableMeasurements]);

  const handleSaveMeasurements = async () => {
    if (!user || !hasChanges) return;

    const newWeight = editableWeight === '' ? null : parseFloat(editableWeight);
    const newMeasurements = editableMeasurements;

    const newLogEntry: NutritionLogEntry = {
      date: new Date().toLocaleDateString('fr-FR'),
      weight: newWeight,
      calories: user.nutrition.macros
        ? user.nutrition.macros.protein * 4 +
          user.nutrition.macros.carbs * 4 +
          user.nutrition.macros.fat * 9
        : 0,
      macros: user.nutrition.macros,
      measurements: newMeasurements,
    };

    const updatedNutrition = {
      ...user.nutrition,
      measurements: newMeasurements,
      historyLog: [newLogEntry, ...(user.nutrition.historyLog || [])],
    };

    try {
      // Sauvegarder dans Supabase
      const { error } = await supabase
        .from('clients')
        .update({
          weight: newWeight !== null ? newWeight : user.weight,
          nutrition: updatedNutrition,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Mettre à jour le store local
      const updatedClients = clients.map((c) => {
        if (c.id === user.id) {
          return {
            ...c,
            weight: newWeight !== null ? newWeight : c.weight,
            nutrition: updatedNutrition,
          };
        }
        return c;
      });

      setClients(updatedClients as Client[]);
      alert('Vos informations ont été enregistrées avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    // Convertir FileList en Array
    const fileArray = Array.from(files);

    // Vérifier la taille de chaque fichier (max 10 Mo)
    for (const file of fileArray) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Le fichier ${file.name} est trop volumineux. Taille maximum : 10 Mo`);
        return;
      }
      // Vérifier que c'est bien une image
      if (!file.type.startsWith('image/')) {
        alert(`Le fichier ${file.name} n'est pas une image`);
        return;
      }
    }

    setIsUploadingDoc(true);
    try {
      // Si plusieurs fichiers, créer une session, sinon upload simple
      if (fileArray.length > 1) {
        await uploadMultiplePhotos({
          files: fileArray,
          clientId: user.id,
          coachId: user.coachId || '',
          uploadedBy: user.id,
          description: `Session de ${fileArray.length} photo${fileArray.length > 1 ? 's' : ''}`,
        });
        alert(`${fileArray.length} photos uploadées avec succès !`);
      } else {
        // Upload simple pour une seule photo
        await uploadClientDocument({
          file: fileArray[0],
          clientId: user.id,
          coachId: user.coachId || null,
          uploadedBy: user.id,
          category: 'progress',
          description: 'Photo de progression',
        });
        alert('Photo uploadée avec succès !');
      }

      // Recharger les documents
      await loadSupabaseDocuments();

      // Réinitialiser l'input
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erreur upload photo:', error);
      alert('Erreur lors de l\'upload des photos. Veuillez réessayer.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!user || !window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      await deleteClientDocument(fileId);
      // Recharger les documents
      await loadSupabaseDocuments();
      alert('Fichier supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
      alert('Erreur lors de la suppression du fichier. Veuillez réessayer.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user?.firstName}
            className="w-24 h-24 rounded-full border-2 border-primary object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full border-2 border-primary bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <User className="w-12 h-12 text-gray-500 dark:text-gray-400" />
          </div>
        )}
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-client-light">
          {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-gray-500 dark:text-client-subtle">{user?.email}</p>
      </div>

      <div className="space-y-2">
        <ClientAccordion title="Informations personnelles" isOpenDefault={true}>
          {user ? (
            <div className="space-y-1">
              <InfoRow label="Âge" value={user.age ? `${user.age} ans` : undefined} />
              <InfoRow label="Sexe" value={translateSex(user.sex)} />
              <InfoRow label="Taille" value={user.height ? `${user.height} cm` : undefined} />
              <InfoRow label="Poids actuel" value={user.weight ? `${user.weight} kg` : undefined} />
              <InfoRow label="Niveau d'activité" value={translateActivityLevel(user.energyExpenditureLevel)} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Téléphone" value={user.phone} />
              <InfoRow label="Date d'inscription" value={formatDate(user.createdAt)} />
            </div>
          ) : null}
        </ClientAccordion>

        <ClientAccordion title="Objectif et Conditions d'Entraînement">
          {user && <PerformanceSection clientId={user.id} isCoach={false} />}
        </ClientAccordion>

        <ClientAccordion title="Mes bilans">
          <BilanSection userId={user?.id || ''} theme={theme} />
        </ClientAccordion>

        <ClientAccordion title="Mon suivi médical">
          <div className="space-y-6">
            {/* En-tête avec bouton d'ajout */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-red-500" />
                <h4 className="font-semibold text-lg text-gray-900 dark:text-client-light">
                  Blessures et Douleurs
                </h4>
              </div>
              <button
                onClick={() => setIsBodyMapModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
              >
                <HeartPulse className="h-4 w-4" />
                {injuries.length > 0 ? 'Modifier' : 'Ajouter'}
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-client-subtle">
              Enregistrez vos blessures, douleurs chroniques ou limitations pour que votre coach puisse adapter vos entraînements.
            </p>

            {/* Liste des blessures */}
            {isLoadingInjuries ? (
              <p className="text-center py-4 text-gray-500 dark:text-client-subtle">Chargement...</p>
            ) : injuries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {injuries.map((injury) => (
                  <div
                    key={injury.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-client-card bg-white dark:bg-client-card shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: INJURY_SEVERITY_COLORS[injury.severity] }}
                          />
                          <span className="font-medium text-gray-800 dark:text-client-light">
                            {injury.body_part_name_fr || getMuscleById(injury.body_part)?.nameFr || injury.body_part}
                          </span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-client-dark text-gray-600 dark:text-client-subtle inline-block mb-2">
                          {INJURY_TYPE_LABELS[injury.type]}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-client-subtle">
                          {injury.description}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-client-subtle mt-2">
                          {INJURY_SEVERITY_LABELS[injury.severity]} • {INJURY_STATUS_LABELS[injury.status]}
                          {injury.since && (
                            <span className="block mt-1">
                              Depuis le {new Date(injury.since).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm('Supprimer cette blessure ?')) {
                            await deleteInjury(injury.id);
                            setInjuries(injuries.filter(i => i.id !== injury.id));
                          }
                        }}
                        className="p-1 text-red-500 hover:text-red-700 flex-shrink-0"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-client-dark rounded-lg">
                <HeartPulse className="h-12 w-12 mx-auto text-gray-400 dark:text-client-subtle mb-3" />
                <p className="text-gray-500 dark:text-client-subtle">
                  Aucune blessure enregistrée
                </p>
                <p className="text-sm text-gray-400 dark:text-client-subtle mt-1">
                  Cliquez sur "Ajouter" pour signaler une blessure ou douleur
                </p>
              </div>
            )}
          </div>
        </ClientAccordion>

        <ClientAccordion title="Mensurations & Photos">
          <ClientMeasurementsSection clientId={user?.id || ''} />

          <div className="pt-6 mt-6 border-t border-gray-200 dark:border-client-card">
            <h4 className="font-semibold text-lg text-gray-900 dark:text-client-light mb-4">
              Mes photos de suivi
            </h4>
            <input
              type="file"
              ref={photoInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              multiple
            />
            <Button onClick={() => photoInputRef.current?.click()} className="w-full" size="lg">
              Téléverser des photos
            </Button>

            {isUploadingDoc && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-blue-600 dark:text-blue-400 text-center">Upload en cours...</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
              {photoFiles.map((file) => (
                <div key={file.id} className="relative group aspect-square">
                  <img
                    src={file.file_url}
                    alt={file.file_name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-between p-2 text-white">
                    <p className="text-xs font-semibold break-words">{file.file_name}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs">
                        {new Date(file.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1 bg-red-500 rounded-full hover:bg-red-600"
                        disabled={isUploadingDoc}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {photoFiles.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-client-subtle mt-1">
                  Aucune photo téléversée.
                </p>
              </div>
            )}
          </div>
        </ClientAccordion>
        <ClientAccordion title="Mes Documents">
          <div className="space-y-6">
            <input
              type="file"
              ref={docInputRef}
              onChange={handleDocFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,text/plain,image/*"
            />
            <Button onClick={() => docInputRef.current?.click()} className="w-full" size="lg">
              Téléverser un document
            </Button>

            <div className="!bg-primary/10 dark:!bg-primary/20 p-4 border border-primary/20 dark:border-primary/30 rounded-lg">
              <div className="flex items-center gap-4">
                <ShieldCheckIcon className="w-10 h-10 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-client-light">
                    Vos documents sont sécurisés
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-client-subtle mt-1">
                    Les fichiers que vous téléversez ici sont stockés de manière sécurisée et ne
                    sont visibles que par votre coach.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {isLoadingDocs ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-client-subtle">Chargement des documents...</p>
                </div>
              ) : supabaseDocuments.length > 0 ? (
                supabaseDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="!bg-white dark:!bg-client-dark/50 p-3 !shadow-sm border border-gray-200 dark:border-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 dark:bg-client-dark rounded-lg">
                        <DocumentIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-gray-900 dark:text-client-light truncate">
                          {doc.file_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-client-subtle">
                          {new Date(doc.created_at).toLocaleDateString('fr-FR')} &middot;{' '}
                          {formatFileSize(doc.file_size)}
                          {doc.uploaded_by !== user?.id && (
                            <span className="ml-2 text-primary">• Envoyé par votre coach</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDocDownload(doc)}
                        className="p-2 text-gray-500 dark:text-client-subtle hover:text-primary"
                        aria-label="Télécharger le fichier"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </button>
                      {doc.uploaded_by === user?.id && (
                        <button
                          onClick={() => handleDocDelete(doc)}
                          className="p-2 text-gray-500 dark:text-client-subtle hover:text-red-500"
                          aria-label="Supprimer le fichier"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-lg text-gray-800 dark:text-client-light">Aucun document.</p>
                  <p className="text-gray-500 dark:text-client-subtle mt-1">
                    Téléversez des bilans ou autres documents à partager.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ClientAccordion>

        {/* Modal d'upload de document */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedDocFile(null);
            setSelectedCategory('other');
            setDocDescription('');
            setConsentChecked(false);
          }}
          title="Téléverser un document"
        >
          <div className="space-y-4">
            {selectedDocFile && (
              <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-client-dark rounded-lg">
                <DocumentIcon className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-client-light">{selectedDocFile.name}</p>
                  <p className="text-sm text-gray-500 dark:text-client-subtle">
                    {formatFileSize(selectedDocFile.size)}
                  </p>
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-semibold">Formats acceptés :</span> PDF, Word (.doc, .docx), Images (JPG, PNG), Texte (.txt)
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Taille maximum : 10 Mo par fichier
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-client-light mb-1">
                Catégorie du document
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-client-dark text-gray-900 dark:text-client-light"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-client-light mb-1">
                Description (optionnel)
              </label>
              <textarea
                value={docDescription}
                onChange={(e) => setDocDescription(e.target.value)}
                placeholder="Ajoutez une description pour ce document..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-client-dark text-gray-900 dark:text-client-light resize-none"
                rows={3}
              />
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary rounded"
                />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  Je consens à partager ce document avec mon coach. Je comprends que ces données
                  seront stockées de manière sécurisée conformément au RGPD.
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedDocFile(null);
                  setSelectedCategory('other');
                  setDocDescription('');
                  setConsentChecked(false);
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDocUpload}
                disabled={!consentChecked || isUploadingDoc}
                className="flex-1"
              >
                {isUploadingDoc ? 'Envoi en cours...' : 'Envoyer'}
              </Button>
            </div>
          </div>
        </Modal>
        <ClientAccordion title="Paramètres du compte">
          <div className="flex flex-col items-start space-y-2 text-gray-700 dark:text-client-subtle">
            <button 
              onClick={() => setShowAccountSettings(true)}
              className="hover:text-primary dark:hover:text-client-light font-semibold"
            >
              Modifier mes informations personnelles
            </button>
            <p className="text-sm text-gray-500 dark:text-client-subtle">
              Gérez votre profil, photo, mot de passe et informations de contact
            </p>
          </div>
        </ClientAccordion>
        <ClientAccordion title="Apparence">
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-client-subtle">Thème de l'application</p>
            <div className="flex items-center rounded-lg p-1 bg-gray-200 dark:bg-client-dark">
              <button
                onClick={() => setTheme('light')}
                className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${
                  theme === 'light'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 dark:text-client-subtle'
                }`}
              >
                Clair
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 dark:text-client-subtle'
                }`}
              >
                Sombre
              </button>
            </div>
          </div>
        </ClientAccordion>
      </div>

      <div className="pt-4">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors"
        >
          Se déconnecter
        </button>
      </div>

      {selectedBilan && bilanTemplateForModal && (
        <Modal
          isOpen={!!selectedBilan}
          onClose={() => setSelectedBilan(null)}
          title={selectedBilan.templateName}
          theme={theme}
          size="xl"
        >
          <div className="space-y-6">
            {bilanTemplateForModal.sections.map((section) => {
              if (section.isCivility && selectedBilan.templateId === 'system-default') return null;

              const answeredFields = section.fields.filter((field) => {
                const answer = selectedBilan?.answers?.[field.id];
                return (
                  answer !== undefined &&
                  answer !== null &&
                  answer !== '' &&
                  (!Array.isArray(answer) || answer.length > 0)
                );
              });

              if (answeredFields.length === 0) return null;

              return (
                <div key={section.id}>
                  <h4 className="font-semibold text-lg text-gray-800 dark:text-client-light mb-2 pt-4 border-t border-gray-200 dark:border-client-card first:pt-0 first:border-t-0">
                    {section.title}
                  </h4>
                  <div className="space-y-1">
                    {answeredFields.map((field) => {
                      const answer = selectedBilan!.answers![field.id];
                      return (
                        <div
                          key={field.id}
                          className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-client-card"
                        >
                          <span className="text-gray-600 dark:text-client-subtle">
                            {field.label}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-client-light text-right">
                            {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {selectedBilan.status === 'pending' && (
              <div className="pt-6 border-t border-gray-200 dark:border-client-card mt-6 text-center">
                <Button>Commencer le bilan</Button>
                <p className="text-xs text-client-subtle mt-2">(Fonctionnalité à venir)</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />

      {/* Modale de carte corporelle pour les blessures */}
      {user && (
        <BodyMapModal
          isOpen={isBodyMapModalOpen}
          onClose={() => setIsBodyMapModalOpen(false)}
          injuries={injuries.map(inj => ({
            id: inj.id,
            bodyPart: inj.body_part as any,
            type: inj.type,
            description: inj.description,
            severity: inj.severity,
            status: inj.status,
            since: inj.since,
            notes: inj.notes,
            createdAt: inj.created_at,
            updatedAt: inj.updated_at,
          }))}
          onSave={async (newInjuries) => {
            // Convertir et sauvegarder les blessures
            const injuriesToCreate: CreateInjuryData[] = newInjuries
              .filter(inj => !injuries.find(existing => existing.id === inj.id))
              .map(injury => {
                const muscle = getMuscleById(injury.bodyPart);
                return {
                  client_id: user.id,
                  body_part: injury.bodyPart,
                  body_part_name_fr: muscle?.nameFr || injury.bodyPart,
                  muscle_group: muscle?.group,
                  type: injury.type,
                  description: injury.description,
                  notes: injury.notes,
                  severity: injury.severity,
                  status: injury.status,
                  since: injury.since,
                  created_by: user.id,
                  created_by_role: 'client' as const,
                };
              });

            // Supprimer les blessures retirées
            const injuriesToDelete = injuries.filter(
              existing => !newInjuries.find(inj => inj.id === existing.id)
            );
            for (const injury of injuriesToDelete) {
              await deleteInjury(injury.id);
            }

            // Créer les nouvelles blessures
            if (injuriesToCreate.length > 0) {
              await createMultipleInjuries(injuriesToCreate);
            }

            // Recharger les blessures
            const updatedInjuries = await getClientInjuries(user.id);
            setInjuries(updatedInjuries);
          }}
          theme={theme}
        />
      )}
    </div>
  );
};

export default ClientProfile;
