import React from 'react';
import { useAuth } from '../../context/AuthContext';

const InfoRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-client-card">
        <span className="text-client-subtle">{label}</span>
        <span className="font-semibold text-client-light">{value || 'Non défini'}</span>
    </div>
);

const ClientAccount: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center">
                <img
                    src={user?.avatar || `https://i.pravatar.cc/80?u=${user?.id}`}
                    alt={user?.firstName}
                    className="w-24 h-24 rounded-full border-2 border-primary"
                />
                <h2 className="mt-4 text-2xl font-bold text-client-light">{user?.firstName} {user?.lastName}</h2>
                <p className="text-client-subtle">{user?.email}</p>
            </div>

            <div className="bg-client-card rounded-lg p-4">
                <h3 className="font-bold text-lg text-client-light mb-2">Mes Informations</h3>
                <InfoRow label="Objectif" value={user?.objective} />
                <InfoRow label="Téléphone" value={user?.phone} />
                <InfoRow label="Date d'inscription" value={user?.registrationDate} />
            </div>

            <div>
                 <button 
                    onClick={logout}
                    className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors"
                 >
                    Se déconnecter
                </button>
            </div>
        </div>
    );
};

export default ClientAccount;