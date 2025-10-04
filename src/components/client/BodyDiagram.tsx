import React from 'react';

const BodyDiagram: React.FC = () => {
    return (
        <div className="bg-client-dark p-4 rounded-lg text-center border border-dashed border-client-subtle">
            <p className="text-client-subtle">
                [Schéma corporel interactif]
            </p>
            <p className="text-xs text-client-subtle mt-2">
                Cliquez sur un groupe musculaire pour filtrer les exercices.
            </p>
        </div>
    );
};

export default BodyDiagram;