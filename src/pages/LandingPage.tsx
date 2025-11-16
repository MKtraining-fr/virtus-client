import React from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
} from '../constants/icons';

const LandingPage: React.FC = () => {
  return (
    <div className="bg-light-bg text-dark-gray font-sans min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">VIRTUS</div>
          <div>
            <Link
              to="/login"
              className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-violet-700 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <section className="bg-white text-center py-20 lg:py-32">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl lg:text-6xl font-extrabold text-dark-gray leading-tight">
              Transformez Votre Coaching.
              <br />
              <span className="text-primary">Révolutionnez Vos Entraînements.</span>
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              Virtus est la plateforme tout-en-un conçue pour les coachs sportifs exigeants et leurs
              clients déterminés. Créez, suivez, et communiquez comme jamais auparavant.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 lg:py-24">
          <div className="container mx-auto px-6">
            {/* Features for Coaches */}
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold">Un outil puissant pour les coachs</h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Gagnez du temps, améliorez votre suivi et offrez une expérience premium à vos
                clients.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <ClipboardDocumentCheckIcon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl mt-6">Programmes Sur-Mesure</h3>
                <p className="text-gray-600 mt-2">
                  Créez des plans d'entraînement et de nutrition détaillés en quelques clics grâce à
                  notre créateur intuitif et notre base de données d'exercices.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <UserGroupIcon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl mt-6">Suivi Client Détaillé</h3>
                <p className="text-gray-600 mt-2">
                  Accédez aux fiches clients complètes, suivez les mensurations, les performances et
                  les progrès en un seul endroit.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <ChatBubbleLeftRightIcon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl mt-6">Communication Centralisée</h3>
                <p className="text-gray-600 mt-2">
                  Échangez facilement avec vos clients via la messagerie intégrée pour un suivi
                  réactif et personnalisé.
                </p>
              </div>
            </div>

            {/* Features for Clients */}
            <div className="text-center mt-24 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Une expérience unique pour les clients
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Accédez à votre coaching où que vous soyez et restez motivé pour atteindre vos
                objectifs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <DevicePhoneMobileIcon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl mt-6">Votre Plan à Portée de Main</h3>
                <p className="text-gray-600 mt-2">
                  Consultez vos séances d'entraînement et vos plans nutritionnels directement depuis
                  votre smartphone.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <ChartBarIcon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl mt-6">Visualisez Vos Progrès</h3>
                <p className="text-gray-600 mt-2">
                  Suivez l'évolution de votre poids, de vos mensurations et de vos performances
                  grâce à des graphiques clairs.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <ChatBubbleLeftRightIcon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl mt-6">Échangez avec Votre Coach</h3>
                <p className="text-gray-600 mt-2">
                  Posez vos questions, partagez vos réussites et recevez des encouragements via la
                  messagerie privée.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 py-6 text-center text-gray-500">
          &copy; 2024 Virtus. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
