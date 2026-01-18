import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
      <div className="text-center text-white p-8">
        <h1 className="text-6xl font-bold mb-4">Virtus</h1>
        <p className="text-xl mb-8">Votre coach sportif digital</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-white text-brand-primary px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
