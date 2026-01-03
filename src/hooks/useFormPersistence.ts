import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personnalisé pour persister les données de formulaire dans le localStorage.
 * Permet de récupérer les données après un rechargement de page ou un changement de fenêtre.
 * 
 * @param key - Clé unique pour identifier le formulaire dans le localStorage
 * @param initialValue - Valeur initiale du formulaire
 * @param options - Options de configuration
 * @returns [value, setValue, clearPersistedData, hasPersistedData]
 */
interface UseFormPersistenceOptions {
  // Délai en ms avant la sauvegarde automatique (debounce)
  debounceMs?: number;
  // Durée de vie des données en ms (par défaut 24h)
  expirationMs?: number;
  // Callback appelé quand des données persistées sont restaurées
  onRestore?: (data: any) => void;
}

interface PersistedData<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

export function useFormPersistence<T>(
  key: string,
  initialValue: T,
  options: UseFormPersistenceOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const {
    debounceMs = 500,
    expirationMs = 24 * 60 * 60 * 1000, // 24 heures par défaut
    onRestore
  } = options;

  const storageKey = `virtus_form_${key}`;

  // Fonction pour récupérer les données persistées
  const getPersistedValue = useCallback((): T | null => {
    try {
      const item = localStorage.getItem(storageKey);
      if (!item) return null;

      const parsed: PersistedData<T> = JSON.parse(item);
      
      // Vérifier si les données ont expiré
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données persistées pour ${key}:`, error);
      return null;
    }
  }, [storageKey, key]);

  // Initialiser l'état avec les données persistées ou la valeur initiale
  const [value, setValueInternal] = useState<T>(() => {
    const persisted = getPersistedValue();
    if (persisted !== null) {
      // Appeler le callback de restauration si défini
      if (onRestore) {
        setTimeout(() => onRestore(persisted), 0);
      }
      return persisted;
    }
    return initialValue;
  });

  // État pour indiquer si des données ont été restaurées
  const [hasPersistedData, setHasPersistedData] = useState<boolean>(() => {
    return getPersistedValue() !== null;
  });

  // Fonction pour sauvegarder les données
  const persistValue = useCallback((newValue: T) => {
    try {
      const data: PersistedData<T> = {
        value: newValue,
        timestamp: Date.now(),
        expiresAt: Date.now() + expirationMs
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des données pour ${key}:`, error);
    }
  }, [storageKey, key, expirationMs]);

  // Debounce pour la sauvegarde automatique
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      persistValue(value);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, persistValue, debounceMs]);

  // Fonction pour mettre à jour la valeur
  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValueInternal((prev) => {
      const nextValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev) 
        : newValue;
      return nextValue;
    });
    setHasPersistedData(false);
  }, []);

  // Fonction pour effacer les données persistées
  const clearPersistedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasPersistedData(false);
    } catch (error) {
      console.error(`Erreur lors de la suppression des données pour ${key}:`, error);
    }
  }, [storageKey, key]);

  // Écouter les changements de visibilité de la page pour sauvegarder immédiatement
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Sauvegarder immédiatement quand l'utilisateur quitte la page
        persistValue(value);
      }
    };

    const handleBeforeUnload = () => {
      // Sauvegarder avant de fermer la page
      persistValue(value);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [value, persistValue]);

  return [value, setValue, clearPersistedData, hasPersistedData];
}

/**
 * Hook simplifié pour persister un seul champ de formulaire
 */
export function useFieldPersistence<T>(
  formKey: string,
  fieldName: string,
  initialValue: T
): [T, (value: T) => void, () => void] {
  const key = `${formKey}_${fieldName}`;
  const [value, setValue, clearPersistedData] = useFormPersistence(key, initialValue);
  return [value, setValue, clearPersistedData];
}

/**
 * Utilitaire pour nettoyer toutes les données de formulaire expirées
 */
export function cleanupExpiredFormData(): void {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('virtus_form_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed: PersistedData<any> = JSON.parse(item);
            if (Date.now() > parsed.expiresAt) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Ignorer les erreurs de parsing
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`Nettoyage: ${keysToRemove.length} formulaires expirés supprimés`);
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des données expirées:', error);
  }
}

/**
 * Composant de notification pour informer l'utilisateur que des données ont été restaurées
 */
export const FormRestoredNotification: React.FC<{
  show: boolean;
  onDismiss: () => void;
  onDiscard: () => void;
}> = ({ show, onDismiss, onDiscard }) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-lg max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900">Données restaurées</h4>
          <p className="text-xs text-blue-700 mt-1">
            Vos données précédentes ont été récupérées. Vous pouvez continuer où vous vous êtes arrêté.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
            >
              Continuer
            </button>
            <button
              onClick={onDiscard}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Recommencer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default useFormPersistence;
