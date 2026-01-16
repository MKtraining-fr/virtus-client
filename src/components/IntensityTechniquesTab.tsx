import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { IntensityTechnique, CreateIntensityTechniqueInput } from '../types/intensityTechnique';
import {
  getAllTechniques,
  createTechnique,
  updateTechnique,
  archiveTechnique,
} from '../services/intensityTechniqueService';
import Card from './Card';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Select from './Select';

const IntensityTechniquesTab: React.FC = () => {
  const { user } = useAuth();
  const [techniques, setTechniques] = useState<IntensityTechnique[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTechnique, setSelectedTechnique] = useState<IntensityTechnique | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [newTechnique, setNewTechnique] = useState<CreateIntensityTechniqueInput>({
    name: '',
    description: '',
    category: 'series',
    protocol: '',
    adaptation_type: 'informative',
  });

  useEffect(() => {
    if (user?.id) {
      loadTechniques();
    }
  }, [user?.id]);

  const loadTechniques = async () => {
    try {
      setLoading(true);
      const data = await getAllTechniques(user!.id);
      setTechniques(data);
    } catch (error) {
      console.error('Erreur lors du chargement des techniques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (technique: IntensityTechnique) => {
    setSelectedTechnique(technique);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedTechnique(null);
  };

  const openAddModal = () => {
    setNewTechnique({
      name: '',
      description: '',
      category: 'series',
      protocol: '',
      adaptation_type: 'informative',
    });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewTechnique((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string | string[]) => {
    setNewTechnique((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      await createTechnique(newTechnique, user.id);
      await loadTechniques();
      closeAddModal();
    } catch (error) {
      console.error('Erreur lors de la création de la technique:', error);
      alert('Erreur lors de la création de la technique');
    }
  };

  const handleArchive = async (id: string) => {
    if (!user?.id) return;
    if (!confirm('Êtes-vous sûr de vouloir archiver cette technique ?')) return;

    try {
      await archiveTechnique(id, user.id);
      await loadTechniques();
      closeViewModal();
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      alert('Erreur lors de l\'archivage de la technique');
    }
  };

  // Filtrage
  const filteredTechniques = techniques.filter((technique) => {
    const matchesSearch =
      technique.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      technique.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || technique.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      series: 'Séries',
      failure: 'Échec',
      partial: 'Partiel',
      tempo: 'Tempo',
      periodization: 'Périodisation',
      advanced: 'Avancé',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      series: 'bg-blue-100 text-blue-800',
      failure: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      tempo: 'bg-green-100 text-green-800',
      periodization: 'bg-purple-100 text-purple-800',
      advanced: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header avec recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Rechercher une technique..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Select
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value as string)}
            className="min-w-[150px]"
          >
            <option value="all">Toutes catégories</option>
            <option value="series">Séries</option>
            <option value="failure">Échec</option>
            <option value="partial">Partiel</option>
            <option value="tempo">Tempo</option>
            <option value="periodization">Périodisation</option>
            <option value="advanced">Avancé</option>
          </Select>
          <Button onClick={openAddModal}>Ajouter une technique</Button>
        </div>
      </div>

      {/* Liste des techniques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTechniques.map((technique) => (
          <Card
            key={technique.id}
            onClick={() => handleCardClick(technique)}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-lg">{technique.name}</h3>
                {!technique.is_public && (
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                    Personnalisée
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{technique.description}</p>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(technique.category)}`}>
                  {getCategoryLabel(technique.category)}
                </span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {technique.adaptation_type === 'informative' ? 'Informatif' : 'Avec config'}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTechniques.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune technique trouvée
        </div>
      )}

      {/* Modal de visualisation */}
      <Modal isOpen={isViewModalOpen} onClose={closeViewModal} title={selectedTechnique?.name || ''}>
        {selectedTechnique && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Description</h4>
              <p className="text-gray-900">{selectedTechnique.description}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Protocole</h4>
              <p className="text-gray-900">{selectedTechnique.protocol}</p>
            </div>
            <div className="flex gap-2">
              <span className={`text-sm px-3 py-1 rounded ${getCategoryColor(selectedTechnique.category)}`}>
                {getCategoryLabel(selectedTechnique.category)}
              </span>
              {selectedTechnique.is_public ? (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded">
                  Technique système
                </span>
              ) : (
                <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded">
                  Technique personnalisée
                </span>
              )}
            </div>
            {!selectedTechnique.is_public && (
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="danger" onClick={() => handleArchive(selectedTechnique.id)}>
                  Archiver
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal d'ajout */}
      <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title="Ajouter une technique">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom de la technique"
            name="name"
            value={newTechnique.name}
            onChange={handleFormChange}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={newTechnique.description}
              onChange={handleFormChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Protocole</label>
            <textarea
              name="protocol"
              value={newTechnique.protocol}
              onChange={handleFormChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <Select
            label="Catégorie"
            value={newTechnique.category}
            onChange={handleSelectChange('category')}
          >
            <option value="series">Séries</option>
            <option value="failure">Échec</option>
            <option value="partial">Partiel</option>
            <option value="tempo">Tempo</option>
            <option value="periodization">Périodisation</option>
            <option value="advanced">Avancé</option>
          </Select>
          <Select
            label="Type d'adaptation"
            value={newTechnique.adaptation_type}
            onChange={handleSelectChange('adaptation_type')}
          >
            <option value="informative">Informatif (affichage simple)</option>
            <option value="extra_fields">Avec configuration (champs supplémentaires)</option>
          </Select>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={closeAddModal}>
              Annuler
            </Button>
            <Button type="submit">Créer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IntensityTechniquesTab;
