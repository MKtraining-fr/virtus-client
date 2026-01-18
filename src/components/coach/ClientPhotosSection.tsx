import React, { useState, useEffect } from 'react';
import { 
  getPhotoSessions, 
  getSessionPhotos, 
  getClientPhotos,
  deleteClientDocument,
  deletePhotoSession,
  PhotoSession, 
  ClientDocument 
} from '../../services/clientDocumentService';
import { PhotoImage } from './PhotoImage';
import { ChevronDown, ChevronRight, Folder, Calendar, Image as ImageIcon, Trash2 } from 'lucide-react';

interface ClientPhotosSectionProps {
  clientId: string;
  coachId: string;
}

export const ClientPhotosSection: React.FC<ClientPhotosSectionProps> = ({ clientId, coachId }) => {
  const [sessions, setSessions] = useState<PhotoSession[]>([]);
  const [sessionPhotos, setSessionPhotos] = useState<Record<string, ClientDocument[]>>({});
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<ClientDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPhotosData();
  }, [clientId, coachId]);

  const loadPhotosData = async () => {
    setIsLoading(true);
    try {
      // Charger les sessions
      const sessionsData = await getPhotoSessions(clientId, coachId);
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
      
      // Recharger les photos de la session
      if (sessionId && sessionPhotos[sessionId]) {
        const photos = await getSessionPhotos(sessionId);
        
        // ✅ Si plus aucune photo, supprimer la session automatiquement
        if (photos.length === 0) {
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
          
          alert('Photo supprimée et dossier vide supprimé automatiquement !');
        } else {
          // Mettre à jour les photos de la session
          setSessionPhotos(prev => ({ ...prev, [sessionId]: photos }));
          await loadPhotosData();
          alert('Photo supprimée avec succès !');
        }
      }
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
      
      alert('Dossier supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression session:', error);
      alert('Erreur lors de la suppression du dossier.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectAll = () => {
    // Collecter toutes les photos visibles
    const allPhotos: string[] = [];
    for (const sessionId of Array.from(expandedSessions)) {
      if (sessionPhotos[sessionId]) {
        allPhotos.push(...sessionPhotos[sessionId].map(p => p.id));
      }
    }

    if (selectedPhotos.size === allPhotos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(allPhotos));
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedPhotos.size} photo${selectedPhotos.size > 1 ? 's' : ''} ?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Grouper les photos par session
      const photosBySession: Record<string, string[]> = {};
      for (const photoId of Array.from(selectedPhotos)) {
        // Trouver la session de cette photo
        for (const [sessionId, photos] of Object.entries(sessionPhotos)) {
          if (photos.some(p => p.id === photoId)) {
            if (!photosBySession[sessionId]) {
              photosBySession[sessionId] = [];
            }
            photosBySession[sessionId].push(photoId);
            break;
          }
        }
      }

      // Supprimer toutes les photos
      await Promise.all(
        Array.from(selectedPhotos).map(photoId => deleteClientDocument(photoId))
      );

      // Vérifier chaque session et supprimer si vide
      for (const [sessionId, deletedPhotoIds] of Object.entries(photosBySession)) {
        const remainingPhotos = await getSessionPhotos(sessionId);
        
        if (remainingPhotos.length === 0) {
          // Supprimer la session vide
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
        } else {
          // Mettre à jour les photos de la session
          setSessionPhotos(prev => ({ ...prev, [sessionId]: remainingPhotos }));
        }
      }

      await loadPhotosData();
      setSelectedPhotos(new Set());
      setSelectionMode(false);
      alert('Photos supprimées avec succès !');
    } catch (error) {
      console.error('Erreur suppression photos:', error);
      alert('Erreur lors de la suppression des photos.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadSelected = async () => {
    try {
      for (const photoId of Array.from(selectedPhotos)) {
        // Trouver la photo
        let photo: ClientDocument | null = null;
        for (const photos of Object.values(sessionPhotos)) {
          const found = photos.find(p => p.id === photoId);
          if (found) {
            photo = found;
            break;
          }
        }

        if (photo) {
          // Télécharger la photo
          const link = document.createElement('a');
          link.href = photo.file_url;
          link.download = photo.file_name;
          link.click();
          
          // Petit délai entre chaque téléchargement
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      alert('Téléchargement des photos lancé !');
    } catch (error) {
      console.error('Erreur téléchargement photos:', error);
      alert('Erreur lors du téléchargement des photos.');
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Chargement des photos...</p>
      </div>
    );
  }

  const totalPhotos = sessions.reduce((sum, s) => sum + (s.photo_count || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Photos de progression
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {totalPhotos} photo{totalPhotos > 1 ? 's' : ''}
          </span>
          {totalPhotos > 0 && (
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedPhotos(new Set());
              }}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
            >
              {selectionMode ? 'Annuler' : '☑️ Sélectionner'}
            </button>
          )}
        </div>
      </div>

      {/* Barre d'actions en mode sélection */}
      {selectionMode && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedPhotos.size} photo{selectedPhotos.size > 1 ? 's' : ''} sélectionnée{selectedPhotos.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary hover:underline font-medium"
            >
              {selectedPhotos.size > 0 ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadSelected}
              disabled={selectedPhotos.size === 0 || isDeleting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              📥 Télécharger ({selectedPhotos.size})
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedPhotos.size === 0 || isDeleting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              🗑️ Supprimer ({selectedPhotos.size})
            </button>
          </div>
        </div>
      )}

      {totalPhotos === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg
            className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Aucune photo de progression
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Le client n'a pas encore uploadé de photos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Sessions de photos */}
          {sessions.map((session) => (
            <div
              key={session.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* En-tête de session */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                <button
                  onClick={() => toggleSession(session.id)}
                  className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                  disabled={isDeleting}
                >
                  {expandedSessions.has(session.id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <Folder className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(session.session_date)}
                      </span>
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {session.description}
                      </p>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
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
                <div className="p-4 bg-white dark:bg-gray-900">
                  {sessionPhotos[session.id] ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {sessionPhotos[session.id].map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group aspect-square"
                        >
                          <div
                            className="cursor-pointer w-full h-full"
                            onClick={() => {
                              if (selectionMode) {
                                const newSelected = new Set(selectedPhotos);
                                if (newSelected.has(photo.id)) {
                                  newSelected.delete(photo.id);
                                } else {
                                  newSelected.add(photo.id);
                                }
                                setSelectedPhotos(newSelected);
                              } else {
                                setSelectedPhoto(photo);
                              }
                            }}
                          >
                            <PhotoImage
                              filePath={photo.file_url}
                              alt={photo.file_name}
                              className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
                            />
                          </div>
                          
                          {/* Checkbox en mode sélection */}
                          {selectionMode && (
                            <div className="absolute top-2 left-2 z-10">
                              <input
                                type="checkbox"
                                checked={selectedPhotos.has(photo.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newSelected = new Set(selectedPhotos);
                                  if (e.target.checked) {
                                    newSelected.add(photo.id);
                                  } else {
                                    newSelected.delete(photo.id);
                                  }
                                  setSelectedPhotos(newSelected);
                                }}
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                              />
                            </div>
                          )}
                          
                          {/* Bouton supprimer (seulement en mode normal) */}
                          {!selectionMode && (
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
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Chargement...</p>
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
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedPhoto.file_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDateTime(selectedPhoto.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-400"
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
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
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
