import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '../constants/icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'xl' | 'full';
  theme?: 'light' | 'dark';
  zIndex?: number;
  onFocus?: () => void;
  isInBackground?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  theme = 'light',
  zIndex = 50,
  onFocus,
  isInBackground = false,
}) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      console.error("Modal root element '#modal-root' not found in the DOM.");
    }
    setContainer(modalRoot);
  }, []);

  if (!isOpen || !container) {
    return null;
  }

  const sizeClass = size === 'full' ? 'w-[85vw] max-w-[1400px]' : size === 'xl' ? 'max-w-7xl' : 'max-w-2xl';
  const heightClass = size === 'full' ? 'h-[90vh] max-h-[900px]' : 'md:max-h-[90vh]';

  const themeClasses =
    theme === 'dark' ? 'bg-client-card text-client-light' : 'bg-white dark:bg-client-card text-dark-gray dark:text-client-light';

  const headerBorderClass = theme === 'dark' ? 'border-client-dark' : 'border-b dark:border-client-dark';
  const closeButtonClass =
    theme === 'dark'
      ? 'text-client-subtle hover:text-client-light'
      : 'text-gray-500 dark:text-client-subtle hover:text-gray-800 dark:hover:text-client-light';

  // Gérer le mousedown pour enregistrer où le clic a commencé
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownTargetRef.current = e.target;
  };

  // Gérer le click pour fermer uniquement si le mousedown et le mouseup sont sur le backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Vérifier que le clic a commencé ET s'est terminé sur le backdrop
    if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
      onClose();
    }
    mouseDownTargetRef.current = null;
  };

  // Quand la modale est en arrière-plan, ne pas afficher le backdrop (fond noir)
  // La modale reste visible mais sans overlay qui bloque les interactions
  if (isInBackground) {
    return createPortal(
      <div
        className="fixed inset-0 flex justify-center items-center md:p-4 pointer-events-none"
        style={{ zIndex }}
      >
        <div
          className={`rounded-none md:rounded-lg shadow-xl w-full h-full md:h-auto ${sizeClass} md:mx-4 flex flex-col ${heightClass} ${themeClasses} pointer-events-auto`}
          onClick={(e) => {
            e.stopPropagation();
            onFocus?.();
          }}
          role="document"
        >
          <div className={`flex justify-between items-center p-4 ${headerBorderClass} flex-shrink-0`}>
            <h2 id="modal-title" className="text-xl font-bold">
              {title}
            </h2>
            <button onClick={onClose} className={closeButtonClass} aria-label="Fermer">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4 md:p-6 overflow-y-auto flex-grow">{children}</div>
        </div>
      </div>,
      container
    );
  }

  // Mode normal : avec backdrop
  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center md:p-4 transition-all duration-200"
      style={{ zIndex }}
      onMouseDown={handleMouseDown}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`rounded-none md:rounded-lg shadow-xl w-full h-full md:h-auto ${sizeClass} md:mx-4 flex flex-col ${heightClass} ${themeClasses}`}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className={`flex justify-between items-center p-4 ${headerBorderClass} flex-shrink-0`}>
          <h2 id="modal-title" className="text-xl font-bold">
            {title}
          </h2>
          <button onClick={onClose} className={closeButtonClass} aria-label="Fermer">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 md:p-6 overflow-y-auto flex-grow">{children}</div>
      </div>
    </div>,
    container
  );
};

export default Modal;
