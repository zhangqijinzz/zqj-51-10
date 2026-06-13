/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          primary: '#FF8C42',
          secondary: '#FF4D6D',
          accent: '#3E2723',
          neonPink: '#FF4D6D',
          neonGreen: '#7CB518',
          neonBlue: '#3A86FF',
          neonGold: '#FFD700',
        },
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 6px currentColor)' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 12px currentColor)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
