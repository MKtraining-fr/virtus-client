import React from 'react';
import { Link } from 'react-router-dom';

// Icons for features
const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.75-5.455c.097-.534-.234-1.06-.738-1.282A10.5 10.5 0 0 0 19.5 12c0-2.343-1.04-4.438-2.724-5.882-1.684-1.444-3.92-2.318-6.276-2.318s-4.592.874-6.276 2.318C2.54 7.562 1.5 9.657 1.5 12c0 1.35.324 2.639.898 3.787-.504.222-.835.748-.738 1.282A9.09 9.09 0 0 0 6 18.72m12 0a9.09 9.09 0 0 1-12 0m12 0a9.09 9.09 0 0 0-12 0m12 0a9.09 9.09 0 0 0-12 0M6 12c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6Z" />
    </svg>
);
const ClipboardDocumentCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-1.125 0-2.25.9-2.25 2.25v15c0 1.125.9 2.25 2.25 2.25h10.5c1.125 0 2.25-.9 2.25-2.25v-15c0-1.125-.9-2.25-2.25-2.25h-4.5m-1.875 0c.375.625.625 1.375.625 2.25V7.5c0 .375-.375.75-.75.75h-3c-.375 0-.75-.375-.75-.75V4.5c0-.875.25-1.625.625-2.25m3.375-1.5c.375 0 .75.375.75.75v3c0 .414-.336.75-.75.75h-3.75a.75.75 0 0 1-.75-.75v-3c0-.375.375-.75.75-.75h3.75Zm9.375 12.125-3.375-3.375-1.5 1.5-3.375-3.375-1.5 1.5-3.375-3.375" />
    </svg>
);
const ChatBubbleLeftRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.532a2.25 2.25 0 0 1-2.28 0l-3.722-.532c-1.133-.093-1.98-1.057-1.98-2.193V10.608c0-.97.616-1.813 1.5-2.097m0 0A7.5 7.5 0 0 1 12 6a7.5 7.5 0 0 1 8.25 2.511M8.25 8.511a7.5 7.5 0 0 0-5.482 2.511M3.75 10.608V14.894c0 1.136.847 2.1 1.98 2.193l3.722.532a2.25 2.25 0 0 0 2.28 0l3.722-.532c1.133-.093 1.98-1.057 1.98-2.193V10.608" />
    </svg>
);
const DevicePhoneMobileIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75A2.25 2.25 0 0 0 15.75 1.5h-2.25m-3 0V3m3 0V3m0 18v-1.5m-3 0v-1.5m6-13.5H6" />
    </svg>
);
const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
);


const LandingPage: React.FC = () => {
    return (
        <div className="bg-light-bg text-dark-gray font-sans min-h-screen">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="text-2xl font-bold text-primary">
                        FITMASTER
                    </div>
                    <div>
                        <Link to="/login" className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-violet-700 transition-colors">
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
                            FitMaster est la plateforme tout-en-un conçue pour les coachs sportifs exigeants et leurs clients déterminés.
                            Créez, suivez, et communiquez comme jamais auparavant.
                        </p>
                    </div>
                </section>
                
                {/* Features Section */}
                <section id="features" className="py-20 lg:py-24">
                    <div className="container mx-auto px-6">
                        {/* Features for Coaches */}
                        <div className="text-center mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold">Un outil puissant pour les coachs</h2>
                            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Gagnez du temps, améliorez votre suivi et offrez une expérience premium à vos clients.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="text-center">
                                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <ClipboardDocumentCheckIcon className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-xl mt-6">Programmes Sur-Mesure</h3>
                                <p className="text-gray-600 mt-2">Créez des plans d'entraînement et de nutrition détaillés en quelques clics grâce à notre créateur intuitif et notre base de données d'exercices.</p>
                            </div>
                            <div className="text-center">
                                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <UserGroupIcon className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-xl mt-6">Suivi Client Détaillé</h3>
                                <p className="text-gray-600 mt-2">Accédez aux fiches clients complètes, suivez les mensurations, les performances et les progrès en un seul endroit.</p>
                            </div>
                            <div className="text-center">
                                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <ChatBubbleLeftRightIcon className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-xl mt-6">Communication Centralisée</h3>
                                <p className="text-gray-600 mt-2">Échangez facilement avec vos clients via la messagerie intégrée pour un suivi réactif et personnalisé.</p>
                            </div>
                        </div>

                        {/* Features for Clients */}
                        <div className="text-center mt-24 mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold">Une expérience unique pour les clients</h2>
                            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Accédez à votre coaching où que vous soyez et restez motivé pour atteindre vos objectifs.</p>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="text-center">
                                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <DevicePhoneMobileIcon className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-xl mt-6">Votre Plan à Portée de Main</h3>
                                <p className="text-gray-600 mt-2">Consultez vos séances d'entraînement et vos plans nutritionnels directement depuis votre smartphone.</p>
                            </div>
                            <div className="text-center">
                                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <ChartBarIcon className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-xl mt-6">Visualisez Vos Progrès</h3>
                                <p className="text-gray-600 mt-2">Suivez l'évolution de votre poids, de vos mensurations et de vos performances grâce à des graphiques clairs.</p>
                            </div>
                            <div className="text-center">
                                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <ChatBubbleLeftRightIcon className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-xl mt-6">Échangez avec Votre Coach</h3>
                                <p className="text-gray-600 mt-2">Posez vos questions, partagez vos réussites et recevez des encouragements via la messagerie privée.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200">
                <div className="container mx-auto px-6 py-6 text-center text-gray-500">
                    &copy; 2024 FitMaster. Tous droits réservés.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;