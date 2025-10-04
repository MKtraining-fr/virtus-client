
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'xl';
  theme?: 'light' | 'dark';
}

const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);


const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', theme = 'light' }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // This effect runs on the client after the component mounts,
    // ensuring that `document` is available and the modal root element exists.
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      console.error("Modal root element '#modal-root' not found in the DOM.");
    }
    setContainer(modalRoot);
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  if (!isOpen || !container) {
    return null;
  }
  
  const sizeClass = size === 'xl' ? 'max-w-7xl' : 'max-w-2xl';

  const themeClasses = theme === 'dark'
    ? 'bg-client-card text-client-light'
    : 'bg-white text-dark-gray';
  
  const headerBorderClass = theme === 'dark' ? 'border-client-dark' : 'border-b';
  const closeButtonClass = theme === 'dark' ? 'text-client-subtle hover:text-client-light' : 'text-gray-500 hover:text-gray-800';


  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`rounded-lg shadow-xl w-full ${sizeClass} mx-4 flex flex-col max-h-[90vh] ${themeClasses}`}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className={`flex justify-between items-center p-4 ${headerBorderClass} flex-shrink-0`}>
          <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className={closeButtonClass} aria-label="Fermer">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          {children}
        </div>
      </div>
    </div>,
    container
  );
};

export default Modal;