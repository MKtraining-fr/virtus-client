import React from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

const ImpersonationBanner: React.FC = () => {
  const { user, originalUser, stopImpersonating } = useAuth();

  if (!originalUser) {
    return null;
  }

  return (
    <div className="bg-yellow-400 text-black p-2 text-center text-sm font-semibold z-50 flex justify-center items-center gap-4">
      <span>
        Vous naviguez en tant que{' '}
        <strong>
          {user?.firstName} {user?.lastName}
        </strong>{' '}
        ({user?.role}).
      </span>
      <Button variant="secondary" size="sm" onClick={stopImpersonating}>
        Retourner à la vue Admin
      </Button>
    </div>
  );
};

export default ImpersonationBanner;
