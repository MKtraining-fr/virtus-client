import React, { useMemo } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isLoading?: boolean;
  ariaLabel?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  ariaLabel,
  disabled,
  ...props
}) => {
  const baseClasses =
    'border rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = useMemo(
    () => ({
      primary: 'bg-primary text-white hover:bg-violet-700 focus:ring-primary border-transparent',
      secondary:
        'bg-white text-dark-text hover:bg-gray-100 border-gray-500 focus:ring-primary dark:bg-client-card dark:text-client-light dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:border-gray-600',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border-transparent',
    }),
    []
  );

  const sizeClasses = useMemo(
    () => ({
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }),
    []
  );

  const combinedClassName = useMemo(
    () => `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`,
    [baseClasses, variantClasses, variant, sizeClasses, size, className]
  );

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Chargement...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default React.memo(Button);
