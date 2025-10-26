import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import PerformanceHistoryModal from '../components/PerformanceHistoryModal';
import { useSortableData } from '../hooks/useSortableData';

// --- ICONS ---
const EyeIcon = ({ title, ...props }: React.SVGProps<SVGSVGElement> & { title?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {title && <title>{title}</title>}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = ({ title, ...props }: React.SVGProps<SVGSVGElement> & { title?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {title && <title>{title}</title>}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
    />
  </svg>
);

const EllipsisVerticalIcon = ({
  title,
  ...props
}: React.SVGProps<SVGSVGElement> & { title?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {title && <title>{title}</title>}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
    />
  </svg>
);

const SortIcon = ({ direction }: { direction: 'ascending' | 'descending' | null }) => {
  return (
    <span className="inline-block w-4 h-4 ml-1">
      {direction === 'ascending' && '▲'}
      {direction === 'descending' && '▼'}
    </span>
  );
};

const getLatestNote = (notes?: string): { display: string; full: string | null } => {
  if (!notes || !notes.trim()) {
    return { display: '-', full: null };
  }

  const firstNoteEntry = notes.split(/\n\n(?=---)/)[0];

  const match = firstNoteEntry.match(/--- .*? ---\n(.*)/s);

  let text = '';
  if (match && match[1]) {
    text = match[1].trim();
  } else {
    text = firstNoteEntry.trim();
  }

  const display = text.split('\n')[0];

  return {
    display: display,
    full: text,
  };
};

const Dashboard: React.FC = () => {
  const { user, clients: allClients, messages, setClients } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<string | null>(null);

  const clients = useMemo(() => {
    const activeClients = allClients.filter((p) => p.status === 'active' && p.role === 'client');
    if (user?.role === 'coach') {
      return activeClients.filter((c) => c.coachId === user.id);
    }
    return activeClients;
  }, [allClients, user]);

  const {
    items: sortedClients,
    requestSort,
    getSortDirection,
  } = useSortableData(clients, { key: 'lastName', direction: 'ascending' });

  useEffect(() => {
    const handleWindowClick = () => {
      if (openDropdown) setOpenDropdown(null);
    };
    if (openDropdown) {
      window.addEventListener('click', handleWindowClick);
    }
    return () => window.removeEventListener('click', handleWindowClick);
  }, [openDropdown]);

  const filteredClients = useMemo(() => {
    if (!filter) return sortedClients;
    return sortedClients.filter(
      (client) =>
        client.lastName.toLowerCase().includes(filter.toLowerCase()) ||
        client.firstName.toLowerCase().includes(filter.toLowerCase()) ||
        client.notes.toLowerCase().includes(filter.toLowerCase())
    );
  }, [sortedClients, filter]);

  const clientsWithStatus = useMemo(() => {
    const newMessagesByClient = messages.reduce(
      (acc, msg) => {
        if (user && msg.senderId !== user.id && !msg.seenByCoach) {
          acc[msg.clientId] = true;
        }
        return acc;
      },
      {} as Record<string, boolean>
    );

    return filteredClients.map((client) => ({
      ...client,
      hasNewMessage: !!newMessagesByClient[client.id],
    }));
  }, [filteredClients, messages, user]);

  const renderHeader = (label: string, key: keyof Client) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <button onClick={() => requestSort(key)} className="flex items-center hover:text-gray-700">
        {label}
        <SortIcon direction={getSortDirection(key)} />
      </button>
    </th>
  );

  const handleRowClick = (clientId: string) => {
    navigate(`/app/client/${clientId}`);
  };

  const handleEyeClick = (clientId: string) => {
    setSelectedClientForHistory(clientId);
  };

  const closeHistoryModal = () => {
    if (selectedClientForHistory) {
      const updatedClients = allClients.map((c) => {
        if (c.id === selectedClientForHistory) {
          // Mark all performance log sets as viewed
          const updatedPerformanceLog = c.performanceLog?.map((log) => ({
            ...log,
            exerciseLogs: log.exerciseLogs.map((exLog) => ({
              ...exLog,
              loggedSets: exLog.loggedSets.map((set) => ({
                ...set,
                viewedByCoach: true,
              })),
            })),
          }));
          // Set the global viewed flag to true
          return { ...c, performanceLog: updatedPerformanceLog, viewed: true };
        }
        return c;
      });
      setClients(updatedClients);
    }
    setSelectedClientForHistory(null);
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 shrink-0">Tableau de bord</h1>
      <div className="mb-4 shrink-0">
        <Input
          type="text"
          placeholder="Filtrer les clients..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                {renderHeader('Nom', 'lastName')}
                {renderHeader('Prénom', 'firstName')}
                {renderHeader('Semaine', 'programWeek')}
                {renderHeader('Séance', 'sessionProgress')}
                {renderHeader('Vu', 'viewed')}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messagerie
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientsWithStatus.map((client) => {
                const latestNote = getLatestNote(client.notes);
                const currentProgram = client.assignedPrograms?.[0];
                return (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(client.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {client.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.firstName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.programWeek !== undefined && client.totalWeeks !== undefined
                        ? `${client.programWeek}/${client.totalWeeks}`
                        : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.sessionProgress !== undefined && client.totalSessions !== undefined
                        ? `${client.sessionProgress}/${client.totalSessions}`
                        : ''}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEyeClick(client.id);
                        }}
                        className={`p-2 rounded-full transition-colors ${client.viewed ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'}`}
                        title={
                          client.viewed
                            ? 'Activité du client vue'
                            : "Nouvelle activité non vue. Cliquer pour voir l'historique."
                        }
                      >
                        {client.viewed ? (
                          <EyeIcon className="w-5 h-5 text-green-600" title="Vu" />
                        ) : (
                          <EyeSlashIcon className="w-5 h-5 text-red-600" title="Non vu" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center relative group">
                      <div className="truncate w-24 mx-auto">{latestNote.display}</div>
                      {latestNote.full && (
                        <div className="absolute bottom-full mb-2 w-max max-w-sm p-2 text-sm text-white bg-gray-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 left-1/2 -translate-x-1/2 pointer-events-none whitespace-pre-wrap text-left">
                          {latestNote.full}
                        </div>
                      )}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant={client.hasNewMessage ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => navigate(`/app/messagerie?clientId=${client.id}`)}
                        className="!text-xs"
                      >
                        {client.hasNewMessage ? 'Nouveau Message' : 'Ouvrir'}
                      </Button>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-block text-left">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="!p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === client.id ? null : client.id);
                          }}
                        >
                          <EllipsisVerticalIcon className="w-5 h-5" />
                        </Button>
                        {openDropdown === client.id && (
                          <div
                            className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1" role="menu" aria-orientation="vertical">
                              <button
                                onClick={() => {
                                  navigate(`/app/musculation/createur?clientId=${client.id}`);
                                  setOpenDropdown(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                              >
                                Nouveau programme
                              </button>
                              {currentProgram && (
                                <button
                                  onClick={() => {
                                    navigate(
                                      `/app/musculation/createur?clientId=${client.id}&editProgramId=${currentProgram.id}`
                                    );
                                    setOpenDropdown(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  Modifier le programme
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  navigate(`/app/nutrition/createur?clientId=${client.id}`);
                                  setOpenDropdown(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                              >
                                Nouveau plan alimentaire
                              </button>
                              <button
                                onClick={() => {
                                  navigate(`/app/client/${client.id}`);
                                  setOpenDropdown(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                              >
                                Profil
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {clientsWithStatus.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Aucun client à afficher.</p>
            </div>
          )}
        </div>
      </Card>
      <PerformanceHistoryModal
        isOpen={!!selectedClientForHistory}
        onClose={closeHistoryModal}
        clientId={selectedClientForHistory}
      />
    </div>
  );
};

export default Dashboard;
