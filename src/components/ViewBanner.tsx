import React from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

const ViewBanner: React.FC = () => {
  const { user, originalUser, resetViewRole, currentViewRole } = useAuth();

  if (currentViewRole === 'admin' || !originalUser) {
    return null;
  }

  return (
    <div className="bg-yellow-400 text-black p-2 text-center text-sm font-semibold z-50 flex justify-center items-center gap-4">
      <span>
        Vous naviguez en tant que{' '}
        <strong>
          {originalUser.firstName} {originalUser.lastName}
        </strong>{' '}
        (Vue {currentViewRole}).
      </span>
      <Button variant="secondary" size="sm" onClick={resetViewRole}>
        Retourner à la vue Admin
      </Button>
    </div>
  );
};

export default ViewBanner;
