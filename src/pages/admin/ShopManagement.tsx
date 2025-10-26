import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Partner, Product } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';

const initialPartnerState: Omit<Partner, 'id' | 'ownerId'> = {
  name: '',
  logoUrl: '',
  description: '',
  offerUrl: '',
};
const initialProductState: Omit<Product, 'id' | 'ownerId'> = {
  name: '',
  description: '',
  imageUrl: '',
  productUrl: '',
  price: 0,
  category: '',
};

const ShopManagement: React.FC = () => {
  const { partners, setPartners, products, setProducts } = useAuth();
  const [activeTab, setActiveTab] = useState<'partners' | 'products'>('partners');

  // Modal state for partners
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerModalMode, setPartnerModalMode] = useState<'add' | 'edit'>('add');
  const [currentPartner, setCurrentPartner] = useState<Partial<Partner> | null>(null);

  // Modal state for products
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'add' | 'edit'>('add');
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);

  const adminPartners = useMemo(() => partners.filter((p) => p.ownerId === 'admin'), [partners]);
  const adminProducts = useMemo(() => products.filter((p) => p.ownerId === 'admin'), [products]);

  // --- Partner Handlers ---
  const openPartnerModal = (mode: 'add' | 'edit', partner: Partial<Partner> | null = null) => {
    setPartnerModalMode(mode);
    setCurrentPartner(mode === 'add' ? { ...initialPartnerState } : partner);
    setIsPartnerModalOpen(true);
  };

  const handleSavePartner = () => {
    if (!currentPartner || !currentPartner.name) return alert('Le nom du partenaire est requis.');
    if (partnerModalMode === 'add') {
      const newPartner: Partner = {
        ...initialPartnerState,
        ...currentPartner,
        id: `part-${Date.now()}`,
        ownerId: 'admin',
      };
      setPartners([...partners, newPartner]);
    } else {
      setPartners(
        partners.map((p) => (p.id === currentPartner.id ? (currentPartner as Partner) : p))
      );
    }
    setIsPartnerModalOpen(false);
  };

  const handleDeletePartner = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce partenaire ?')) {
      setPartners(partners.filter((p) => p.id !== id));
    }
  };

  // --- Product Handlers ---
  const openProductModal = (mode: 'add' | 'edit', product: Partial<Product> | null = null) => {
    setProductModalMode(mode);
    setCurrentProduct(mode === 'add' ? { ...initialProductState } : product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (!currentProduct || !currentProduct.name) return alert('Le nom du produit est requis.');
    if (productModalMode === 'add') {
      const newProduct: Product = {
        ...initialProductState,
        ...currentProduct,
        id: `prod-${Date.now()}`,
        ownerId: 'admin',
      };
      setProducts([...products, newProduct]);
    } else {
      setProducts(
        products.map((p) => (p.id === currentProduct.id ? (currentProduct as Product) : p))
      );
    }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-black mb-6">Gestion de la Boutique & Partenariats</h1>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('partners')}
            className={`${activeTab === 'partners' ? 'border-primary text-primary' : 'border-transparent text-gray-700 hover:text-black hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Gérer les Partenaires
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`${activeTab === 'products' ? 'border-primary text-primary' : 'border-transparent text-gray-700 hover:text-black hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Gérer les Produits
          </button>
        </nav>
      </div>

      {activeTab === 'partners' && (
        <div>
          <Button onClick={() => openPartnerModal('add')} className="mb-4">
            Ajouter un partenaire
          </Button>
          <Card>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-800">Nom</th>
                  <th className="p-3 text-left font-semibold text-gray-800">
                    Description de l'offre
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminPartners.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-medium text-black">{p.name}</td>
                    <td className="p-3 text-sm text-gray-800">{p.description}</td>
                    <td className="p-3 space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openPartnerModal('edit', p)}
                      >
                        Modifier
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeletePartner(p.id)}>
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {activeTab === 'products' && (
        <div>
          <Button onClick={() => openProductModal('add')} className="mb-4">
            Ajouter un produit
          </Button>
          <Card>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-800">Produit</th>
                  <th className="p-3 text-left font-semibold text-gray-800">Catégorie</th>
                  <th className="p-3 text-left font-semibold text-gray-800">Prix</th>
                  <th className="p-3 text-left font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-medium text-black">{p.name}</td>
                    <td className="p-3 text-gray-800">{p.category}</td>
                    <td className="p-3 text-gray-800">{p.price} €</td>
                    <td className="p-3 space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openProductModal('edit', p)}
                      >
                        Modifier
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteProduct(p.id)}>
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {isPartnerModalOpen && currentPartner && (
        <Modal
          isOpen={isPartnerModalOpen}
          onClose={() => setIsPartnerModalOpen(false)}
          title={partnerModalMode === 'add' ? 'Ajouter Partenaire' : 'Modifier Partenaire'}
        >
          <div className="space-y-4">
            <Input
              label="Nom du Partenaire"
              value={currentPartner.name || ''}
              onChange={(e) =>
                setCurrentPartner((p) => (p ? { ...p, name: e.target.value } : null))
              }
            />
            <Input
              label="URL du Logo"
              value={currentPartner.logoUrl || ''}
              onChange={(e) =>
                setCurrentPartner((p) => (p ? { ...p, logoUrl: e.target.value } : null))
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description de l'offre
              </label>
              <textarea
                value={currentPartner.description || ''}
                onChange={(e) =>
                  setCurrentPartner((p) => (p ? { ...p, description: e.target.value } : null))
                }
                rows={3}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Ex: -15% avec le code..."
              ></textarea>
            </div>
            <Input
              label="URL de l'offre (site partenaire)"
              value={currentPartner.offerUrl || ''}
              onChange={(e) =>
                setCurrentPartner((p) => (p ? { ...p, offerUrl: e.target.value } : null))
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button variant="secondary" onClick={() => setIsPartnerModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSavePartner}>Enregistrer</Button>
          </div>
        </Modal>
      )}

      {isProductModalOpen && currentProduct && (
        <Modal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          title={productModalMode === 'add' ? 'Ajouter Produit' : 'Modifier Produit'}
        >
          <div className="space-y-4">
            <Input
              label="Nom du Produit"
              value={currentProduct.name || ''}
              onChange={(e) =>
                setCurrentProduct((p) => (p ? { ...p, name: e.target.value } : null))
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={currentProduct.description || ''}
                onChange={(e) =>
                  setCurrentProduct((p) => (p ? { ...p, description: e.target.value } : null))
                }
                rows={3}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              ></textarea>
            </div>
            <Input
              label="URL de l'image"
              value={currentProduct.imageUrl || ''}
              onChange={(e) =>
                setCurrentProduct((p) => (p ? { ...p, imageUrl: e.target.value } : null))
              }
            />
            <Input
              label="URL du produit (lien d'achat)"
              value={currentProduct.productUrl || ''}
              onChange={(e) =>
                setCurrentProduct((p) => (p ? { ...p, productUrl: e.target.value } : null))
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prix (€)"
                type="number"
                value={currentProduct.price || 0}
                onChange={(e) =>
                  setCurrentProduct((p) => (p ? { ...p, price: Number(e.target.value) } : null))
                }
              />
              <Input
                label="Catégorie"
                value={currentProduct.category || ''}
                onChange={(e) =>
                  setCurrentProduct((p) => (p ? { ...p, category: e.target.value } : null))
                }
                placeholder="Ex: Vêtements, Compléments..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button variant="secondary" onClick={() => setIsProductModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveProduct}>Enregistrer</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ShopManagement;
