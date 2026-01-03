import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserAvatarUrl } from '../../utils/avatarUtils';

interface ClientHeaderProps {
  title: string;
}

const ClientHeader: React.FC<ClientHeaderProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white dark:bg-client-card sticky top-0 z-10 p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
      <h1 className="text-xl font-bold text-gray-900 dark:text-client-light">{title}</h1>
      <Link to="/app/profile">
        <img
          src={getUserAvatarUrl(user || {}, 40)}
          alt={user?.firstName}
          className="w-9 h-9 rounded-full"
        />
      </Link>
    </header>
  );
};

export default ClientHeader;
