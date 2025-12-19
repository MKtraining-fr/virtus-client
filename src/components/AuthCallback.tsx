import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Composant qui intercepte les callbacks d'authentification Supabase
 * et redirige vers les pages appropriées
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Avec BrowserRouter, Supabase ajoute les tokens dans le hash de l'URL
    // Format: /set-password#access_token=...&refresh_token=...&type=recovery
    const hash = window.location.hash;

    if (hash) {
      // Parser les paramètres du hash
      const params = new URLSearchParams(hash.substring(1));
      const type = params.get('type');
      const accessToken = params.get('access_token');

      // Si c'est un lien de réinitialisation de mot de passe et qu'on n'est pas déjà sur /set-password
      if (type === 'recovery' && accessToken && location.pathname !== '/set-password') {
        // Rediriger vers la page de définition du mot de passe
        // en conservant les paramètres dans le hash
        navigate(`/set-password${hash}`);
      }
    }
  }, [navigate, location.pathname]);

  return null; // Ce composant ne rend rien
}
