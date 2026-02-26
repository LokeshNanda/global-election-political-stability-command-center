import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'psi-stable': '#22c55e',
        'psi-moderate': '#eab308',
        'psi-elevated': '#f97316',
        'psi-high': '#ef4444',
        'psi-crisis': '#dc2626',
        'glass': 'rgba(15, 23, 42, 0.6)',
        'glass-border': 'rgba(148, 163, 184, 0.1)',
        'neon-green': '#39ff14',
        'neon-red': '#ff073a',
        'neon-blue': '#00d4ff',
      },
      backdropBlur: {
        'glass': '12px',
      },
      boxShadow: {
        'neon-green': '0 0 10px #39ff14, 0 0 20px #39ff14',
        'neon-red': '0 0 10px #ff073a, 0 0 20px #ff073a',
        'neon-blue': '0 0 10px #00d4ff, 0 0 20px #00d4ff',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { opacity: '1', boxShadow: '0 0 5px currentColor' },
          '100%': { opacity: '0.8', boxShadow: '0 0 20px currentColor' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
