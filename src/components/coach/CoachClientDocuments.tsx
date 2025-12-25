import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../Button';
import Modal from '../Modal';
import Select from '../Select';

// --- Types ---
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

interface CoachClientDocumentsProps {
  clientId: string;
  clientName: string;
}

// --- ICONS ---
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
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);

const CloudArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
    />
  </svg>
);

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

// Catégories de documents
const DOCUMENT_CATEGORIES = [
  { value: 'medical', label: 'Médical', description: 'Certificats médicaux, analyses, etc.' },
  { value: 'identity', label: 'Identité', description: "Pièce d'identité, justificatif de domicile" },
  { value: 'contract', label: 'Contrat', description: 'Contrats signés, CGV' },
  { value: 'progress', label: 'Progression', description: 'Photos de progression, mesures' },
  { value: 'nutrition', label: 'Nutrition', description: 'Plans alimentaires, recettes' },
  { value: 'other', label: 'Autre', description: 'Autres documents' },
];

const CoachClientDocuments: React.FC<CoachClientDocumentsProps> = ({ clientId, clientName }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal d'upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('other');
  const [description, setDescription] = useState('');

  // Charger les documents du client
  const loadDocuments = useCallback(async () => {
    if (!clientId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Taille maximum : 10 Mo');
      return;
    }

    setSelectedFile(file);
    setIsUploadModalOpen(true);

    // Reset le input pour permettre de sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !clientId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload vers Supabase Storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `${clientId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, selectedFile, {
          contentType: selectedFile.type,
        });

      if (uploadError) throw uploadError;
      setUploadProgress(50);

      // 2. Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('client-documents')
        .getPublicUrl(filePath);

      setUploadProgress(75);

      // 3. Créer l'entrée dans la table client_documents
      const { data: docData, error: docError } = await supabase
        .from('client_documents')
        .insert({
          client_id: clientId,
          coach_id: user.id,
          file_name: selectedFile.name,
          file_url: urlData.publicUrl,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          category: selectedCategory,
          description: description || null,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (docError) throw docError;

      setUploadProgress(100);

      // Ajouter le nouveau document à la liste
      setDocuments((prev) => [docData, ...prev]);

      // Fermer la modal et réinitialiser
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setSelectedCategory('other');
      setDescription('');

      alert('Document envoyé avec succès !');
    } catch (error) {
      console.error('Erreur lors du téléversement:', error);
      alert("Erreur lors de l'envoi du document. Veuillez réessayer.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (doc: ClientDocument) => {
    try {
      // Créer une URL signée pour le téléchargement
      const filePath = doc.file_url.split('/client-documents/')[1];
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(filePath, 3600); // 1 heure

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      // Fallback: ouvrir directement l'URL
      window.open(doc.file_url, '_blank');
    }
  };

  const handleDelete = async (doc: ClientDocument) => {
    // Seul l'uploadeur peut supprimer
    if (doc.uploaded_by !== user?.id) {
      alert('Vous ne pouvez supprimer que les documents que vous avez envoyés.');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      // 1. Supprimer du Storage
      const filePath = doc.file_url.split('/client-documents/')[1];
      await supabase.storage.from('client-documents').remove([filePath]);

      // 2. Supprimer de la table
      const { error } = await supabase.from('client_documents').delete().eq('id', doc.id);

      if (error) throw error;

      // Mettre à jour la liste
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du document.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryLabel = (category: string) => {
    return DOCUMENT_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      medical: 'bg-red-100 text-red-700',
      identity: 'bg-blue-100 text-blue-700',
      contract: 'bg-purple-100 text-purple-700',
      progress: 'bg-green-100 text-green-700',
      nutrition: 'bg-orange-100 text-orange-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.other;
  };

  const filteredDocuments = filterCategory === 'all' 
    ? documents 
    : documents.filter(d => d.category === filterCategory);

  // Séparer les documents par source (client vs coach)
  const clientDocuments = filteredDocuments.filter((d) => d.uploaded_by === clientId);
  const coachDocuments = filteredDocuments.filter((d) => d.uploaded_by !== clientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Button onClick={() => fileInputRef.current?.click()} size="sm">
          <CloudArrowUpIcon className="w-4 h-4 mr-2" />
          Envoyer un document
        </Button>

        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-40"
        >
          <option value="all">Toutes catégories</option>
          {DOCUMENT_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Documents reçus du client */}
      {clientDocuments.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            Documents reçus de {clientName}
          </h4>
          <div className="space-y-2">
            {clientDocuments.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                onDownload={handleDownload}
                onDelete={handleDelete}
                canDelete={doc.uploaded_by === user?.id}
                getCategoryLabel={getCategoryLabel}
                getCategoryColor={getCategoryColor}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        </div>
      )}

      {/* Documents envoyés par le coach */}
      {coachDocuments.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <CloudArrowUpIcon className="w-4 h-4" />
            Documents envoyés
          </h4>
          <div className="space-y-2">
            {coachDocuments.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                onDownload={handleDownload}
                onDelete={handleDelete}
                canDelete={doc.uploaded_by === user?.id}
                getCategoryLabel={getCategoryLabel}
                getCategoryColor={getCategoryColor}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        </div>
      )}

      {/* Message si aucun document */}
      {documents.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <DocumentIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Aucun document partagé avec ce client.</p>
          <p className="text-sm text-gray-400 mt-1">
            Cliquez sur "Envoyer un document" pour partager un fichier.
          </p>
        </div>
      )}

      {/* Modal d'upload */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          if (!isUploading) {
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            setSelectedCategory('other');
            setDescription('');
          }
        }}
        title={`Envoyer un document à ${clientName}`}
      >
        <div className="space-y-4">
          {selectedFile && (
            <div className="p-3 bg-gray-100 rounded-lg">
              <div className="flex items-center gap-3">
                <DocumentIcon className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            </div>
          )}

          <Select
            label="Catégorie du document"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label} - {cat.description}
              </option>
            ))}
          </Select>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              rows={2}
              placeholder="Ajoutez une description pour ce document..."
            />
          </div>

          {/* Barre de progression */}
          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsUploadModalOpen(false);
                setSelectedFile(null);
                setSelectedCategory('other');
                setDescription('');
              }}
              disabled={isUploading}
            >
              Annuler
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Composant pour afficher une ligne de document
const DocumentRow: React.FC<{
  doc: ClientDocument;
  onDownload: (doc: ClientDocument) => void;
  onDelete: (doc: ClientDocument) => void;
  canDelete: boolean;
  getCategoryLabel: (category: string) => string;
  getCategoryColor: (category: string) => string;
  formatFileSize: (bytes: number) => string;
}> = ({ doc, onDownload, onDelete, canDelete, getCategoryLabel, getCategoryColor, formatFileSize }) => {
  return (
    <div className="p-3 border rounded-lg flex items-start justify-between gap-2 hover:bg-gray-50">
      <div className="flex items-start gap-3 overflow-hidden flex-1">
        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
          {doc.file_type.startsWith('image/') ? (
            <PhotoIcon className="w-5 h-5 text-primary" />
          ) : (
            <DocumentIcon className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm truncate">{doc.file_name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(doc.category)}`}>
              {getCategoryLabel(doc.category)}
            </span>
          </div>
          {doc.description && (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{doc.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(doc.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}{' '}
            · {formatFileSize(doc.file_size)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onDownload(doc)}
          className="p-2 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100"
          aria-label="Télécharger"
          title="Télécharger"
        >
          <DownloadIcon className="w-4 h-4" />
        </button>
        {canDelete && (
          <button
            onClick={() => onDelete(doc)}
            className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-gray-100"
            aria-label="Supprimer"
            title="Supprimer"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CoachClientDocuments;
