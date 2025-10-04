import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '../../../constants/icons';

const GlossaireLibrary: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
             <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-client-card rounded-full text-gray-800 dark:text-client-light hover:bg-gray-100 dark:hover:bg-primary/20 border border-gray-300 dark:border-gray-700">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-client-light">Glossaire</h1>
            </div>
            <div className="text-center py-16 bg-white dark:bg-client-card rounded-lg border border-gray-200 dark:border-transparent">
                <p className="text-gray-900 dark:text-client-light text-lg">Bientôt disponible !</p>
                <p className="text-gray-500 dark:text-client-subtle mt-1">Cette section contiendra les définitions des termes techniques.</p>
            </div>
        </div>
    );
};

export default GlossaireLibrary;
