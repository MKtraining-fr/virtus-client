import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'violet' | 'orange' | 'green' | 'blue';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'violet',
}) => {
  const colorClasses = {
    violet: 'from-violet-600/20 to-violet-600/5 border-violet-600/30',
    orange: 'from-orange-600/20 to-orange-600/5 border-orange-600/30',
    green: 'from-green-600/20 to-green-600/5 border-green-600/30',
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-600/30',
  };

  const iconColorClasses = {
    violet: 'text-violet-400',
    orange: 'text-orange-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 ${colorClasses[color]} active:scale-95 transition-transform`}
    >
      <div className="flex flex-col gap-2">
        {/* Icône et titre */}
        <div className="flex items-center justify-between">
          <div className={`rounded-lg bg-black/20 p-2 ${iconColorClasses[color]}`}>
            <Icon size={18} strokeWidth={2.5} />
          </div>
          {trend && (
            <span
              className={`text-xs font-bold ${
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>

        {/* Valeur principale */}
        <div>
          <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          {subtitle && (
            <p className="text-[9px] text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};
