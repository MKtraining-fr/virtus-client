import React from 'react';

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  percentage: number;
  color: string;
  surplusColor?: string;
  children: React.ReactNode;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  strokeWidth,
  percentage,
  color,
  surplusColor,
  children,
}) => {
  const viewBox = `0 0 ${size} ${size}`;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const mainPercentage = Math.min(100, percentage);
  const surplusPercentage = Math.max(0, percentage - 100);

  const mainStrokeDashoffset = circumference - (mainPercentage / 100) * circumference;
  const surplusStrokeDashoffset = circumference - (surplusPercentage / 100) * circumference;

  // Use a slightly darker shade of the main color if surplusColor is not provided
  const finalSurplusColor = surplusColor || color;

  return (
    <div
      className="flex flex-col items-center justify-center relative"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={viewBox} className="transform -rotate-90 absolute">
        {/* Background track */}
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Main progress circle (up to 100%) */}
        <circle
          className="transition-all duration-300 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={mainStrokeDashoffset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Surplus progress circle (for > 100%) */}
        {surplusPercentage > 0 && (
          <circle
            className="transition-all duration-300 ease-in-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={surplusStrokeDashoffset}
            strokeLinecap="round"
            stroke={finalSurplusColor}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{ opacity: surplusColor ? 1 : 0.6 }} // If no surplus color, make it semi-transparent
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
};

export default CircularProgress;
