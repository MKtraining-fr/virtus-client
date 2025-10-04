
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const isClickable = !!onClick;
  const cardClasses = `bg-white rounded-lg shadow-md overflow-hidden ${className} ${isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;