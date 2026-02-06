import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  helperText?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  helperText,
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  // Tailles du switch
  const sizes = {
    sm: {
      track: 'w-8 h-5',
      thumb: 'w-3 h-3',
      translate: checked ? 'translate-x-3' : 'translate-x-1',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-4 h-4',
      translate: checked ? 'translate-x-5' : 'translate-x-1',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-5 h-5',
      translate: checked ? 'translate-x-7' : 'translate-x-1',
    },
  };

  const sizeClasses = sizes[size];

  return (
    <label
      className={`
        flex items-start gap-3
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
    >
      {/* Switch */}
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleToggle}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            ${sizeClasses.track}
            rounded-full
            transition-colors
            ${checked
              ? 'bg-brand-500'
              : 'bg-bg-secondary dark:bg-bg-secondary border-2 border-border dark:border-border'
            }
          `}
        >
          <div
            className={`
              ${sizeClasses.thumb}
              ${sizeClasses.translate}
              rounded-full
              bg-white
              shadow-md
              transition-transform
              ${checked ? 'mt-1' : 'mt-1'}
            `}
          />
        </div>
      </div>

      {/* Label */}
      {label && (
        <div className="flex-1">
          <span className="text-sm text-text-primary dark:text-text-primary">
            {label}
          </span>
          {helperText && (
            <p className="mt-0.5 text-xs text-text-tertiary dark:text-text-tertiary">
              {helperText}
            </p>
          )}
        </div>
      )}
    </label>
  );
};

export default Switch;
