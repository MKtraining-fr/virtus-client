import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

type ItemType = 'exercise' | 'food';

interface Favorite {
  id: string;
  user_id: string;
  item_id: string;
  item_type: ItemType;
  created_at: string;
}

interface UseFavoritesReturn {
  favorites: Set<string>;
  isLoading: boolean;
  error: string | null;
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (itemId: string) => Promise<void>;
  addFavorite: (itemId: string) => Promise<void>;
  removeFavorite: (itemId: string) => Promise<void>;
}

export const useFavorites = (userId: string | undefined, itemType: ItemType): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les favoris de l'utilisateur
  useEffect(() => {
    const loadFavorites = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('user_favorites')
          .select('item_id')
          .eq('user_id', userId)
          .eq('item_type', itemType);

        if (fetchError) {
          throw fetchError;
        }

        const favoriteIds = new Set(data?.map((f: { item_id: string }) => f.item_id) || []);
        setFavorites(favoriteIds);
      } catch (err) {
        console.error('[useFavorites] Erreur lors du chargement des favoris:', err);
        setError('Erreur lors du chargement des favoris');
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [userId, itemType]);

  const isFavorite = useCallback((itemId: string): boolean => {
    return favorites.has(itemId);
  }, [favorites]);

  const addFavorite = useCallback(async (itemId: string): Promise<void> => {
    if (!userId) return;

    try {
      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          item_id: itemId,
          item_type: itemType,
        });

      if (insertError) {
        // Ignorer l'erreur de doublon (23505)
        if (insertError.code !== '23505') {
          throw insertError;
        }
      }

      setFavorites((prev) => new Set([...prev, itemId]));
    } catch (err) {
      console.error('[useFavorites] Erreur lors de l\'ajout du favori:', err);
      throw err;
    }
  }, [userId, itemType]);

  const removeFavorite = useCallback(async (itemId: string): Promise<void> => {
    if (!userId) return;

    try {
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      if (deleteError) {
        throw deleteError;
      }

      setFavorites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    } catch (err) {
      console.error('[useFavorites] Erreur lors de la suppression du favori:', err);
      throw err;
    }
  }, [userId, itemType]);

  const toggleFavorite = useCallback(async (itemId: string): Promise<void> => {
    if (isFavorite(itemId)) {
      await removeFavorite(itemId);
    } else {
      await addFavorite(itemId);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return {
    favorites,
    isLoading,
    error,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  };
};

export default useFavorites;
