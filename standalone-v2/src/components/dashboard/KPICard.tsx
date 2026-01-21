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
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-semibold ${
                  trend.isPositive ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs semaine dernière</span>
            </div>
          )}
        </div>
        <div className={`rounded-xl bg-black/20 p-3 ${iconColorClasses[color]}`}>
          <Icon size={24} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};
