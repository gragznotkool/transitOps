/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Deep colors for a modern, sleek appearance
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#dae3ff',
          300: '#bdcbff',
          400: '#94a7ff',
          500: '#6379ff', // primary accent indigo
          600: '#4753f5',
          700: '#373edd',
          800: '#2e33b3',
          900: '#2a2e8f',
          950: '#1b1c54',
        },
        darkBg: '#0f172a', // Slate 900
        darkCard: '#1e293b', // Slate 800
        darkBorder: '#334155', // Slate 700
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
