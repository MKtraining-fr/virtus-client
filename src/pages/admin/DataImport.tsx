import React, { useState } from 'react';
import Card from '../../components/Card.tsx';
import Button from '../../components/Button.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  importUsersFromCSV,
  importExercisesFromCSV,
  importFoodItemsFromCSV,
  ImportResult,
} from '../../services/csvImportService';

type ImportableKey = 'users' | 'exercises' | 'ciqual' | 'products' | 'partners' | 'intensification';

const IMPORT_CONFIG: {
  [key in ImportableKey]: { title: string; requiredHeaders: string[]; description: string };
} = {
  users: {
    title: 'Utilisateurs (Coachs & Clients)',
    requiredHeaders: ['firstName', 'lastName', 'email'],
    description:
      'Importer des utilisateurs. Les utilisateurs avec status=active auront un compte Auth créé automatiquement.',
  },
  exercises: {
    title: 'Exercices (Musculation, Mobilité, Échauffement)',
    requiredHeaders: ['name', 'category'],
    description: 'Importer des exercices. Utilisez | pour séparer les groupes musculaires.',
  },
  ciqual: {
    title: 'Base Alimentaire (Ciqual)',
    requiredHeaders: ['alim_nom_fr', 'alim_grp_nom_fr'],
    description: 'Importer des aliments. Supporte le format Ciqual officiel (séparateur ;) ou le format simplifié Virtus (name, category, calories, protein, carbs, fat).',
  },
  products: {
    title: 'Produits Boutique',
    requiredHeaders: [
      'name',
      'description',
      'price',
      'category',
      'imageUrl',
      'productUrl',
      'ownerId',
    ],
    description: 'Importer des produits pour la boutique (fonctionnalité à venir).',
  },
  partners: {
    title: 'Partenaires Boutique',
    requiredHeaders: ['name', 'description', 'logoUrl', 'offerUrl', 'ownerId'],
    description: 'Importer des partenaires pour la boutique (fonctionnalité à venir).',
  },
  intensification: {
    title: "Techniques d'Intensification",
    requiredHeaders: ['name', 'description'],
    description: "Importer des techniques d'intensification (fonctionnalité à venir).",
  },
};

interface Message {
  type: 'success' | 'error' | 'warning';
  text: string;
  details?: string[];
}

