/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Arcade theme colors
        arcade: {
          bg: '#0a0a0a',
          secondary: '#1a1a2e',
          surface: '#16162a',
          border: '#2d2d4a',
        },
        cyan: '#00ffff',
        magenta: '#ff00ff',
        neon: {
          green: '#00ff00',
          yellow: '#ffff00',
          red: '#ff4444',
        },
        muted: '#94a3b8',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)' },
        },
      },
    },
  },
  plugins: [],
}
