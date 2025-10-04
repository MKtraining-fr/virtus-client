import { useMemo } from 'react';

/**
 * Hook pour optimiser le rendu de listes en mémorisant les résultats de filtrage et de tri
 * 
 * @param items - Liste d'éléments à traiter
 * @param filterFn - Fonction de filtrage optionnelle
 * @param sortFn - Fonction de tri optionnelle
 * @returns Liste filtrée et triée
 * 
 * Utilisation :
 * const filteredClients = useOptimizedList(
 *   clients,
 *   (client) => client.name.includes(searchTerm),
 *   (a, b) => a.name.localeCompare(b.name)
 * );
 */
export function useOptimizedList<T>(
  items: T[],
  filterFn?: (item: T) => boolean,
  sortFn?: (a: T, b: T) => number
): T[] {
  return useMemo(() => {
    let result = items;

    if (filterFn) {
      result = result.filter(filterFn);
    }

    if (sortFn) {
      result = [...result].sort(sortFn);
    }

    return result;
  }, [items, filterFn, sortFn]);
}

/**
 * Hook pour paginer une liste de manière optimisée
 * 
 * @param items - Liste d'éléments
 * @param page - Numéro de page (commence à 1)
 * @param pageSize - Nombre d'éléments par page
 * @returns Objet contenant les éléments de la page et les métadonnées de pagination
 * 
 * Utilisation :
 * const { items: pageItems, totalPages, hasNext, hasPrev } = usePagination(clients, currentPage, 10);
 */
export function usePagination<T>(
  items: T[],
  page: number,
  pageSize: number
) {
  return useMemo(() => {
    const totalPages = Math.ceil(items.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageItems = items.slice(startIndex, endIndex);

    return {
      items: pageItems,
      totalPages,
      totalItems: items.length,
      currentPage: page,
      pageSize,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, items.length),
    };
  }, [items, page, pageSize]);
}

/**
 * Hook pour grouper une liste par une clé
 * 
 * @param items - Liste d'éléments
 * @param keyFn - Fonction qui extrait la clé de groupement
 * @returns Map avec les éléments groupés par clé
 * 
 * Utilisation :
 * const clientsByCoach = useGroupBy(clients, (client) => client.coachId);
 */
export function useGroupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  return useMemo(() => {
    const groups = new Map<K, T[]>();

    items.forEach((item) => {
      const key = keyFn(item);
      const group = groups.get(key) || [];
      group.push(item);
      groups.set(key, group);
    });

    return groups;
  }, [items, keyFn]);
}
