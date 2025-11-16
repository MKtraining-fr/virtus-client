import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
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

const BilanArchive: React.FC = () => {
  const { user, clients: allClients, setClients, updateUser, deleteUser } = useAuth();
  const [selectedArchives, setSelectedArchives] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBilan, setSelectedBilan] = useState<Client | null>(null);
  const navigate = useNavigate();

  const archives = useMemo(() => {
    const prospectClients = allClients.filter((p) => p.status === 'prospect');
    if (user?.role === 'coach') {
      return prospectClients.filter((c) => c.coachId === user.id);
    }
    return prospectClients;
  }, [allClients, user]);

  const {
    items: sortedArchives,
    requestSort,
    getSortDirection,
  } = useSortableData(archives, { key: 'registrationDate', direction: 'descending' });

  const handleBilanClick = (bilan: Client) => {
    setSelectedBilan(bilan);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBilan(null);
  };

  const handleValidateBilan = async (bilanId: string) => {
    try {
      // Mettre à jour le statut dans Supabase
      await updateUser(bilanId, {
        status: 'active',
        coachId: selectedBilan?.coachId || user?.id,
      });

      alert(`Bilan de ${selectedBilan?.firstName} validé. Le prospect est maintenant un client.`);
      closeModal();
      navigate(`/app/client/${bilanId}`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Une erreur inconnue est survenue.');
      alert(`Erreur lors de la validation: ${err.message}`);
    }
  };

  const handleDeleteBilan = async (bilanId: string) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement ce bilan ? Cette action est irréversible.`
      )
    ) {
      try {
        await deleteUser(bilanId);
        alert(
          `Bilan de ${selectedBilan?.firstName} ${selectedBilan?.lastName} supprimé avec succès.`
        );
        closeModal();
      } catch (error) {
        console.error('Erreur lors de la suppression du bilan:', error);
        alert('Erreur lors de la suppression du bilan. Veuillez réessayer.');
      }
    }
  };

  const handleValidateSelected = async () => {
    if (selectedArchives.length === 0) return;
    const count = selectedArchives.length;
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir valider ${count} bilan(s) ? Les prospects deviendront des clients.`
      )
    ) {
      try {
        // Mettre à jour tous les prospects sélectionnés en parallèle
        await Promise.all(
          selectedArchives.map((bilanId) => {
            const client = allClients.find((c) => c.id === bilanId);
            return updateUser(bilanId, {
              status: 'active',
              coachId: client?.coachId || user?.id,
            });
          })
        );

        setSelectedArchives([]);
        alert(`${count} bilan(s) validé(s) avec succès.`);
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Une erreur inconnue est survenue.');
        alert(`Erreur lors de la validation: ${err.message}`);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedArchives.length === 0) return;
    const count = selectedArchives.length;
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer ${count} bilan(s) ? Cette action est irréversible.`
      )
    ) {
      try {
        for (const bilanId of selectedArchives) {
          await deleteUser(bilanId);
        }
        setSelectedArchives([]);
        alert(`${count} bilan(s) supprimé(s) avec succès.`);
      } catch (error) {
        console.error('Erreur lors de la suppression des bilans:', error);
        alert('Erreur lors de la suppression des bilans. Veuillez réessayer.');
      }
    }
  };

  const filteredArchives = useMemo(() => {
    if (!filter) return sortedArchives;
    return sortedArchives.filter(
      (archive) =>
        archive.lastName.toLowerCase().includes(filter.toLowerCase()) ||
        archive.firstName.toLowerCase().includes(filter.toLowerCase()) ||
        archive.phone.toLowerCase().includes(filter.toLowerCase())
    );
  }, [sortedArchives, filter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedArchives(filteredArchives.map((a) => a.id));
    } else {
      setSelectedArchives([]);
    }
  };

  const handleSelectOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedArchives((prev) =>
      prev.includes(id) ? prev.filter((archiveId) => archiveId !== id) : [...prev, id]
    );
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
        <h1 className="text-3xl font-bold text-gray-800">Bilans Archivés</h1>
        <div>
          <Button
            variant="primary"
            className="mr-2"
            onClick={handleValidateSelected}
            disabled={selectedArchives.length === 0}
          >
            Valider la sélection
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteSelected}
            disabled={selectedArchives.length === 0}
          >
            Supprimer la sélection
          </Button>
        </div>
      </div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Filtrer les bilans..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-400">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredArchives.length > 0 &&
                      selectedArchives.length === filteredArchives.length
                    }
                    disabled={filteredArchives.length === 0}
                  />
                </th>
                {renderHeader('Nom', 'lastName')}
                {renderHeader('Prénom', 'firstName')}
                {renderHeader('Âge', 'age')}
                {renderHeader('Téléphone', 'phone')}
                {renderHeader('Date du bilan', 'registrationDate')}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredArchives.map((archive) => (
                <tr
                  key={archive.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleBilanClick(archive)}
                >
                  <td className="p-4" onClick={(e) => handleSelectOne(e, archive.id)}>
                    <input
                      type="checkbox"
                      checked={selectedArchives.includes(archive.id)}
                      readOnly
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {archive.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {archive.firstName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {archive.age}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {archive.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(archive.registrationDate).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {selectedBilan && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={`Bilan de ${selectedBilan.firstName} ${selectedBilan.lastName}`}
        >
          <div className="space-y-2">
            <p>
              <strong>Date:</strong> {selectedBilan.registrationDate}
            </p>
            <p>
              <strong>Email:</strong> {selectedBilan.email}
            </p>
            <p>
              <strong>Téléphone:</strong> {selectedBilan.phone}
            </p>
            <p>
              <strong>Objectif principal:</strong> {selectedBilan.objective}
            </p>
            {selectedBilan.notes && (
              <p>
                <strong>Notes:</strong> {selectedBilan.notes}
              </p>
            )}

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => alert('Fonctionnalité à implémenter')}>
                Modifier
              </Button>
              <Button variant="danger" onClick={() => handleDeleteBilan(selectedBilan.id)}>
                Supprimer
              </Button>
              <Button onClick={() => handleValidateBilan(selectedBilan.id)}>Valider</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BilanArchive;
