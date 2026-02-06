import React from 'react';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  error?: string;
  helperText?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
  error,
  helperText,
}) => {
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div>
      <label
        className={`flex items-start gap-3 ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        }`}
      >
        {/* Checkbox */}
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only"
          />
          <div
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
              transition-all
              ${error
                ? 'border-red-500'
                : checked || indeterminate
                ? 'border-brand-500 bg-brand-500'
                : 'border-border dark:border-border bg-bg-secondary dark:bg-bg-secondary'
              }
              ${!disabled && !checked && !indeterminate
                ? 'hover:border-brand-500'
                : ''
              }
            `}
          >
            {indeterminate ? (
              <Minus size={14} className="text-white" strokeWidth={3} />
            ) : checked ? (
              <Check size={14} className="text-white" strokeWidth={3} />
            ) : null}
          </div>
        </div>

        {/* Label */}
        {label && (
          <div className="flex-1">
            <span className="text-sm text-text-primary dark:text-text-primary">
              {label}
            </span>
            {helperText && !error && (
              <p className="mt-0.5 text-xs text-text-tertiary dark:text-text-tertiary">
                {helperText}
              </p>
            )}
          </div>
        )}
      </label>

      {error && (
        <p className="mt-1 ml-8 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Checkbox;
