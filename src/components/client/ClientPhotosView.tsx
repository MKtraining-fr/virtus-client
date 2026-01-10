import React, { useState, useEffect } from 'react';
import { 
  getClientOwnPhotoSessions, 
  getSessionPhotos, 
  getClientPhotos,
  deleteClientDocument,
  deletePhotoSession,
  PhotoSession, 
  ClientDocument 
} from '../../services/clientDocumentService';
import { PhotoImage } from '../coach/PhotoImage';
import { ChevronDown, ChevronRight, Folder, Calendar, Image as ImageIcon, Trash2 } from 'lucide-react';

interface ClientPhotosViewProps {
  clientId: string;
  onPhotoDeleted?: () => void;
}

export const ClientPhotosView: React.FC<ClientPhotosViewProps> = ({ clientId, onPhotoDeleted }) => {
  const [sessions, setSessions] = useState<PhotoSession[]>([]);
  const [sessionPhotos, setSessionPhotos] = useState<Record<string, ClientDocument[]>>({});
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<ClientDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPhotosData();
  }, [clientId]);

  const loadPhotosData = async () => {
    setIsLoading(true);
    try {
      // Charger les sessions
      const sessionsData = await getClientOwnPhotoSessions(clientId);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Erreur chargement photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSession = async (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
      // Charger les photos de la session si pas encore chargées
      if (!sessionPhotos[sessionId]) {
        try {
          const photos = await getSessionPhotos(sessionId);
          setSessionPhotos(prev => ({ ...prev, [sessionId]: photos }));
        } catch (error) {
          console.error('Erreur chargement photos session:', error);
        }
      }
    }
    
    setExpandedSessions(newExpanded);
  };

  const handleDeletePhoto = async (photoId: string, sessionId?: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;

    setIsDeleting(true);
    try {
      await deleteClientDocument(photoId);
      
      // Recharger les données
      if (sessionId && sessionPhotos[sessionId]) {
        const photos = await getSessionPhotos(sessionId);
        setSessionPhotos(prev => ({ ...prev, [sessionId]: photos }));
      }
      
      await loadPhotosData();
      onPhotoDeleted?.();
      
      alert('Photo supprimée avec succès !');
    } catch (error) {
      console.error('Erreur suppression photo:', error);
      alert('Erreur lors de la suppression de la photo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const photoCount = session?.photo_count || 0;
    
    if (!window.confirm(
      `Êtes-vous sûr de vouloir supprimer ce dossier et ses ${photoCount} photo${photoCount > 1 ? 's' : ''} ?`
    )) return;

    setIsDeleting(true);
    try {
      await deletePhotoSession(sessionId);
      
      // Retirer la session des états
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setExpandedSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
      setSessionPhotos(prev => {
        const newPhotos = { ...prev };
        delete newPhotos[sessionId];
        return newPhotos;
      });
      
      onPhotoDeleted?.();
      alert('Dossier supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression session:', error);
      alert('Erreur lors de la suppression du dossier.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-client-accent mx-auto"></div>
        <p className="mt-2 text-gray-500 dark:text-client-subtle">Chargement des photos...</p>
      </div>
    );
  }

  const totalPhotos = sessions.reduce((sum, s) => sum + (s.photo_count || 0), 0);

  return (
    <div className="space-y-4">
      {totalPhotos === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-client-subtle">
            Aucune photo téléversée.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Sessions de photos */}
          {sessions.map((session) => (
            <div
              key={session.id}
              className="border border-gray-200 dark:border-client-card rounded-lg overflow-hidden"
            >
              {/* En-tête de session */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-client-card flex items-center justify-between">
                <button
                  onClick={() => toggleSession(session.id)}
                  className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                  disabled={isDeleting}
                >
                  {expandedSessions.has(session.id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-500 dark:text-client-subtle" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500 dark:text-client-subtle" />
                  )}
                  <Folder className="w-5 h-5 text-client-accent" />
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-client-subtle" />
                      <span className="font-medium text-gray-900 dark:text-client-light">
                        {formatDate(session.session_date)}
                      </span>
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-500 dark:text-client-subtle mt-0.5">
                        {session.description}
                      </p>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-client-subtle">
                    <ImageIcon className="w-4 h-4" />
                    <span>{session.photo_count || 0} photo{(session.photo_count || 0) > 1 ? 's' : ''}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    disabled={isDeleting}
                    title="Supprimer le dossier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contenu de session (photos) */}
              {expandedSessions.has(session.id) && (
                <div className="p-4 bg-white dark:bg-client-bg">
                  {sessionPhotos[session.id] ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {sessionPhotos[session.id].map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group aspect-square"
                        >
                          <div
                            className="cursor-pointer w-full h-full"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <PhotoImage
                              filePath={photo.file_url}
                              alt={photo.file_name}
                              className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-client-card hover:border-client-accent transition-colors"
                            />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(photo.id, session.id);
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                            disabled={isDeleting}
                            title="Supprimer la photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-client-accent mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-client-subtle">Chargement...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}


        </div>
      )}

      {/* Modal pour afficher la photo en grand */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-client-card rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-client-card flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-client-light">
                  {selectedPhoto.file_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-client-subtle">
                  {formatDateTime(selectedPhoto.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-client-bg rounded-full transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-client-subtle"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-100px)]">
              <PhotoImage
                filePath={selectedPhoto.file_url}
                alt={selectedPhoto.file_name}
                className="w-full h-auto rounded-lg"
              />
              {selectedPhoto.description && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-client-bg rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-client-light">
                    {selectedPhoto.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
