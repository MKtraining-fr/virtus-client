import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  className?: string;
  children?: React.ReactNode;
  error?: string;
  options?: SelectOption[];
  onChange?: (value: string | string[], event?: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Select: React.FC<SelectProps> = ({
  label,
  id,
  className = '',
  children,
  error,
  options,
  onChange,
  value,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      // Si le select est multiple, on retourne un tableau de valeurs
      if (props.multiple) {
        const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
        onChange(selectedOptions, e);
      } else {
        onChange(e.target.value, e);
      }
    }
  };

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
      <select
        id={id}
        className={`w-full px-3 py-3 md:py-2 text-base md:text-sm border ${
          error ? 'border-red-500' : 'border-gray-300'
        } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 dark:bg-client-card dark:border-gray-600 dark:text-client-light ${className}`}
        onChange={handleChange}
        value={value}
        {...props}
      >
        {options ? (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          children
        )}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
