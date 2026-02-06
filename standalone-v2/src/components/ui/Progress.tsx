import React from 'react';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  animated = false,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  // Tailles
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  // Couleurs
  const variants = {
    default: 'bg-brand-500',
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    error: 'bg-red-500',
    gradient: 'bg-gradient-to-r from-brand-600 to-brand-400',
  };

  return (
    <div className="w-full">
      {/* Label */}
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-text-secondary dark:text-text-secondary">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-sm font-bold text-text-primary dark:text-text-primary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div
        className={`
          w-full ${sizes[size]}
          bg-bg-secondary dark:bg-bg-secondary
          rounded-full
          overflow-hidden
        `}
      >
        <div
          className={`
            h-full ${variants[variant]}
            rounded-full
            transition-all duration-300 ease-out
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Progress;
