import React, { useState } from 'react';

interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  isOpenDefault?: boolean;
  // For controlled component
  isOpen?: boolean;
  onToggle?: () => void;
  onButtonDragOver?: (e: React.DragEvent<HTMLButtonElement>) => void;
  onButtonDrop?: (e: React.DragEvent<HTMLButtonElement>) => void;
}

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  isOpenDefault = false,
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  onButtonDragOver,
  onButtonDrop,
}) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(isOpenDefault);

  const isControlled = controlledIsOpen !== undefined && controlledOnToggle !== undefined;

  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;
  const toggle = isControlled
    ? controlledOnToggle
    : () => setUncontrolledIsOpen(!uncontrolledIsOpen);

  return (
    <div className="border border-gray-500 rounded-lg mb-4 bg-white shadow-sm">
      <button
        onClick={toggle}
        onDragOver={onButtonDragOver}
        onDrop={onButtonDrop}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-lg text-dark-text hover:bg-gray-50 transition-colors"
      >
        <span>{title}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="p-4 border-t border-gray-500">{children}</div>}
    </div>
  );
};

export default Accordion;
