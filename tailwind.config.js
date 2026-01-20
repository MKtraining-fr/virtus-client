/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Couleurs existantes (à conserver pour compatibilité)
        'primary': '#6D5DD3',
        'sidebar-bg': '#23272A',
        'light-bg': '#F7F8FA',
        'dark-text': '#1F2937',
        'dark-gray': '#23272A',
        'client-dark': '#121212',
        'client-card': '#1E1E1E',
        'client-light': '#E0E0E0',
        'client-subtle': '#A0A0A0',

        // Nouvelle palette pour la refonte
        // Marque
        'brand-primary': '#7b6df2',
        'brand-secondary': '#38338e',
        
        // Accents
        'accent-cyan': '#00D9FF',
        'accent-orange': '#FF6B35',
        'accent-green': '#00FF88',
        'accent-gold': '#FFB800',
        
        // Backgrounds
        'background': '#0A0E14',
        'bg-primary': '#0A0E14',
        'bg-card': '#151922',
        
        // Texte
        'text-primary': '#FFFFFF',
        'text-secondary': '#E0E0E0',
        'text-tertiary': '#A0A0A0',
        'text-disabled': '#8B92A8',
        
        // Système
        'error': '#FF4444',
        'warning': '#FFA500',
        'info': '#00D9FF',
        'success': '#00FF88',
        
        // Rewards (pour V2)
        'tier-bronze': '#CD7F32',
        'tier-silver': '#C0C0C0',
        'tier-gold': '#FFB800',
        'tier-platinum': '#E5E4E2',
        'tier-diamond': '#B9F2FF',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
      },
      animation: {
        'confetti': 'confetti 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        confetti: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
