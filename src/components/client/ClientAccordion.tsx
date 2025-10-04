import React, { useState } from 'react';
import { ChevronDownIcon } from '../../constants/icons';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  isOpenDefault?: boolean;
}

const ClientAccordion: React.FC<AccordionProps> = ({ title, children, isOpenDefault = false }) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  return (
    <div className="bg-white dark:bg-client-card rounded-lg border border-gray-200 dark:border-gray-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-lg text-gray-800 dark:text-client-light hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
      >
        <span>{title}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {children}
        </div>
      )}
    </div>
  );
};

export default ClientAccordion;