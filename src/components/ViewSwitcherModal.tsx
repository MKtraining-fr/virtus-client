import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useAuth } from '../context/AuthContext';

interface ViewSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ViewSwitcherModal: React.FC<ViewSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { setViewRole } = useAuth();

  const handleSwitch = (role: 'coach' | 'client') => {
    setViewRole(role);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Basculer la vue">
      <div className="flex flex-col gap-4 p-4">
        <p className="text-gray-700">
          En tant qu'administrateur, vous pouvez basculer vers la vue d'un Coach ou d'un Client pour effectuer des tests.
        </p>
        <div className="flex justify-around gap-4">
          <Button onClick={() => handleSwitch('coach')} className="w-full">
            Voir en tant que Coach
          </Button>
          <Button onClick={() => handleSwitch('client')} className="w-full">
            Voir en tant que Client
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewSwitcherModal;
