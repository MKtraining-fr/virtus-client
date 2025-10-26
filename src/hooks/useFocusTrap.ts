import { useEffect, useRef } from 'react';

/**
 * Hook pour piéger le focus dans un élément (utile pour les modales)
 *
 * Lorsqu'une modale s'ouvre, le focus doit être piégé à l'intérieur pour que
 * l'utilisateur ne puisse pas naviguer en dehors avec Tab/Shift+Tab.
 *
 * Utilisation :
 * const modalRef = useFocusTrap(isOpen);
 *
 * <div ref={modalRef}>
 *   {/* Contenu de la modale *\/}
 * </div>
 *
 * @param isActive - Si true, le piège de focus est actif
 * @returns Ref à attacher à l'élément conteneur
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !elementRef.current) return;

    const element = elementRef.current;

    // Sauvegarder l'élément qui avait le focus avant l'ouverture
    const previouslyFocusedElement = document.activeElement as HTMLElement;

    // Obtenir tous les éléments focusables dans l'élément
    const getFocusableElements = () => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(element.querySelectorAll<HTMLElement>(focusableSelectors)).filter((el) => {
        // Vérifier que l'élément est visible
        return el.offsetParent !== null;
      });
    };

    // Donner le focus au premier élément focusable
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Gérer la navigation au clavier
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab : navigation arrière
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab : navigation avant
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    // Cleanup : restaurer le focus à l'élément précédent
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [isActive]);

  return elementRef;
}

/**
 * Hook pour gérer le focus sur un élément spécifique
 *
 * Utilisation :
 * const inputRef = useAutoFocus(shouldFocus);
 *
 * <input ref={inputRef} />
 *
 * @param shouldFocus - Si true, l'élément reçoit le focus
 */
export function useAutoFocus<T extends HTMLElement>(shouldFocus: boolean = true) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [shouldFocus]);

  return elementRef;
}
