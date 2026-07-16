/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep, slightly-cool near-black with layered surfaces.
        carbon: '#08080b',
        base: '#0b0b10',
        panel: '#131319',
        elevated: '#1b1b23',
        // F1 red + a hot variant for glows/hovers.
        accent: '#e10600',
        'accent-bright': '#ff2d1a',
        'accent-soft': '#ff2d1a',
      },
      fontFamily: {
        // Saira Condensed = F1 timing-tower display; Saira = sporty body; mono for data.
        display: ['Saira Condensed', 'Saira', 'system-ui', 'sans-serif'],
        sans: ['Saira', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 12px 44px -14px rgba(0,0,0,0.75)',
        glow: '0 0 24px -4px rgba(225,6,0,0.45)',
      },
      backgroundImage: {
        'red-sheen': 'linear-gradient(120deg, rgba(225,6,0,0.14), transparent 45%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.45s ease-out both',
      },
    },
  },
  plugins: [],
};
