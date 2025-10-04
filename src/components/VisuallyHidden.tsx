import React, { ReactNode } from 'react';

interface VisuallyHiddenProps {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Composant pour masquer visuellement du contenu tout en le gardant accessible aux lecteurs d'écran
 * 
 * Utilisation :
 * <button>
 *   <IconTrash />
 *   <VisuallyHidden>Supprimer</VisuallyHidden>
 * </button>
 * 
 * Le texte "Supprimer" sera lu par les lecteurs d'écran mais invisible visuellement.
 */
const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children, as: Component = 'span' }) => {
  return (
    <Component
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Component>
  );
};

export default VisuallyHidden;
