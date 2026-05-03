/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1e293b',
          950: '#020617',
        },
        amber: {
          450: '#fbbf24',
        }
      },
      borderRadius: {
        card: '16px',
        panel: '24px',
        hero: '40px',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'rune-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-2px) rotate(2deg)' },
          '75%': { transform: 'translateY(1px) rotate(-1deg)' },
        },
        'rune-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.3))' },
          '50%': { filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.7))' },
        },
        'breadcrumb-dash': {
          '0%': { 'stroke-dashoffset': '8' },
          '100%': { 'stroke-dashoffset': '0' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'rune-float': 'rune-float 4s ease-in-out infinite',
        'rune-glow': 'rune-glow 2.5s ease-in-out infinite',
        'breadcrumb-dash': 'breadcrumb-dash 1s linear infinite',
      },
    },
  },
  plugins: [],
}
