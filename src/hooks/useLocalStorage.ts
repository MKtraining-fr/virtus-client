import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer la sauvegarde automatique dans localStorage
 * @param key - Clé de stockage dans localStorage
 * @param initialValue - Valeur initiale si aucune donnée n'est trouvée
 * @returns [value, setValue, clearValue] - La valeur, la fonction de mise à jour, et la fonction de suppression
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void] {
  // State pour stocker la valeur
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Récupérer depuis localStorage
      const item = window.localStorage.getItem(key);
      // Parser le JSON stocké ou retourner initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // Fonction pour mettre à jour la valeur
  const setValue = (value: T) => {
    try {
      // Sauvegarder dans le state
      setStoredValue(value);
      // Sauvegarder dans localStorage
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Gérer spécifiquement l'erreur QuotaExceededError
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn(`localStorage quota exceeded for ${key}. Attempting cleanup...`);
        
        // Essayer de nettoyer les anciens brouillons
        try {
          // Supprimer les clés de brouillon anciennes (workout_draft_*)
          const keysToRemove: string[] = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const storageKey = window.localStorage.key(i);
            if (storageKey && storageKey.startsWith('workout_draft') && storageKey !== key) {
              keysToRemove.push(storageKey);
            }
          }
          
          keysToRemove.forEach(k => window.localStorage.removeItem(k));
          
          // Réessayer de sauvegarder
          window.localStorage.setItem(key, JSON.stringify(value));
          console.log(`Successfully saved ${key} after cleanup`);
        } catch (retryError) {
          console.error(`Failed to save ${key} even after cleanup:`, retryError);
          // Informer l'utilisateur (via console pour l'instant)
          console.error('CRITICAL: Unable to save draft. Please save your work manually.');
        }
      } else {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    }
  };

  // Fonction pour supprimer la valeur
  const clearValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error clearing ${key} from localStorage:`, error);
    }
  };

  return [storedValue, setValue, clearValue];
}

/**
 * Hook pour gérer la sauvegarde automatique d'un brouillon de programme/séance
 */
export function useWorkoutDraft() {
  const [draft, setDraft, clearDraft] = useLocalStorage('workout_draft', null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Mettre à jour l'heure de dernière sauvegarde
  useEffect(() => {
    if (draft) {
      setLastSaved(new Date());
    }
  }, [draft]);

  return {
    draft,
    saveDraft: setDraft,
    clearDraft,
    lastSaved,
  };
}
