import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    // Styles de base
    const baseStyles = 'px-4 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Styles selon l'état
    const stateStyles = error
      ? 'border-system-error focus:border-system-error focus:ring-system-error bg-system-error/5'
      : 'border-border focus:border-brand-500 focus:ring-brand-500 bg-bg-secondary dark:bg-bg-secondary';

    // Style avec icône
    const iconPaddingStyles = icon
      ? iconPosition === 'left'
        ? 'pl-11'
        : 'pr-11'
      : '';

    // Style fullWidth
    const widthStyle = fullWidth ? 'w-full' : '';

    // Combiner tous les styles
    const combinedStyles = `${baseStyles} ${stateStyles} ${iconPaddingStyles} ${widthStyle} ${className}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-bold text-text-primary dark:text-text-primary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${
                iconPosition === 'left' ? 'left-3' : 'right-3'
              } text-text-tertiary dark:text-text-tertiary`}
            >
              {icon}
            </div>
          )}
          <input ref={ref} className={combinedStyles} {...props} />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-system-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-text-tertiary dark:text-text-tertiary">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
