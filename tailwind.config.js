/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        'fitness-blue': '#3B82F6',
        'fitness-green': '#10B981',
        'fitness-orange': '#F59E0B',
        'fitness-red': '#EF4444',
        
        // Voice States
        'voice-listening': '#8B5CF6',
        'voice-speaking': '#06B6D4',
        'voice-processing': '#F59E0B',
        
        // Neutral Scale
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          900: '#111827',
        }
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'voice-wave': 'wave 1.5s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1)' },
        }
      }
    },
  },
  plugins: [],
}