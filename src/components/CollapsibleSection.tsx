import React, { useId, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = true,
  children,
  className = '',
  isOpen: controlledOpen,
  onToggle,
}) => {
  const contentId = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = typeof controlledOpen === 'boolean';
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleToggle = () => {
    const nextState = !isOpen;
    if (!isControlled) {
      setInternalOpen(nextState);
    }
    onToggle?.(nextState);
  };

  return (
    <div className={`border rounded-lg bg-white mb-4 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex justify-between items-center p-4 hover:bg-gray-50 text-left"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
      </button>
      <div
        id={contentId}
        className={`${isOpen ? 'block' : 'hidden'} border-t`}
        aria-hidden={!isOpen}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
