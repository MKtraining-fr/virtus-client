import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Composant qui intercepte les callbacks d'authentification Supabase
 * et redirige vers les pages appropriées
 */
export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier s'il y a un hash fragment dans l'URL (utilisé par Supabase)
    const hash = window.location.hash;
    
    if (hash) {
      // Parser les paramètres du hash
      const params = new URLSearchParams(hash.substring(1));
      const type = params.get('type');
      const accessToken = params.get('access_token');
      
      // Si c'est un lien de réinitialisation de mot de passe
      if (type === 'recovery' && accessToken) {
        // Rediriger vers la page de définition du mot de passe
        // en conservant les paramètres nécessaires
        navigate(`/set-password${hash}`);
      }
    }
  }, [navigate]);

  return null; // Ce composant ne rend rien
}
