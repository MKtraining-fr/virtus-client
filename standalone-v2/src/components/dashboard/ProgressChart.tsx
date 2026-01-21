import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface ProgressChartProps {
  title: string;
  data: DataPoint[];
  color?: 'violet' | 'orange' | 'green' | 'blue';
  type?: 'bar' | 'line';
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  title,
  data,
  color = 'violet',
  type = 'bar',
}) => {
  const maxValue = Math.max(...data.map((d) => d.value));

  const colorClasses = {
    violet: 'bg-violet-600',
    orange: 'bg-orange-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
  };

  const gradientClasses = {
    violet: 'from-violet-600 to-violet-400',
    orange: 'from-orange-600 to-orange-400',
    green: 'from-green-600 to-green-400',
    blue: 'from-blue-600 to-blue-400',
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-6">
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
      
      {type === 'bar' ? (
        <div className="space-y-4">
          {data.map((point, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{point.label}</span>
                <span className="font-semibold text-white">{point.value}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${gradientClasses[color]} transition-all duration-500`}
                  style={{ width: `${(point.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative h-48">
          <svg className="h-full w-full" viewBox="0 0 400 200">
            {/* Grille de fond */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="0"
                y1={i * 50}
                x2="400"
                y2={i * 50}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            ))}
            
            {/* Ligne de progression */}
            <polyline
              points={data
                .map((point, index) => {
                  const x = (index / (data.length - 1)) * 400;
                  const y = 200 - (point.value / maxValue) * 180;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke={`url(#gradient-${color})`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = 200 - (point.value / maxValue) * 180;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="5"
                  fill={`url(#gradient-${color})`}
                  className="drop-shadow-lg"
                />
              );
            })}
            
            {/* Définition du gradient */}
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color === 'violet' ? '#6D5DD3' : color === 'orange' ? '#FF6B35' : color === 'green' ? '#4CAF50' : '#3B82F6'} />
                <stop offset="100%" stopColor={color === 'violet' ? '#9B8FE8' : color === 'orange' ? '#FF8C5A' : color === 'green' ? '#66BB6A' : '#60A5FA'} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Labels */}
          <div className="mt-4 flex justify-between text-xs text-gray-500">
            {data.map((point, index) => (
              <span key={index}>{point.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
