
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  className?: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, className = '', children, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-600 dark:text-client-subtle mb-1">{label}</label>}
      <select
        id={id}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white text-gray-900 dark:bg-client-card dark:border-gray-600 dark:text-client-light ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;