import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ClientFormation } from '../../../types';
import { ArrowLeftIcon } from '../../../constants/icons';

const ExternalLinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
);

const ArrowDownTrayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);


const FormationCard: React.FC<{ formation: ClientFormation }> = ({ formation }) => {
    
    const handleDownload = () => {
        if (formation.type !== 'file' || !formation.fileContent || !formation.fileName) return;
        const link = document.createElement('a');
        link.href = formation.fileContent;
        link.download = formation.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const commonClasses = "block bg-client-card rounded-lg p-4 cursor-pointer hover:bg-primary/20 transition-colors group w-full text-left";

    if (formation.type === 'link') {
        return (
            <a href={formation.url} target="_blank" rel="noopener noreferrer" className={commonClasses}>
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-client-light">{formation.title}</h3>
                    <ExternalLinkIcon className="w-5 h-5 text-client-subtle group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-client-subtle mt-1 truncate">
                    Cliquez pour ouvrir le lien
                </p>
            </a>
        );
    }
    
    if (formation.type === 'file') {
         return (
            <button onClick={handleDownload} className={commonClasses}>
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-client-light">{formation.title}</h3>
                    <ArrowDownTrayIcon className="w-5 h-5 text-client-subtle group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-client-subtle mt-1 truncate">
                    {formation.fileName}
                </p>
            </button>
        );
    }

    return null;
};

const FormationLibrary: React.FC = () => {
    const { user, clientFormations } = useAuth();
    const navigate = useNavigate();

    const accessibleFormations = useMemo(() => {
        if (!user || !user.grantedFormationIds) return [];
        const grantedIds = new Set(user.grantedFormationIds);
        return clientFormations.filter(f => grantedIds.has(f.id));
    }, [user, clientFormations]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-client-card rounded-full text-client-light hover:bg-primary/20">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-client-light">Mes Formations</h1>
            </div>

            {accessibleFormations.length > 0 ? (
                <div className="space-y-3">
                    {accessibleFormations.map(formation => (
                        <FormationCard key={formation.id} formation={formation} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-client-card rounded-lg">
                    <p className="text-client-light text-lg">Aucune formation disponible.</p>
                    <p className="text-client-subtle mt-1">Votre coach ne vous a pas encore donné accès à une formation.</p>
                </div>
            )}
        </div>
    );
};

export default FormationLibrary;
