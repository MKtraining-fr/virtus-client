import React from 'react';
import { useSignedUrl } from '../../hooks/useSignedUrl';

interface PhotoImageProps {
  filePath: string;
  alt: string;
  className?: string;
}

export const PhotoImage: React.FC<PhotoImageProps> = ({ filePath, alt, className }) => {
  const { signedUrl, isLoading, error } = useSignedUrl(filePath);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${className}`}>
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return <img src={signedUrl} alt={alt} className={className} />;
};
