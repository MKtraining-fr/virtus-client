import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { ArrowLeftIcon } from '../../constants/icons';

const ProFormationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { professionalFormations } = useAuth();
  const navigate = useNavigate();

  const formation = useMemo(() => {
    return professionalFormations.find((f) => f.id === id);
  }, [id, professionalFormations]);

  if (!formation) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Formation non trouvée</h1>
        <p className="text-gray-600 mt-2">
          La formation que vous cherchez n'existe pas ou a été supprimée.
        </p>
        <Button onClick={() => navigate('/app/formations')} className="mt-4">
          Retour aux formations
        </Button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Retour</span>
      </button>

      <Card className="overflow-hidden">
        <img
          src={formation.coverImageUrl}
          alt={formation.title}
          className="w-full h-64 object-cover"
        />
        <div className="p-8">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <h1 className="text-4xl font-extrabold text-gray-900">{formation.title}</h1>
            <div className="text-right">
              <span className="text-3xl font-bold text-primary">{formation.price} €</span>
              <p className="text-sm text-gray-500 capitalize">
                {formation.accessType === 'purchase' ? 'Achat unique' : 'Abonnement requis'}
              </p>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-8">
            {formation.description}
          </p>

          <div className="text-center">
            <Button size="lg">S'inscrire à la formation</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProFormationDetail;
