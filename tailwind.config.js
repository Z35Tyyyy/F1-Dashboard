/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // F1 brand: near-black navy background, layered surfaces, signature red.
        base: '#15151e',
        panel: '#1f1f27',
        carbon: '#0d0d12',
        accent: '#e10600', // F1 red
        'accent-soft': '#ff2b20', // brighter red for text/lines on dark
      },
      fontFamily: {
        // Titillium Web is Formula 1's brand typeface (free / open source).
        sans: ['Titillium Web', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(0,0,0,0.7)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
