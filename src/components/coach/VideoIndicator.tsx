import React from 'react';

interface VideoIndicatorProps {
  videoCount: number;
  unviewedCount: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const VideoIndicator: React.FC<VideoIndicatorProps> = ({
  videoCount,
  unviewedCount,
  onClick,
  size = 'md'
}) => {
  if (videoCount === 0) return null;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const badgeSizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center gap-1 ${sizeClasses[size]} ${onClick ? 'hover:opacity-70 cursor-pointer' : ''} transition-opacity`}
      title={`${videoCount} vidéo${videoCount > 1 ? 's' : ''} disponible${videoCount > 1 ? 's' : ''}${unviewedCount > 0 ? ` (${unviewedCount} non vue${unviewedCount > 1 ? 's' : ''})` : ''}`}
    >
      <span className="text-blue-600 dark:text-blue-400">📹</span>
      {videoCount > 1 && (
        <span className="text-gray-600 dark:text-gray-400 text-xs">
          ×{videoCount}
        </span>
      )}
      {unviewedCount > 0 && (
        <span className={`absolute -top-1 -right-1 ${badgeSizeClasses[size]} bg-red-500 text-white rounded-full flex items-center justify-center font-bold`}>
          {unviewedCount}
        </span>
      )}
    </button>
  );
};

export default VideoIndicator;
