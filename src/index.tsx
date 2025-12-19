import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Clé pour stocker le flag de récupération de mot de passe
const PASSWORD_RECOVERY_FLAG = 'virtus_password_recovery_flow';

// IMPORTANT: Définir le flag de récupération de mot de passe AU PLUS TÔT
// avant que React ne soit initialisé et que les redirections ne se produisent
(() => {
  const pathname = window.location.pathname;
  const hash = window.location.hash;
  
  // Si on est sur /set-password et qu'il y a des tokens dans le hash
  // OU si le hash contient type=recovery
  if (pathname === '/set-password' || pathname.endsWith('/set-password')) {
    if (hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('token_type=bearer')) {
      console.log('[index.tsx] Password recovery flow detected, setting flag');
      sessionStorage.setItem(PASSWORD_RECOVERY_FLAG, 'true');
    }
  }
  
  // Vérifier aussi si l'URL complète contient des indicateurs de récupération
  const fullUrl = window.location.href;
  if (fullUrl.includes('type=recovery') && pathname.includes('set-password')) {
    console.log('[index.tsx] Password recovery detected in URL, setting flag');
    sessionStorage.setItem(PASSWORD_RECOVERY_FLAG, 'true');
  }
})();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
