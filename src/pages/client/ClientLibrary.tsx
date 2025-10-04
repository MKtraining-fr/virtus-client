import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
);

const LibraryCard: React.FC<{ title: string; description: string; to: string }> = ({ title, description, to }) => (
    <Link to={to} className="bg-white dark:bg-client-card rounded-lg p-4 flex justify-between items-center w-full hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors group">
        <div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-client-light">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-client-subtle">{description}</p>
        </div>
        <ChevronRightIcon className="w-6 h-6 text-gray-400 dark:text-client-subtle transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
);

const ClientLibrary: React.FC = () => {
    const { user } = useAuth();

    const hasAccessToFormations = user?.grantedFormationIds && user.grantedFormationIds.length > 0;

    return (
        <div className="space-y-4">
             {hasAccessToFormations && (
                <LibraryCard 
                    to="/app/library/formation"
                    title="Formation / Fichier" 
                    description="Accédez aux formations et fichiers débloqués par votre coach."
                />
             )}
            <LibraryCard 
                to="/app/library/musculation"
                title="Musculation" 
                description="Recherchez des exercices pour vos séances."
            />
            <LibraryCard 
                to="/app/library/mobilite"
                title="Mobilité" 
                description="Améliorez votre souplesse et votre posture."
            />
            <LibraryCard 
                to="/app/library/echauffement"
                title="Échauffement" 
                description="Préparez votre corps avant l'effort."
            />
            <LibraryCard 
                to="/app/library/glossaire"
                title="Glossaire" 
                description="Comprenez tous les termes techniques."
            />
        </div>
    );
};

export default ClientLibrary;