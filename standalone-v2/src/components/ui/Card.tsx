import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      clickable = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Styles de base
    const baseStyles = 'rounded-lg transition-all duration-200';

    // Styles par variant
    const variantStyles = {
      default: 'bg-bg-card dark:bg-bg-card',
      elevated: 'bg-bg-card dark:bg-bg-card shadow-lg',
      outlined: 'bg-bg-card dark:bg-bg-card border-2 border-border dark:border-border',
      glass: 'bg-bg-card/80 dark:bg-bg-card/80 backdrop-blur-md border border-border/50 dark:border-border/50',
    };

    // Styles par padding
    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    // Styles hover
    const hoverStyles = hover ? 'hover:shadow-xl hover:-translate-y-1' : '';

    // Styles clickable
    const clickableStyles = clickable ? 'cursor-pointer active:scale-[0.98]' : '';

    // Combiner tous les styles
    const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${clickableStyles} ${className}`;

    return (
      <div ref={ref} className={combinedStyles} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
