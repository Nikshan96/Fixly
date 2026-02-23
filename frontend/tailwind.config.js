/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fixly-purple': {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        'fixly-orange': {
          500: '#ff6b35',
          600: '#ff5722',
        }
      },
      backgroundImage: {
        'gradient-fixly': 'linear-gradient(135deg, #0b1f4d 0%, #2563eb 50%, #38bdf8 100%)',
      }
    },
  },
  plugins: [],
}
