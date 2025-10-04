
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const isClickable = !!onClick;
  const cardClasses = `bg-white dark:bg-client-card rounded-lg shadow-md dark:shadow-xl dark:shadow-black/20 overflow-hidden border border-transparent dark:border-gray-700/50 ${className} ${isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;