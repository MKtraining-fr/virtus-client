import React, { useId, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  /** Custom classes applied to the clickable header button */
  headerClassName?: string;
  /** Custom classes applied to the title element */
  titleClassName?: string;
  /** Custom classes applied to the content wrapper */
  contentClassName?: string;
  /** Hide the chevron indicator while keeping the collapsible behaviour */
  hideChevron?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = true,
  children,
  className = '',
  isOpen: controlledOpen,
  onToggle,
  headerClassName,
  titleClassName,
  contentClassName,
  hideChevron = false,
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

  const headerClasses =
    headerClassName ||
    'w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors';

  const titleClasses = titleClassName || 'text-lg font-semibold text-gray-900';
  const contentClasses = contentClassName || 'px-6 py-4';

  return (
    <div className={`mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className={headerClasses}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <h2 className={titleClasses}>{title}</h2>
        {!hideChevron && (
          <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
        )}
      </button>
      <div
        id={contentId}
        className={`${isOpen ? 'block' : 'hidden'} border-t border-gray-100`}
        aria-hidden={!isOpen}
      >
        <div className={contentClasses}>{children}</div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
