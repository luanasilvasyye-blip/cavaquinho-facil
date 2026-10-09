/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          300: '#6CF2B3',
          400: '#2BE89A',
          500: '#10D97E',
          600: '#0BB86A',
          DEFAULT: '#10D97E'
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#f3d27a',
          dark: '#9c7c1e'
        },
        ink: {
          950: '#08090B',
          900: '#0E1114',
          850: '#12161B',
          800: '#171D24',
          700: '#222B35'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0, 0, 0, 0.45)',
        glow: '0 8px 32px rgba(16, 217, 126, 0.28)',
        card: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }
    }
  },
  plugins: []
}
