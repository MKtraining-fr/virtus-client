import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  helperText?: string;
  disabled?: boolean;
}

export interface RadioProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

const Radio: React.FC<RadioProps> = ({
  options,
  value,
  onChange,
  name,
  label,
  error,
  disabled = false,
  orientation = 'vertical',
}) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary mb-2">
          {label}
        </label>
      )}

      <div
        className={`
          flex gap-4
          ${orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'}
        `}
      >
        {options.map((option) => {
          const isChecked = value === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <label
              key={option.value}
              className={`
                flex items-start gap-3
                ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              {/* Radio Button */}
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  onChange={() => !isDisabled && onChange(option.value)}
                  disabled={isDisabled}
                  className="sr-only"
                />
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    transition-all
                    ${error
                      ? 'border-red-500'
                      : isChecked
                      ? 'border-brand-500'
                      : 'border-border dark:border-border'
                    }
                    ${!isDisabled && !isChecked
                      ? 'hover:border-brand-500'
                      : ''
                    }
                  `}
                >
                  {isChecked && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                  )}
                </div>
              </div>

              {/* Label */}
              <div className="flex-1">
                <span className="text-sm text-text-primary dark:text-text-primary">
                  {option.label}
                </span>
                {option.helperText && (
                  <p className="mt-0.5 text-xs text-text-tertiary dark:text-text-tertiary">
                    {option.helperText}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Radio;
