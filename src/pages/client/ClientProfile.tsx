import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Measurement,
  NutritionLogEntry,
  Client,
  SharedFile,
  DataPoint,
  BilanTemplate,
  BilanResult,
} from '../../types';
import ClientAccordion from '../../components/client/ClientAccordion';
import { Measurement as MeasurementType } from '../../types';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import MeasurementsLineChart from '../../components/charts/MeasurementsLineChart';

// --- ICONS ---
const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Zm0 13.036h.008v.008h-.008v-.008Z"
    />
  </svg>
);
const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
    />
  </svg>
);
const PhotoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
    />
  </svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {' '}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />{' '}
  </svg>
);

const InfoRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-400 dark:border-client-card">
    <span className="text-gray-500 dark:text-client-subtle capitalize">{label}</span>
    <span className="font-semibold text-gray-800 dark:text-client-light text-right">
      {value || 'Non défini'}
    </span>
  </div>
);

const ClientProfile: React.FC = () => {
  const { user, clients, setClients, logout, theme, setTheme, bilanTemplates } = useAuth();
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [selectedMeasurements, setSelectedMeasurements] = useState<Array<keyof MeasurementType>>([
    'chest',
  ]);
  const [editableWeight, setEditableWeight] = useState(user?.weight?.toString() || '');
  const [editableMeasurements, setEditableMeasurements] = useState<MeasurementType>(
    user?.nutrition.measurements || {}
  );
  const [selectedBilan, setSelectedBilan] = useState<BilanResult | null>(null);

  const measurementLabels: Record<keyof MeasurementType, string> = {
    neck: 'Cou (cm)',
    chest: 'Poitrine (cm)',
    l_bicep: 'Biceps G. (cm)',
    r_bicep: 'Biceps D. (cm)',
    waist: 'Taille (cm)',
    hips: 'Hanches (cm)',
    l_thigh: 'Cuisse G. (cm)',
    r_thigh: 'Cuisse D. (cm)',
  };

  const bilanTemplateForModal = useMemo(() => {
    if (!selectedBilan) return null;
    return bilanTemplates.find((t) => t.id === selectedBilan.templateId);
  }, [selectedBilan, bilanTemplates]);

  const photoFiles = useMemo(() => {
    if (!user?.sharedFiles) return [];
    return user.sharedFiles.filter((file) => file.fileType.startsWith('image/'));
  }, [user?.sharedFiles]);

  const documentFiles = useMemo(() => {
    if (!user?.sharedFiles) return [];
    return user.sharedFiles.filter((file) => !file.fileType.startsWith('image/'));
  }, [user?.sharedFiles]);

  const measurementHistoryForChart = useMemo(() => {
    if (!user?.nutrition.historyLog) return [];
    return [...user.nutrition.historyLog]
      .filter((log) => log.measurements)
      .reverse()
      .map((log) => ({
        date: log.date,
        ...log.measurements,
      }));
  }, [user]);

  const availableMeasurementsForSelect = useMemo(() => {
    if (!user?.nutrition.historyLog) return [];
    const available = new Set<keyof MeasurementType>();
    user.nutrition.historyLog.forEach((log) => {
      if (log.measurements) {
        (Object.keys(log.measurements) as Array<keyof MeasurementType>).forEach((key) => {
          if (log.measurements![key] !== undefined && log.measurements![key] !== null) {
            available.add(key);
          }
        });
      }
    });
    return Array.from(available);
  }, [user]);

  const measurementHistoryTable = useMemo(() => {
    if (!user?.nutrition.historyLog) return { data: [], headers: [] };
    const headers = new Set<keyof MeasurementType>();
    const validLogs = user.nutrition.historyLog.filter(
      (log) => log.weight || (log.measurements && Object.keys(log.measurements).length > 0)
    );

    validLogs.forEach((log) => {
      if (log.measurements) {
        (Object.keys(log.measurements) as (keyof MeasurementType)[]).forEach((key) => {
          if (log.measurements?.[key]) headers.add(key);
        });
      }
    });

    const sortedHeaders = Array.from(headers).sort();

    const data = validLogs.map((log) => ({
      date: log.date,
      weight: log.weight,
      ...log.measurements,
    }));

    return { data, headers: sortedHeaders };
  }, [user]);

  const handleToggleMeasurement = (key: keyof MeasurementType) => {
    setSelectedMeasurements((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  const handleMeasurementChange = (field: keyof MeasurementType, value: string) => {
    const numValue = parseFloat(value);
    setEditableMeasurements((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : isNaN(numValue) ? prev[field] : numValue,
    }));
  };

  const hasChanges = useMemo(() => {
    if (!user) return false;
    const weightChanged = editableWeight !== (user.weight?.toString() || '');
    const measurementsChanged =
      JSON.stringify(editableMeasurements) !== JSON.stringify(user.nutrition.measurements || {});
    return weightChanged || measurementsChanged;
  }, [user, editableWeight, editableMeasurements]);

  const handleSaveMeasurements = () => {
    if (!user || !hasChanges) return;

    const newWeight = editableWeight === '' ? null : parseFloat(editableWeight);
    const newMeasurements = editableMeasurements;

    const newLogEntry: NutritionLogEntry = {
      date: new Date().toLocaleDateString('fr-FR'),
      weight: newWeight,
      calories: user.nutrition.macros
        ? user.nutrition.macros.protein * 4 +
          user.nutrition.macros.carbs * 4 +
          user.nutrition.macros.fat * 9
        : 0,
      macros: user.nutrition.macros,
      measurements: newMeasurements,
    };

    const updatedClients = clients.map((c) => {
      if (c.id === user.id) {
        return {
          ...c,
          weight: newWeight !== null ? newWeight : c.weight,
          nutrition: {
            ...c.nutrition,
            measurements: newMeasurements,
            historyLog: [newLogEntry, ...c.nutrition.historyLog],
          },
        };
      }
      return c;
    });

    setClients(updatedClients as Client[]);
    alert('Vos informations ont été enregistrées avec succès !');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newFile: SharedFile = {
        id: `file-${Date.now()}`,
        fileName: file.name,
        fileType: file.type,
        fileContent: e.target?.result as string, // base64
        uploadedAt: new Date().toISOString(),
        size: file.size,
      };

      const updatedClients = clients.map((c) =>
        c.id === user.id ? { ...c, sharedFiles: [...(c.sharedFiles || []), newFile] } : c
      );
      setClients(updatedClients as Client[]);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteFile = (fileId: string) => {
    if (!user || !window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    const updatedClients = clients.map((c) =>
      c.id === user.id
        ? { ...c, sharedFiles: (c.sharedFiles || []).filter((f) => f.id !== fileId) }
        : c
    );
    setClients(updatedClients as Client[]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <img
          src={user?.avatar || `https://i.pravatar.cc/80?u=${user?.id}`}
          alt={user?.firstName}
          className="w-24 h-24 rounded-full border-2 border-primary"
        />
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-client-light">
          {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-gray-500 dark:text-client-subtle">{user?.email}</p>
      </div>

      <div className="space-y-2">
        <ClientAccordion title="Informations personnelles" isOpenDefault={true}>
          {user ? (
            <div className="space-y-1">
              <InfoRow label="Âge" value={user.age?.toString()} />
              <InfoRow label="Sexe" value={user.sex} />
              <InfoRow label="Taille" value={user.height ? `${user.height} cm` : undefined} />
              <InfoRow label="Poids actuel" value={user.weight ? `${user.weight} kg` : undefined} />
              <InfoRow label="Niveau d'activité" value={user.energyExpenditureLevel} />
              <InfoRow label="Téléphone" value={user.phone} />
              <InfoRow label="Date d'inscription" value={user.registrationDate} />
            </div>
          ) : null}
        </ClientAccordion>

        <ClientAccordion title="Mes bilans">
          {!user?.bilans || user.bilans.length === 0 ? (
            <p className="text-client-subtle text-center py-4">Aucun bilan assigné.</p>
          ) : (
            <div className="space-y-3">
              {[...user.bilans]
                .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
                .map((bilan) => (
                  <div
                    key={bilan.id}
                    className="flex flex-wrap justify-between items-center p-3 bg-client-dark rounded-lg border border-gray-700"
                  >
                    <div>
                      <p className="font-semibold text-client-light">{bilan.templateName}</p>
                      <p className="text-sm text-client-subtle">
                        Assigné le: {new Date(bilan.assignedAt).toLocaleDateString('fr-FR')} -
                        Statut:
                        <span
                          className={`font-medium ${bilan.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}
                        >
                          {bilan.status === 'completed' ? ' Complété' : ' En attente'}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedBilan(bilan)}
                        disabled={!bilan.answers && bilan.status === 'completed'}
                      >
                        {bilan.status === 'pending' ? 'Remplir le bilan' : 'Consulter'}
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ClientAccordion>

        <ClientAccordion title="Mensurations & Photos">
          <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-client-light">
            Graphique des Mensurations
          </h4>
          <MeasurementsLineChart
            data={measurementHistoryForChart}
            selectedMeasurements={selectedMeasurements}
          />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {availableMeasurementsForSelect.map((key) => (
              <label
                key={String(key)}
                className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 dark:text-client-subtle"
              >
                <input
                  type="checkbox"
                  checked={selectedMeasurements.includes(key)}
                  onChange={() => handleToggleMeasurement(key)}
                  className="rounded text-primary focus:ring-primary dark:bg-client-dark dark:border-gray-600"
                />
                <span>{measurementLabels[key].replace(' (cm)', '')}</span>
              </label>
            ))}
          </div>

          <div className="pt-6 mt-6 border-t border-gray-400 dark:border-client-card">
            <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-client-light">
              Historique des mensurations
            </h4>
            {measurementHistoryTable.data.length > 0 ? (
              <div className="overflow-x-auto border border-gray-400 dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 dark:text-client-subtle uppercase bg-gray-50 dark:bg-client-dark">
                    <tr>
                      <th className="p-2 font-semibold sticky left-0 bg-gray-50 dark:bg-client-dark">
                        Date
                      </th>
                      <th className="p-2 font-semibold">Poids (kg)</th>
                      {measurementHistoryTable.headers.map((key) => (
                        <th key={key} className="p-2 font-semibold">
                          {measurementLabels[key] || key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {measurementHistoryTable.data.map((row, index) => (
                      <tr key={index} className="bg-white dark:bg-client-card">
                        <td className="p-2 sticky left-0 bg-white dark:bg-client-card">
                          {row.date}
                        </td>
                        <td className="p-2">{row.weight ? row.weight.toFixed(1) : '-'}</td>
                        {measurementHistoryTable.headers.map((key) => (
                          <td key={key} className="p-2">
                            {row[key] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-client-subtle text-center py-4">
                Aucun historique de mensurations enregistré.
              </p>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-gray-400 dark:border-client-card">
            <h4 className="font-semibold text-lg text-gray-900 dark:text-client-light mb-4">
              Enregistrer de nouvelles données
            </h4>
            <div className="space-y-4">
              <Input
                label="Poids (kg)"
                type="number"
                value={editableWeight}
                onChange={(e) => setEditableWeight(e.target.value)}
                className="!bg-gray-100 dark:!bg-client-dark !border-gray-500 dark:!border-gray-700 focus:!ring-primary text-gray-800 dark:text-client-light"
              />
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(measurementLabels) as Array<keyof MeasurementType>).map((key) => (
                  <Input
                    key={key}
                    label={measurementLabels[key]}
                    type="number"
                    value={editableMeasurements[key] || ''}
                    onChange={(e) => handleMeasurementChange(key, e.target.value)}
                    className="!bg-gray-100 dark:!bg-client-dark !border-gray-500 dark:!border-gray-700 focus:!ring-primary text-gray-800 dark:text-client-light"
                  />
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveMeasurements} disabled={!hasChanges}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-400 dark:border-client-card">
            <h4 className="font-semibold text-lg text-gray-900 dark:text-client-light mb-4">
              Mes photos de suivi
            </h4>
            <input
              type="file"
              ref={photoInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <Button onClick={() => photoInputRef.current?.click()} className="w-full" size="lg">
              Téléverser une photo
            </Button>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
              {photoFiles.map((file) => (
                <div key={file.id} className="relative group aspect-square">
                  <img
                    src={file.fileContent}
                    alt={file.fileName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-between p-2 text-white">
                    <p className="text-xs font-semibold break-words">{file.fileName}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs">
                        {new Date(file.uploadedAt).toLocaleDateString('fr-FR')}
                      </p>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1 bg-red-500 rounded-full hover:bg-red-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {photoFiles.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-client-subtle mt-1">
                  Aucune photo téléversée.
                </p>
              </div>
            )}
          </div>
        </ClientAccordion>
        <ClientAccordion title="Mes Documents">
          <div className="space-y-6">
            <input
              type="file"
              ref={docInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,text/plain"
            />
            <Button onClick={() => docInputRef.current?.click()} className="w-full" size="lg">
              Téléverser un document
            </Button>

            <div className="!bg-primary/10 dark:!bg-primary/20 p-4 border border-primary/20 dark:border-primary/30 rounded-lg">
              <div className="flex items-center gap-4">
                <ShieldCheckIcon className="w-10 h-10 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-client-light">
                    Vos documents sont sécurisés
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-client-subtle mt-1">
                    Les fichiers que vous téléversez ici sont stockés de manière sécurisée et ne
                    sont visibles que par votre coach.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {documentFiles.length > 0 ? (
                documentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="!bg-white dark:!bg-client-dark/50 p-3 !shadow-sm border border-gray-400 dark:border-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 dark:bg-client-dark rounded-lg">
                        <DocumentIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-gray-900 dark:text-client-light truncate">
                          {file.fileName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-client-subtle">
                          {new Date(file.uploadedAt).toLocaleDateString('fr-FR')} &middot;{' '}
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-2 text-gray-500 dark:text-client-subtle hover:text-red-500"
                        aria-label="Supprimer le fichier"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-lg text-gray-800 dark:text-client-light">Aucun document.</p>
                  <p className="text-gray-500 dark:text-client-subtle mt-1">
                    Téléversez des bilans ou autres documents à partager.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ClientAccordion>
        <ClientAccordion title="Paramètres du compte">
          <div className="flex flex-col items-start space-y-2 text-gray-700 dark:text-client-subtle">
            <button className="hover:text-primary dark:hover:text-client-light">
              Modifier le mot de passe
            </button>
            <button className="hover:text-primary dark:hover:text-client-light">
              Notifications
            </button>
          </div>
        </ClientAccordion>
        <ClientAccordion title="Apparence">
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-client-subtle">Thème de l'application</p>
            <div className="flex items-center rounded-lg p-1 bg-gray-200 dark:bg-client-dark">
              <button
                onClick={() => setTheme('light')}
                className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${
                  theme === 'light'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 dark:text-client-subtle'
                }`}
              >
                Clair
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 dark:text-client-subtle'
                }`}
              >
                Sombre
              </button>
            </div>
          </div>
        </ClientAccordion>
      </div>

      <div className="pt-4">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors"
        >
          Se déconnecter
        </button>
      </div>

      {selectedBilan && bilanTemplateForModal && (
        <Modal
          isOpen={!!selectedBilan}
          onClose={() => setSelectedBilan(null)}
          title={selectedBilan.templateName}
          theme={theme}
          size="xl"
        >
          <div className="space-y-6">
            {bilanTemplateForModal.sections.map((section) => {
              if (section.isCivility && selectedBilan.templateId === 'system-default') return null;

              const answeredFields = section.fields.filter((field) => {
                const answer = selectedBilan?.answers?.[field.id];
                return (
                  answer !== undefined &&
                  answer !== null &&
                  answer !== '' &&
                  (!Array.isArray(answer) || answer.length > 0)
                );
              });

              if (answeredFields.length === 0) return null;

              return (
                <div key={section.id}>
                  <h4 className="font-semibold text-lg text-gray-800 dark:text-client-light mb-2 pt-4 border-t border-gray-400 dark:border-client-card first:pt-0 first:border-t-0">
                    {section.title}
                  </h4>
                  <div className="space-y-1">
                    {answeredFields.map((field) => {
                      const answer = selectedBilan!.answers![field.id];
                      return (
                        <div
                          key={field.id}
                          className="flex justify-between items-center py-2 border-b border-gray-400 dark:border-client-card"
                        >
                          <span className="text-gray-600 dark:text-client-subtle">
                            {field.label}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-client-light text-right">
                            {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {selectedBilan.status === 'pending' && (
              <div className="pt-6 border-t border-gray-400 dark:border-client-card mt-6 text-center">
                <Button>Commencer le bilan</Button>
                <p className="text-xs text-client-subtle mt-2">(Fonctionnalité à venir)</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClientProfile;
