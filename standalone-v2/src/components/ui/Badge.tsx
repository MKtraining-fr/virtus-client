import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      icon,
      dot = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Styles de base
    const baseStyles = 'inline-flex items-center gap-1.5 font-bold rounded-full';

    // Styles par variant
    const variantStyles = {
      success: 'bg-system-success/20 text-system-success border border-system-success/30',
      warning: 'bg-system-warning/20 text-system-warning border border-system-warning/30',
      error: 'bg-system-error/20 text-system-error border border-system-error/30',
      info: 'bg-system-info/20 text-system-info border border-system-info/30',
      default: 'bg-brand-500/20 text-brand-500 border border-brand-500/30',
      bronze: 'bg-tier-bronze/20 text-tier-bronze border border-tier-bronze/30',
      silver: 'bg-tier-silver/20 text-tier-silver border border-tier-silver/30',
      gold: 'bg-tier-gold/20 text-tier-gold border border-tier-gold/30',
      platinum: 'bg-tier-platinum/20 text-tier-platinum border border-tier-platinum/30',
      diamond: 'bg-tier-diamond/20 text-tier-diamond border border-tier-diamond/30',
    };

    // Styles par taille
    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };

    // Taille du dot
    const dotSizeStyles = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
    };

    // Combiner tous les styles
    const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
      <span ref={ref} className={combinedStyles} {...props}>
        {dot && <span className={`rounded-full bg-current ${dotSizeStyles[size]}`} />}
        {icon && icon}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
