import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ClientFormation, Client } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import {
  TrashIcon,
  PencilIcon,
  ChevronDownIcon,
  LinkIcon,
  DocumentTextIcon,
} from '../../constants/icons';

const ClientFormationManagement: React.FC = () => {
  const {
    user,
    clientFormations,
    setClientFormations,
    clients,
    setClients: updateAllClients,
  } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentFormation, setCurrentFormation] = useState<Partial<ClientFormation> | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const coaches = useMemo(() => clients.filter((c) => c.role === 'coach'), [clients]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (mode: 'add' | 'edit', formation: Partial<ClientFormation> | null = null) => {
    setModalMode(mode);
    setCurrentFormation(
      mode === 'add' ? formation || { title: '', type: 'link', coachId: user?.id } : formation
    );
    setIsModalOpen(true);
    setIsAddMenuOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentFormation(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentFormation((prev) =>
          prev
            ? {
                ...prev,
                fileName: file.name,
                fileContent: reader.result as string,
              }
            : null
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!currentFormation || !currentFormation.title || !user) {
      alert('Le titre est requis.');
      return;
    }

    if (modalMode === 'add') {
      const newFormation: ClientFormation = {
        id: `form-${Date.now()}`,
        title: currentFormation.title,
        coachId: currentFormation.coachId || user.id, // Default to current user (admin)
        type: currentFormation.type!,
        url: currentFormation.type === 'link' ? currentFormation.url : undefined,
        fileName: currentFormation.type === 'file' ? currentFormation.fileName : undefined,
        fileContent: currentFormation.type === 'file' ? currentFormation.fileContent : undefined,
      };
      setClientFormations([...clientFormations, newFormation]);
    } else {
      const updatedFormations = clientFormations.map((f) =>
        f.id === currentFormation.id ? { ...f, ...currentFormation } : f
      );
      setClientFormations(updatedFormations as ClientFormation[]);
    }
    closeModal();
  };

  const handleDelete = (formationId: string) => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette ressource ? L'accès sera révoqué pour tous les clients."
      )
    ) {
      setClientFormations(clientFormations.filter((f) => f.id !== formationId));
      const updatedClients = clients.map((client) => {
        if (client.grantedFormationIds?.includes(formationId)) {
          return {
            ...client,
            grantedFormationIds: client.grantedFormationIds.filter((id) => id !== formationId),
          };
        }
        return client;
      });
      updateAllClients(updatedClients as Client[]);
    }
  };

  const getCoachName = (coachId: string) => {
    if (coachId === user?.id) return 'Admin';
    const coach = coaches.find((c) => c.id === coachId);
    return coach ? `${coach.firstName} ${coach.lastName}` : 'Inconnu';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Formations Clients</h1>
        <div className="relative" ref={addMenuRef}>
          <Button onClick={() => setIsAddMenuOpen((prev) => !prev)}>
            Ajouter <ChevronDownIcon className="w-4 h-4 ml-2 inline" />
          </Button>
          {isAddMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
              <button
                onClick={() => openModal('add', { type: 'link' })}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Lien (ex: YouTube, article)
              </button>
              <button
                onClick={() => openModal('add', { type: 'file' })}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Fichier (PDF, eBook...)
              </button>
            </div>
          )}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé par
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientFormations.length > 0 ? (
                clientFormations.map((formation) => (
                  <tr key={formation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formation.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="flex items-center gap-2">
                        {formation.type === 'link' ? (
                          <LinkIcon className="w-5 h-5" />
                        ) : (
                          <DocumentTextIcon className="w-5 h-5" />
                        )}
                        <span className="capitalize">
                          {formation.type === 'link' ? 'Lien' : 'Fichier'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formation.type === 'link' && formation.url ? (
                        <a
                          href={formation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate block max-w-xs"
                        >
                          {formation.url}
                        </a>
                      ) : (
                        <span>{formation.fileName}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCoachName(formation.coachId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openModal('edit', formation)}
                        className="!p-2"
                        title="Modifier"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(formation.id)}
                        className="!p-2"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    Aucune ressource pour les clients n'a été créée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && currentFormation && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={
            modalMode === 'add'
              ? `Ajouter un ${currentFormation.type === 'link' ? 'lien' : 'fichier'}`
              : 'Modifier la ressource'
          }
        >
          <div className="space-y-4">
            <Input
              label="Titre"
              value={currentFormation.title || ''}
              onChange={(e) =>
                setCurrentFormation((prev) => (prev ? { ...prev, title: e.target.value } : null))
              }
              placeholder="Ex: Nutrition pour la prise de masse"
              required
            />
            <Select
              label="Créé par"
              value={currentFormation.coachId || user?.id}
              onChange={(e) =>
                setCurrentFormation((prev) => (prev ? { ...prev, coachId: e.target.value } : null))
              }
            >
              <option value={user?.id}>Admin</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.firstName} {coach.lastName}
                </option>
              ))}
            </Select>
            {currentFormation.type === 'link' ? (
              <Input
                label="Lien (URL)"
                value={currentFormation.url || ''}
                onChange={(e) =>
                  setCurrentFormation((prev) => (prev ? { ...prev, url: e.target.value } : null))
                }
                placeholder="https://www.example.com/..."
                type="url"
                required
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fichier</label>
                {modalMode === 'edit' && currentFormation.fileName && (
                  <p className="text-sm text-gray-500 mb-2">
                    Fichier actuel: {currentFormation.fileName}. Choisissez un nouveau fichier pour
                    le remplacer.
                  </p>
                )}
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-primary hover:file:bg-violet-100"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end pt-6 space-x-2">
            <Button variant="secondary" onClick={closeModal}>
              Annuler
            </Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClientFormationManagement;
