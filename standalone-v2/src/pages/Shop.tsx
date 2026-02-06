import { ShoppingCart, Star, TrendingUp, Package, ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { Card, Button, Badge, Input } from '../components/ui';

const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Catégories
  const categories = [
    { id: 'all', name: 'Tout', icon: '🛍️' },
    { id: 'protein', name: 'Protéines', icon: '💪' },
    { id: 'supplements', name: 'Compléments', icon: '💊' },
    { id: 'equipment', name: 'Équipement', icon: '🏋️' },
    { id: 'accessories', name: 'Accessoires', icon: '🎽' },
  ];

  // Produits mockés
  const products = [
    {
      id: 1,
      name: 'Whey Protein Isolate',
      category: 'protein',
      price: 49.99,
      originalPrice: 59.99,
      rating: 4.8,
      reviews: 1250,
      image: '🥛',
      badge: 'Bestseller',
      badgeVariant: 'default' as const,
      inStock: true,
    },
    {
      id: 2,
      name: 'Créatine Monohydrate',
      category: 'supplements',
      price: 24.99,
      rating: 4.9,
      reviews: 890,
      image: '⚡',
      badge: 'Recommandé',
      badgeVariant: 'success' as const,
      inStock: true,
    },
    {
      id: 3,
      name: 'Bandes de Résistance Pro',
      category: 'equipment',
      price: 34.99,
      originalPrice: 44.99,
      rating: 4.7,
      reviews: 456,
      image: '🎯',
      badge: '-22%',
      badgeVariant: 'error' as const,
      inStock: true,
    },
    {
      id: 4,
      name: 'BCAA Energy',
      category: 'supplements',
      price: 29.99,
      rating: 4.6,
      reviews: 678,
      image: '🔋',
      inStock: true,
    },
    {
      id: 5,
      name: 'Gants d\'entraînement',
      category: 'accessories',
      price: 19.99,
      rating: 4.5,
      reviews: 234,
      image: '🧤',
      inStock: false,
    },
    {
      id: 6,
      name: 'Pre-Workout Extreme',
      category: 'supplements',
      price: 39.99,
      rating: 4.7,
      reviews: 1100,
      image: '🚀',
      badge: 'Nouveau',
      badgeVariant: 'info' as const,
      inStock: true,
    },
  ];

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header avec panier */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary dark:text-text-primary mb-1">Boutique</h1>
          <p className="text-text-tertiary dark:text-text-tertiary text-sm">Équipements et compléments</p>
        </div>
        <button className="relative bg-gradient-to-br from-brand-600 to-brand-500 rounded-full p-3 active:scale-95 transition-transform shadow-lg">
          <ShoppingCart size={20} className="text-white" />
          {cartCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">{cartCount}</span>
            </div>
          )}
        </button>
      </div>

      {/* Barre de recherche */}
      <Input
        type="text"
        placeholder="Rechercher un produit..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        icon={<Search size={18} />}
        fullWidth
      />

      {/* Catégories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg'
                : 'bg-bg-card dark:bg-bg-card border border-border dark:border-border text-text-tertiary dark:text-text-tertiary'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Bannière promotionnelle */}
      <Card variant="elevated" padding="md" clickable>
        <div className="flex items-center gap-3">
          <div className="text-4xl">🎁</div>
          <div className="flex-1">
            <h3 className="text-text-primary dark:text-text-primary text-sm font-black mb-1">Offre spéciale</h3>
            <p className="text-brand-400 text-xs">-20% sur votre première commande</p>
          </div>
          <ChevronRight size={20} className="text-brand-400" />
        </div>
      </Card>

      {/* Grille de produits */}
      <div className="grid grid-cols-2 gap-3">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            variant="elevated"
            padding="sm"
            clickable
          >
            {/* Badge */}
            {product.badge && (
              <div className="mb-2">
                <Badge variant={product.badgeVariant} size="sm">
                  {product.badge}
                </Badge>
              </div>
            )}

            {/* Image produit */}
            <div className="bg-bg-secondary dark:bg-bg-secondary rounded-lg aspect-square flex items-center justify-center text-5xl mb-3">
              {product.image}
            </div>

            {/* Infos produit */}
            <div className="space-y-2">
              <h3 className="text-text-primary dark:text-text-primary text-sm font-black line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <span className="text-text-primary dark:text-text-primary text-xs font-medium">{product.rating}</span>
                <span className="text-text-tertiary dark:text-text-tertiary text-[10px]">({product.reviews})</span>
              </div>

              {/* Prix */}
              <div className="flex items-baseline gap-2">
                <span className="text-text-primary dark:text-text-primary text-lg font-black">{product.price}€</span>
                {product.originalPrice && (
                  <span className="text-text-tertiary dark:text-text-tertiary text-xs line-through">{product.originalPrice}€</span>
                )}
              </div>

              {/* Bouton */}
              {product.inStock ? (
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => setCartCount(cartCount + 1)}
                >
                  Ajouter au panier
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  disabled
                >
                  Rupture de stock
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Section avantages */}
      <Card variant="elevated" padding="md">
        <h3 className="text-text-primary dark:text-text-primary text-sm font-black mb-3">Pourquoi commander chez Virtus ?</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-green-600/20 rounded-lg p-2">
              <Package size={18} className="text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-text-primary dark:text-text-primary text-xs font-medium mb-0.5">Livraison rapide</p>
              <p className="text-text-tertiary dark:text-text-tertiary text-[10px]">Expédition sous 24h</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-brand-600/20 rounded-lg p-2">
              <Star size={18} className="text-brand-400" />
            </div>
            <div className="flex-1">
              <p className="text-text-primary dark:text-text-primary text-xs font-medium mb-0.5">Qualité garantie</p>
              <p className="text-text-tertiary dark:text-text-tertiary text-[10px]">Produits testés et approuvés</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-600/20 rounded-lg p-2">
              <TrendingUp size={18} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-text-primary dark:text-text-primary text-xs font-medium mb-0.5">Conseils d'experts</p>
              <p className="text-text-tertiary dark:text-text-tertiary text-[10px]">Recommandations personnalisées</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Shop;
