import React from 'react';
import Card from '../components/Card.tsx';

interface ComingSoonProps {
  title: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{title}</h1>
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-700">Bientôt disponible !</h2>
        <p className="mt-2 text-gray-500">Cette fonctionnalité est en cours de développement.</p>
      </Card>
    </div>
  );
};

export default ComingSoon;
