import type { Config } from 'tailwindcss';

// Duolingo-inspired design system. Bright, friendly, chunky.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand greens (Duo "feather green")
        duo: {
          green: '#58CC02',
          greenDark: '#46A302',
          greenLight: '#89E219',
        },
        // Category colors for tool nodes
        cat: {
          compute: '#1CB0F6', // blue
          network: '#CE82FF', // purple
          data: '#FF9600', // orange
          messaging: '#FF4B4B', // red
          client: '#2B70C9', // deep blue
        },
        ink: '#3C3C3C',
        subtle: '#777777',
        cloud: '#F7F7F7',
        line: '#E5E5E5',
        // Feedback
        warn: '#FFC800',
        danger: '#FF4B4B',
        good: '#58CC02',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        body: ['"Nunito"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        // Chunky "3D button" bottom shadow
        chunky: '0 4px 0 rgba(0,0,0,0.18)',
        chunkySm: '0 3px 0 rgba(0,0,0,0.18)',
        card: '0 2px 0 rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(255,75,75,0.5)' },
          '70%': { boxShadow: '0 0 0 12px rgba(255,75,75,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255,75,75,0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        pop: 'pop 0.3s ease-out',
        pulseRing: 'pulseRing 1.4s ease-out infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