const DataImport: React.FC = () => {
  const { user, reloadAllData } = useAuth();
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [messages, setMessages] = useState<Record<string, Message>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleFileChange = (key: ImportableKey, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setMessages((prev) => {
      const newMessages = { ...prev };
      delete newMessages[key];
      return newMessages;
    });
  };

  const formatImportResult = (result: ImportResult): Message => {
    if (result.errors.length === 0) {
      return {
        type: 'success',
        text: `✅ ${result.success}/${result.total} ligne(s) importée(s) avec succès !`,
      };
    } else if (result.success > 0) {
      const errorDetails = result.errors.slice(0, 10).map((e) => `Ligne ${e.row}: ${e.error}`);
      if (result.errors.length > 10) {
        errorDetails.push(`... et ${result.errors.length - 10} autre(s) erreur(s)`);
      }
      return {
        type: 'warning',
        text: `⚠️ ${result.success}/${result.total} ligne(s) importée(s). ${result.errors.length} erreur(s).`,
        details: errorDetails,
      };
    } else {
      const errorDetails = result.errors.slice(0, 10).map((e) => `Ligne ${e.row}: ${e.error}`);
      if (result.errors.length > 10) {
        errorDetails.push(`... et ${result.errors.length - 10} autre(s) erreur(s)`);
      }
      return {
        type: 'error',
        text: `❌ Import échoué. ${result.errors.length} erreur(s).`,
        details: errorDetails,
      };
    }
  };

  const handleImport = async (key: ImportableKey) => {
    const file = files[key];
    if (!file) {
      setMessages((prev) => ({
        ...prev,
        [key]: { type: 'error', text: 'Veuillez sélectionner un fichier.' },
      }));
      return;
    }

    if (!user) {
      setMessages((prev) => ({
        ...prev,
        [key]: { type: 'error', text: 'Utilisateur non connecté.' },
      }));
      return;
    }

    setLoading((prev) => ({ ...prev, [key]: true }));
    setMessages((prev) => {
      const newMessages = { ...prev };
      delete newMessages[key];
      return newMessages;
    });

    try {
      let result: ImportResult;

      switch (key) {
        case 'users':
          result = await importUsersFromCSV(file);
          break;

        case 'exercises':
          result = await importExercisesFromCSV(file, user.id);
          break;

        case 'ciqual':
          result = await importFoodItemsFromCSV(file);
          break;

        case 'products':
        case 'partners':
        case 'intensification':
          setMessages((prev) => ({
            ...prev,
            [key]: {
              type: 'warning',
              text: 'Cette fonctionnalité sera disponible prochainement.',
            },
          }));
          return;

        default:
          throw new Error("Type d'import non supporté");
      }

      // Afficher le résultat

      setMessages((prev) => ({ ...prev, [key]: formatImportResult(result) }));

      // Recharger les données depuis Supabase
      if (result.success > 0) {
        await reloadAllData();
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Une erreur inconnue est survenue.');
      console.error('Erreur import:', err);
      setMessages((prev) => ({
        ...prev,
        [key]: {
          type: 'error',
          text: `Erreur : ${err.message}`,
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
      // Réinitialiser le fichier
      setFiles((prev) => ({ ...prev, [key]: null }));
    }
  };

  const downloadTemplate = (key: ImportableKey) => {
    const config = IMPORT_CONFIG[key];
    const headers = config.requiredHeaders.join(',');

    // Exemples de données selon le type
    let exampleRows = '';
    switch (key) {
      case 'users':
        exampleRows =
          'Jean,Dupont,jean.dupont@example.com,0612345678,client,active\nMarie,Martin,marie.martin@example.com,0687654321,client,prospect';
        break;
      case 'exercises':
        exampleRows =
          'Développé couché,Musculation,Exercice pour les pectoraux,Barre|Banc,Pectoraux|Triceps|Épaules\nSquat,Musculation,Exercice pour les jambes,Barre,Quadriceps|Fessiers';
        break;
      case 'ciqual':
        // Template pour format simplifié Virtus (le format Ciqual officiel est auto-détecté)
        exampleRows = 'Poulet grillé,Viandes,165,31,0,3.6,0.5,1.2,0.8\nRiz blanc cuit,Féculents,130,2.7,28,0.3,0.1,0.4,0';
        break;
    }

    const csvContent = `${headers}\n${exampleRows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `template_${key}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Import de données CSV</h1>
        <p className="text-gray-600 mb-4">
          Utilisez cette page pour importer en masse des données dans l'application. Les données
          sont automatiquement sauvegardées dans Supabase.
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Nouveauté :</strong> Les données sont maintenant persistées dans Supabase.
                Les utilisateurs avec status=active auront un compte Auth créé automatiquement.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Object.keys(IMPORT_CONFIG) as ImportableKey[]).map((key) => {
          const config = IMPORT_CONFIG[key];
          const message = messages[key];
          const isLoading = loading[key];
          const selectedFile = files[key];

          return (
            <Card key={key} className="p-6 flex flex-col">
              <h2 className="text-lg font-bold text-gray-800 mb-2">{config.title}</h2>
              <p className="text-sm text-gray-600 mb-4 flex-grow">{config.description}</p>

              <div className="space-y-3">
                {/* Bouton pour télécharger le template */}
                <button
                  onClick={() => downloadTemplate(key)}
                  className="w-full text-sm text-primary hover:text-primary-dark underline text-left"
                >
                  📥 Télécharger le template CSV
                </button>

                {/* Champs requis */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Champs requis :</strong> {config.requiredHeaders.join(', ')}
                </div>

                {/* Input fichier */}
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileChange(key, e.target.files ? e.target.files[0] : null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-primary hover:file:bg-violet-100 cursor-pointer"
                />

                {/* Nom du fichier sélectionné */}
                {selectedFile && (
                  <p className="text-xs text-gray-600">
                    📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}

                {/* Bouton d'import */}
                <Button
                  onClick={() => handleImport(key)}
                  disabled={!selectedFile || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Importation...
                    </span>
                  ) : (
                    'Importer'
                  )}
                </Button>

                {/* Message de résultat */}
                {message && (
                  <div
                    className={`text-sm p-3 rounded ${
                      message.type === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : message.type === 'warning'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                  >
                    <p className="font-medium">{message.text}</p>
                    {message.details && message.details.length > 0 && (
                      <ul className="mt-2 text-xs space-y-1">
                        {message.details.map((detail, idx) => (
                          <li key={idx}>• {detail}</li>
                        ))}
                        {message.details.length >= 5 && (
                          <li className="italic">... (premières erreurs affichées)</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DataImport;
