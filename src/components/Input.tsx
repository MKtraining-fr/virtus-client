import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, id, className = '', error, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-600 dark:text-client-subtle mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-3 py-3 md:py-2 text-base md:text-sm bg-white border ${
          error ? 'border-red-500' : 'border-gray-500'
        } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 placeholder:text-gray-500 dark:bg-client-card dark:border-gray-600 dark:text-client-light dark:placeholder:text-client-subtle ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
