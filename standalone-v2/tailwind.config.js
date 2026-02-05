/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Activer le mode sombre avec la classe 'dark'
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6D5DD3',
        'primary-dark': '#5A4BB5',
        'primary-light': '#9B8FE8',
        accent: {
          orange: '#FF6B35',
          green: '#4CAF50',
          red: '#EF4444',
          blue: '#3B82F6',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
