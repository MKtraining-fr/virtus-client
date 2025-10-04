import React, { ReactNode } from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  mobileLabel?: string; // Label spécifique pour mobile
  hideOnMobile?: boolean; // Masquer cette colonne sur mobile
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

/**
 * Composant de tableau responsive qui affiche :
 * - Un tableau classique sur desktop (md et plus)
 * - Des cartes empilées sur mobile
 * 
 * Utilisation :
 * <ResponsiveTable
 *   data={clients}
 *   columns={[
 *     { key: 'name', label: 'Nom' },
 *     { key: 'email', label: 'Email', hideOnMobile: true },
 *     { key: 'actions', label: 'Actions', render: (client) => <Button>Voir</Button> }
 *   ]}
 *   keyExtractor={(client) => client.id}
 *   onRowClick={(client) => navigate(`/client/${client.id}`)}
 * />
 */
function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'Aucune donnée disponible',
  className = '',
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const handleRowClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  return (
    <div className={className}>
      {/* Vue Desktop : Tableau classique */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => handleRowClick(item)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(item) : String(item[column.key] || '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue Mobile : Cartes empilées */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => handleRowClick(item)}
            className={`bg-white rounded-lg shadow p-4 border border-gray-200 ${
              onRowClick ? 'cursor-pointer active:bg-gray-50' : ''
            }`}
          >
            {columns
              .filter((column) => !column.hideOnMobile)
              .map((column) => (
                <div key={column.key} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm font-medium text-gray-500 mr-4">
                    {column.mobileLabel || column.label}
                  </span>
                  <span className="text-sm text-gray-900 text-right flex-1">
                    {column.render ? column.render(item) : String(item[column.key] || '-')}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResponsiveTable;
