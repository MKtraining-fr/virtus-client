import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Styles de base
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Styles par variant
    const variantStyles = {
      primary: 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500 shadow-md hover:shadow-lg',
      secondary: 'bg-brand-700 text-white hover:bg-brand-800 focus:ring-brand-700 shadow-md hover:shadow-lg',
      outline: 'bg-transparent border-2 border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white focus:ring-brand-500',
      ghost: 'bg-transparent text-brand-500 hover:bg-brand-500/10 focus:ring-brand-500',
      danger: 'bg-system-error text-white hover:bg-system-error-dark focus:ring-system-error shadow-md hover:shadow-lg',
    };

    // Styles par taille
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2.5 text-base gap-2',
      lg: 'px-6 py-3.5 text-lg gap-2.5',
    };

    // Style fullWidth
    const widthStyle = fullWidth ? 'w-full' : '';

    // Combiner tous les styles
    const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;

    return (
      <button
        ref={ref}
        className={combinedStyles}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
        )}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
