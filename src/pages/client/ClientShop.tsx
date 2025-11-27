import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Partner, Product } from '../../types';

const PartnerCard: React.FC<{ partner: Partner }> = ({ partner }) => (
  <div className="bg-client-card rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 border border-gray-700">
    <img
      src={partner.logoUrl}
      alt={partner.name}
      className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-contain bg-white dark:bg-client-card p-1 flex-shrink-0"
    />
    <div className="flex-grow">
      <h3 className="text-xl sm:text-2xl font-bold text-client-light">{partner.name}</h3>
      <p className="text-client-subtle mt-2">{partner.description}</p>
    </div>
    <a
      href={partner.offerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full sm:w-auto mt-4 sm:mt-0 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg text-center hover:bg-violet-700 transition-colors"
    >
      Voir l'offre
    </a>
  </div>
);

const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
  <div className="bg-client-card rounded-lg overflow-hidden flex flex-col border border-gray-700/50 shadow-lg group">
    <div className="overflow-hidden">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-4 flex flex-col flex-grow">
      <h4 className="font-bold text-client-light flex-grow">{product.name}</h4>
      <div className="flex justify-between items-center mt-4">
        <span className="text-xl font-bold text-primary">{product.price} €</span>
        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-violet-700 transition-colors"
        >
          Voir
        </a>
      </div>
    </div>
  </div>
);

const ShopContent: React.FC<{ products: Product[]; partners: Partner[] }> = ({
  products,
  partners,
}) => {
  const productsByCategory = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        const category = product.category || 'Autres';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      },
      {} as Record<string, Product[]>
    );
  }, [products]);

  return (
    <div className="space-y-10">
      {Object.entries(productsByCategory).map(([category, items]) => (
        <section key={category}>
          <h2 className="text-2xl font-semibold text-client-light mb-4">{category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
      {partners.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold text-client-light mb-4">Offres Partenaires</h2>
          <div className="space-y-4">
            {partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const ClientShop: React.FC = () => {
  const { user, partners, products } = useAuth();

  const hasAdminAccess = user?.shopAccess?.adminShop ?? true;
  const hasCoachAccess = user?.shopAccess?.coachShop ?? true;
  const showTabs = hasAdminAccess && hasCoachAccess;

  const [activeTab, setActiveTab] = useState<'admin' | 'coach'>(hasAdminAccess ? 'admin' : 'coach');

  const adminProducts = useMemo(() => products.filter((p) => p.ownerId === 'admin'), [products]);
  const adminPartners = useMemo(() => partners.filter((p) => p.ownerId === 'admin'), [partners]);
  const coachProducts = useMemo(
    () => products.filter((p) => p.ownerId === user?.coachId),
    [products, user]
  );
  const coachPartners = useMemo(
    () => partners.filter((p) => p.ownerId === user?.coachId),
    [partners, user]
  );

  return (
    <div className="space-y-6">
      {showTabs && (
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('admin')}
              className={`${activeTab === 'admin' ? 'border-primary text-primary' : 'border-transparent text-client-subtle hover:text-client-light'} whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-base transition-colors`}
            >
              Boutique Générale
            </button>
            <button
              onClick={() => setActiveTab('coach')}
              className={`${activeTab === 'coach' ? 'border-primary text-primary' : 'border-transparent text-client-subtle hover:text-client-light'} whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-base transition-colors`}
            >
              Boutique du Coach
            </button>
          </nav>
        </div>
      )}

      {hasAdminAccess && activeTab === 'admin' && (
        <ShopContent products={adminProducts} partners={adminPartners} />
      )}
      {hasCoachAccess && activeTab === 'coach' && (
        <ShopContent products={coachProducts} partners={coachPartners} />
      )}

      {!hasAdminAccess && !hasCoachAccess && (
        <div className="text-center py-16 bg-client-card rounded-lg">
          <p className="text-client-light text-lg">Vous n'avez pas accès à la boutique.</p>
        </div>
      )}
    </div>
  );
};

export default ClientShop;
