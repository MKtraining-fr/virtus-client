import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { useSortableData } from '../hooks/useSortableData';
import InviteClientModal, { InviteClientData } from '../components/InviteClientModal';
import { useDataStore } from '../stores/useDataStore';

const SortIcon = ({ direction }: { direction: 'ascending' | 'descending' | null }) => {
  return (
    <span className="inline-block w-4 h-4 ml-1">
      {direction === 'ascending' && '▲'}
      {direction === 'descending' && '▼'}
    </span>
  );
};

const Clients: React.FC = () => {
  const {
    user,
    clients: allClients,
    setClients,
    reloadData,
    isDataLoading,
    deleteUser,
    resendInvitation,
  } = useAuth();
  const { inviteClient } = useDataStore();
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const handleInviteClient = async (data: InviteClientData) => {
    try {
      await inviteClient(data);
      alert(`\u2705 Invitation envoy\u00e9e avec succ\u00e8s \u00e0 ${data.email}\n\nLe client recevra un email lui permettant de d\u00e9finir son mot de passe.`);
      await reloadData();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Une erreur inconnue est survenue.');
      throw err;
    }
  };
  const navigate = useNavigate();

  const clients = useMemo(() => {
    const filteredByStatus = allClients.filter((p) => p.status === activeTab && p.role === 'client');
    if (user?.role === 'coach') {
      return filteredByStatus.filter((c) => c.coachId === user.id);
    }
    return filteredByStatus;
  }, [allClients, user, activeTab]);

  const {
    items: sortedClients,
    requestSort,
    getSortDirection,
  } = useSortableData(clients, { key: 'lastName', direction: 'ascending' });

  const filteredClients = useMemo(() => {
    if (!filter) return sortedClients;
    return sortedClients.filter(
      (client) =>
        client.lastName?.toLowerCase().includes(filter.toLowerCase()) ||
        client.firstName?.toLowerCase().includes(filter.toLowerCase()) ||
        client.email?.toLowerCase().includes(filter.toLowerCase()) ||
        client.phone?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [sortedClients, filter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClients(filteredClients.map((c) => c.id!));
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((clientId) => clientId !== id) : [...prev, id]
    );
  };

  const handleRowClick = (clientId: string) => {
    navigate(`/app/client/${clientId}`);
  };

  const handleArchiveSelected = async () => {
    if (selectedClients.length === 0) return;
    const count = selectedClients.length;
    const action = activeTab === 'active' ? 'archiver' : 'désarchiver';
    const newStatus = activeTab === 'active' ? 'archived' : 'active';

    if (window.confirm(`Êtes-vous sûr de vouloir ${action} ${count} client(s) ?`)) {
      try {
        const { updateUser, addNotification } = useDataStore.getState();
        for (const clientId of selectedClients) {
          const updateData: any = { status: newStatus };
          if (newStatus === 'archived') {
            updateData.archived_at = new Date().toISOString();
          } else if (newStatus === 'active') {
            updateData.archived_at = null;
          }
          await updateUser(clientId, updateData);
          
          if (newStatus === 'archived') {
            // Envoyer une notification au client archivé
            await addNotification({
              userId: clientId,
              title: 'Compte archivé',
              message: 'Votre compte a été archivé par votre coach. Vous perdrez l\'accès à votre interface dans 7 jours. Vous pouvez choisir de passer en statut indépendant ou de supprimer définitivement votre profil.',
              type: 'warning',
              fromName: 'Virtus'
            });
          }
        }
        setSelectedClients([]);
        alert(`${count} client(s) ${activeTab === 'active' ? 'archivé(s)' : 'désarchivé(s)'} avec succès.`);
      } catch (error) {
        console.error(`Erreur lors de l'action ${action}:`, error);
        alert(`Une erreur est survenue lors de l'action ${action}.`);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedClients.length === 0) return;
    const count = selectedClients.length;
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement ${count} client(s) ? Cette action est irréversible.`
      )
    ) {
      try {
        // Supprimer chaque client de Supabase
        for (const clientId of selectedClients) {
          await deleteUser(clientId);
        }
        setSelectedClients([]);
        alert(`${count} client(s) supprimé(s) avec succès.`);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression des clients. Veuillez réessayer.');
      }
    }
  };

  const renderHeader = (label: string, key: keyof Client) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <button onClick={() => requestSort(key)} className="flex items-center hover:text-gray-700">
        {label}
        <SortIcon direction={getSortDirection(key)} />
      </button>
    </th>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mes Clients</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => setIsInviteModalOpen(true)}
          >
            + Inviter un client
          </Button>
          <Button
            variant="secondary"
            onClick={() => reloadData()}
            disabled={isDataLoading}
          >
            {isDataLoading ? 'Actualisation...' : '🔄 Actualiser'}
          </Button>
          {activeTab === 'active' ? (
            <Button
              variant="secondary"
              onClick={handleArchiveSelected}
              disabled={selectedClients.length === 0}
            >
              Archiver
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={handleArchiveSelected}
                disabled={selectedClients.length === 0}
              >
                Réintégrer
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteSelected}
                disabled={selectedClients.length === 0}
              >
                Supprimer
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm transition-colors duration-200 ${
            activeTab === 'active'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setActiveTab('active');
            setSelectedClients([]);
          }}
        >
          Clients Actifs
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm transition-colors duration-200 ${
            activeTab === 'archived'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setActiveTab('archived');
            setSelectedClients([]);
          }}
        >
          Archives
        </button>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Filtrer les clients..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredClients.length > 0 &&
                      selectedClients.length === filteredClients.length
                    }
                    disabled={filteredClients.length === 0}
                  />
                </th>
                {renderHeader('Nom', 'lastName')}
                {renderHeader('Prénom', 'firstName')}
                {renderHeader('Âge', 'age')}
                {renderHeader('Sexe', 'sex')}
                {renderHeader('Email', 'email')}
                {renderHeader('Téléphone', 'phone')}
                {activeTab === 'active' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(client.id!)}
                >
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      onChange={() => handleSelectOne(client.id!)}
                      checked={selectedClients.includes(client.id!)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.firstName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.age}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.sex}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.phone}
                  </td>
                  {activeTab === 'active' && (
                    <td
                      className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="secondary"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!client.email) {
                            alert("L'adresse email du client est manquante.");
                            return;
                          }

                          try {
                            await resendInvitation(client.email);
                            alert(
                              `✅ Email d'invitation envoyé avec succès à ${client.email}\n\nLe client recevra un email lui permettant de définir son mot de passe.`
                            );
                          } catch (error: unknown) {
                            const err =
                              error instanceof Error
                                ? error
                                : new Error('Une erreur inconnue est survenue.');
                            console.error("Erreur lors du renvoi de l'invitation:", err);

                            // Gérer les erreurs spécifiques
                            let errorMessage = "Une erreur est survenue lors de l'envoi de l'email.";

                            if (err.message) {
                              if (err.message.includes('rate limit')) {
                                errorMessage =
                                  "⚠️ Trop de tentatives d'envoi.\n\nVeuillez réessayer dans quelques minutes.";
                              } else if (err.message.includes('SMTP')) {
                                errorMessage =
                                  "⚠️ Erreur de configuration email.\n\nLe service SMTP n'est pas configuré. Veuillez consulter le guide CONFIGURATION_BREVO_SMTP.md pour configurer Brevo SMTP dans Supabase.";
                              } else if (err.message.includes('not found')) {
                                errorMessage =
                                  "⚠️ Utilisateur non trouvé.\n\nCette adresse email n'est pas enregistrée dans le système d'authentification.";
                              } else {
                                errorMessage = `❌ Erreur: ${err.message}`;
                              }
                            }

                            alert(errorMessage);
                          }
                        }}
                      >
                        Renvoyer l'invitation
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal d'invitation */}
      <InviteClientModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteClient}
      />
    </div>
  );
};

export default Clients;
