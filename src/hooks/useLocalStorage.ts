import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer la sauvegarde automatique dans localStorage
 * @param key - Clé de stockage dans localStorage
 * @param initialValue - Valeur initiale si aucune donnée n'est trouvée
 * @returns [value, setValue, clearValue] - La valeur, la fonction de mise à jour, et la fonction de suppression
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void, () => void] {
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
      console.error(`Error saving ${key} to localStorage:`, error);
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

