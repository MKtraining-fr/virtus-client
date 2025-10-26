import React, { ReactNode } from 'react';

interface FormGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Composant pour créer des grilles de formulaires responsive
 *
 * Sur mobile : toujours 1 colonne
 * Sur tablette : 2 colonnes max
 * Sur desktop : nombre de colonnes spécifié
 *
 * Utilisation :
 * <FormGrid columns={2}>
 *   <Input label="Prénom" />
 *   <Input label="Nom" />
 *   <Input label="Email" />
 * </FormGrid>
 */
const FormGrid: React.FC<FormGridProps> = ({ children, columns = 2, className = '' }) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 md:gap-6 ${className}`}>{children}</div>
  );
};

export default FormGrid;
