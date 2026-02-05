import { ShoppingCart, Star, TrendingUp, Package, ChevronRight, Filter, Search } from 'lucide-react';
import { useState } from 'react';

const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartCount, setCartCount] = useState(0);

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
      badgeColor: 'violet',
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
      badgeColor: 'green',
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
      badgeColor: 'red',
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
      badgeColor: 'blue',
      inStock: true,
    },
  ];

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const getBadgeColor = (color: string) => {
    const colors = {
      violet: 'bg-violet-600/20 text-violet-400 border-violet-600/30',
      green: 'bg-green-600/20 text-green-400 border-green-600/30',
      red: 'bg-red-600/20 text-red-400 border-red-600/30',
      blue: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    };
    return colors[color as keyof typeof colors] || colors.violet;
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header avec panier */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Boutique</h1>
          <p className="text-gray-400 text-sm">Équipements et compléments</p>
        </div>
        <button className="relative bg-gradient-to-br from-violet-600 to-violet-500 rounded-full p-3 active:scale-95 transition-transform">
          <ShoppingCart size={20} className="text-white" />
          {cartCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">{cartCount}</span>
            </div>
          )}
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          className="w-full bg-gray-900/50 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-600 transition-colors"
        />
      </div>

      {/* Catégories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white'
                : 'bg-gray-900/50 border border-gray-800 text-gray-400'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Bannière promotionnelle */}
      <div className="bg-gradient-to-br from-violet-600/20 to-violet-600/5 border border-violet-600/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">🎁</div>
          <div className="flex-1">
            <h3 className="text-white text-sm font-bold mb-1">Offre spéciale</h3>
            <p className="text-violet-400 text-xs">-20% sur votre première commande</p>
          </div>
          <ChevronRight size={20} className="text-violet-400" />
        </div>
      </div>

      {/* Grille de produits */}
      <div className="grid grid-cols-2 gap-3">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-gradient-to-br from-gray-900/50 to-gray-900/20 border border-gray-800 rounded-xl p-3 active:scale-95 transition-transform"
          >
            {/* Badge */}
            {product.badge && (
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold mb-2 ${getBadgeColor(product.badgeColor || 'violet')}`}>
                {product.badge}
              </div>
            )}

            {/* Image produit */}
            <div className="bg-black/20 rounded-lg aspect-square flex items-center justify-center text-5xl mb-3">
              {product.image}
            </div>

            {/* Infos produit */}
            <div className="space-y-2">
              <h3 className="text-white text-sm font-bold line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <span className="text-white text-xs font-medium">{product.rating}</span>
                <span className="text-gray-500 text-[10px]">({product.reviews})</span>
              </div>

              {/* Prix */}
              <div className="flex items-baseline gap-2">
                <span className="text-white text-lg font-bold">{product.price}€</span>
                {product.originalPrice && (
                  <span className="text-gray-500 text-xs line-through">{product.originalPrice}€</span>
                )}
              </div>

              {/* Bouton */}
              {product.inStock ? (
                <button
                  onClick={() => setCartCount(cartCount + 1)}
                  className="w-full bg-gradient-to-r from-violet-600 to-violet-500 rounded-lg py-2 text-xs font-bold text-white active:scale-95 transition-transform"
                >
                  Ajouter au panier
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-800 rounded-lg py-2 text-xs font-bold text-gray-500 cursor-not-allowed"
                >
                  Rupture de stock
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Section avantages */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-4 space-y-3">
        <h3 className="text-white text-sm font-bold mb-3">Pourquoi commander chez Virtus ?</h3>
        
        <div className="flex items-start gap-3">
          <div className="bg-green-600/20 rounded-lg p-2">
            <Package size={18} className="text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-white text-xs font-medium mb-0.5">Livraison rapide</p>
            <p className="text-gray-500 text-[10px]">Expédition sous 24h</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-violet-600/20 rounded-lg p-2">
            <Star size={18} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-white text-xs font-medium mb-0.5">Qualité garantie</p>
            <p className="text-gray-500 text-[10px]">Produits testés et approuvés</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-blue-600/20 rounded-lg p-2">
            <TrendingUp size={18} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-white text-xs font-medium mb-0.5">Conseils d'experts</p>
            <p className="text-gray-500 text-[10px]">Recommandations personnalisées</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
