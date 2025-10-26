import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { useSortableData } from '../hooks/useSortableData';

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
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  const clients = useMemo(() => {
    const activeClients = allClients.filter((p) => p.status === 'active' && p.role === 'client');
    if (user?.role === 'coach') {
      return activeClients.filter((c) => c.coachId === user.id);
    }
    return activeClients;
  }, [allClients, user]);

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

  const handleArchiveSelected = () => {
    if (selectedClients.length === 0) return;
    const count = selectedClients.length;
    if (window.confirm(`Êtes-vous sûr de vouloir archiver ${count} client(s) ?`)) {
      const updatedClients = allClients.map(
        (c): Client => (selectedClients.includes(c.id) ? { ...c, status: 'archived' } : c)
      );
      setClients(updatedClients);
      setSelectedClients([]);
      alert(`${count} client(s) archivé(s) avec succès.`);
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
        <div>
          <Button
            variant="secondary"
            className="mr-2"
            onClick={() => reloadData()}
            disabled={isDataLoading}
          >
            {isDataLoading ? 'Actualisation...' : '🔄 Actualiser'}
          </Button>
          <Button
            variant="secondary"
            className="mr-2"
            onClick={handleArchiveSelected}
            disabled={selectedClients.length === 0}
          >
            Archiver
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteSelected}
            disabled={selectedClients.length === 0}
          >
            Supprimer
          </Button>
        </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Clients;
