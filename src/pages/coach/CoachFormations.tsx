import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ClientFormation, ProfessionalFormation } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import {
  TrashIcon,
  PencilIcon,
  ChevronDownIcon,
  LinkIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '../../constants/icons';

const ClientFormationsTab: React.FC = () => {
  const { user, clientFormations, setClientFormations, clients, setClients } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentFormation, setCurrentFormation] = useState<Partial<ClientFormation> | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // States for Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [formationToAssign, setFormationToAssign] = useState<ClientFormation | null>(null);
  const [selectedClientsForAccess, setSelectedClientsForAccess] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const myFormations = useMemo(() => {
    return clientFormations.filter((f) => f.coachId === user?.id);
  }, [clientFormations, user]);

  const myClients = useMemo(() => {
    return clients.filter(
      (c) => c.role === 'client' && c.status === 'active' && c.coachId === user?.id
    );
  }, [clients, user]);

  const filteredClientsForModal = useMemo(() => {
    if (!searchTerm) return myClients;
    const lowercasedFilter = searchTerm.toLowerCase();
    return myClients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(lowercasedFilter) ||
        c.lastName.toLowerCase().includes(lowercasedFilter)
    );
  }, [myClients, searchTerm]);

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
    setCurrentFormation(mode === 'add' ? formation || { title: '', type: 'link' } : formation);
    setIsModalOpen(true);
    setIsAddMenuOpen(false);
  };

  const openAssignModal = (formation: ClientFormation) => {
    setFormationToAssign(formation);
    const clientsWithAccess = clients
      .filter((c) => c.grantedFormationIds?.includes(formation.id))
      .map((c) => c.id);
    setSelectedClientsForAccess(clientsWithAccess);
    setSearchTerm('');
    setIsAssignModalOpen(true);
  };

  const handleToggleClientSelection = (clientId: string) => {
    setSelectedClientsForAccess((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSaveAccess = () => {
    if (!formationToAssign) return;

    const formationId = formationToAssign.id;
    const selectedClientIds = new Set(selectedClientsForAccess);

    const updatedClients = clients.map((client) => {
      if (client.coachId !== user?.id) return client;

      const hasAccess = client.grantedFormationIds?.includes(formationId);
      const shouldHaveAccess = selectedClientIds.has(client.id);

      if (hasAccess && !shouldHaveAccess) {
        return {
          ...client,
          grantedFormationIds: client.grantedFormationIds?.filter((id) => id !== formationId),
        };
      }
      if (!hasAccess && shouldHaveAccess) {
        return {
          ...client,
          grantedFormationIds: [...(client.grantedFormationIds || []), formationId],
        };
      }
      return client;
    });

    setClients(updatedClients);
    alert(`Les accès pour "${formationToAssign.title}" ont été mis à jour.`);
    setIsAssignModalOpen(false);
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
        coachId: user.id,
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
      const updatedFormations = clientFormations.filter((f) => f.id !== formationId);
      setClientFormations(updatedFormations);
      const updatedClients = clients.map((client) => {
        if (client.grantedFormationIds?.includes(formationId)) {
          return {
            ...client,
            grantedFormationIds: client.grantedFormationIds.filter((id) => id !== formationId),
          };
        }
        return client;
      });
      setClients(updatedClients);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          Gérez les formations et fichiers que vous souhaitez partager avec vos clients.
        </p>
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myFormations.length > 0 ? (
                myFormations.map((formation) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openAssignModal(formation)}
                        className="!p-2"
                        title="Gérer les accès client"
                      >
                        <UserGroupIcon className="w-4 h-4" />
                      </Button>
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
                  <td colSpan={4} className="text-center py-10 text-gray-500">
                    Vous n'avez aucune ressource pour vos clients.
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

      {isAssignModalOpen && formationToAssign && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Gérer l'accès pour "${formationToAssign.title}"`}
        >
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredClientsForModal.length > 0 ? (
                filteredClientsForModal.map((client) => (
                  <label
                    key={client.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded text-primary focus:ring-primary"
                      checked={selectedClientsForAccess.includes(client.id)}
                      onChange={() => handleToggleClientSelection(client.id)}
                    />
                    <span className="ml-3 text-sm font-medium">
                      {client.firstName} {client.lastName}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-center text-gray-500 p-4">Aucun client trouvé.</p>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveAccess}>Enregistrer les accès</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const ProfessionalFormationsTab: React.FC = () => {
  const { professionalFormations } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <p className="text-gray-600 mb-6">
        Développez vos compétences avec des formations exclusives créées pour les professionnels du
        coaching.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionalFormations.map((formation) => (
          <Card
            key={formation.id}
            className="flex flex-col cursor-pointer"
            onClick={() => navigate(`/app/formations/pro/${formation.id}`)}
          >
            <img
              src={formation.coverImageUrl}
              alt={formation.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-lg font-semibold text-gray-900 flex-grow">{formation.title}</h3>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xl font-bold text-primary">{formation.price} €</span>
                <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full capitalize">
                  {formation.accessType === 'purchase' ? 'Achat unique' : 'Abonnement'}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const CoachFormations: React.FC = () => {
  const [activeTab, setActiveTab] = useState('mes-formations');

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Formations</h1>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('mes-formations')}
            className={`${activeTab === 'mes-formations' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Mes Formations (pour mes clients)
          </button>
          <button
            onClick={() => setActiveTab('formations-pro')}
            className={`${activeTab === 'formations-pro' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Formations Professionnelles
          </button>
        </nav>
      </div>

      {activeTab === 'mes-formations' && <ClientFormationsTab />}
      {activeTab === 'formations-pro' && <ProfessionalFormationsTab />}
    </div>
  );
};

export default CoachFormations;
