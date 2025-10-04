import { useEffect, useCallback } from 'react';

type KeyboardShortcutHandler = (event: KeyboardEvent) => void;

interface KeyboardShortcutOptions {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook pour gérer les raccourcis clavier
 * 
 * Utilisation :
 * useKeyboardShortcut('s', () => {
 *   console.log('Ctrl+S pressed');
 * }, { ctrl: true, preventDefault: true });
 * 
 * @param key - La touche à écouter (ex: 's', 'Enter', 'Escape')
 * @param handler - Fonction à exécuter quand le raccourci est déclenché
 * @param options - Options du raccourci (modificateurs, preventDefault)
 */
export function useKeyboardShortcut(
  key: string,
  handler: KeyboardShortcutHandler,
  options: KeyboardShortcutOptions = {}
) {
  const {
    ctrl = false,
    shift = false,
    alt = false,
    meta = false,
    preventDefault = false,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Vérifier que la touche correspond
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      
      // Vérifier que les modificateurs correspondent
      const ctrlMatches = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatches = shift ? event.shiftKey : !event.shiftKey;
      const altMatches = alt ? event.altKey : !event.altKey;
      const metaMatches = meta ? event.metaKey : !event.metaKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        if (preventDefault) {
          event.preventDefault();
        }
        handler(event);
      }
    },
    [key, handler, ctrl, shift, alt, meta, preventDefault]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Hook pour gérer plusieurs raccourcis clavier
 * 
 * Utilisation :
 * useKeyboardShortcuts({
 *   's': { handler: handleSave, ctrl: true, preventDefault: true },
 *   'Escape': { handler: handleClose },
 *   'Enter': { handler: handleSubmit, ctrl: true },
 * });
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, { handler: KeyboardShortcutHandler } & KeyboardShortcutOptions>
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const shortcut = shortcuts[event.key.toLowerCase()] || shortcuts[event.key];
      
      if (!shortcut) return;

      const {
        handler,
        ctrl = false,
        shift = false,
        alt = false,
        meta = false,
        preventDefault = false,
      } = shortcut;

      // Vérifier que les modificateurs correspondent
      const ctrlMatches = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatches = shift ? event.shiftKey : !event.shiftKey;
      const altMatches = alt ? event.altKey : !event.altKey;
      const metaMatches = meta ? event.metaKey : !event.metaKey;

      if (ctrlMatches && shiftMatches && altMatches && metaMatches) {
        if (preventDefault) {
          event.preventDefault();
        }
        handler(event);
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
