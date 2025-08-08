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
        'voice-idle': '#6B7280',
        'voice-error': '#EF4444',
        
        // Primary/Secondary for gradients
        'primary': {
          500: '#3B82F6',
          600: '#2563EB',
        },
        'secondary': {
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        
        // Neutral Scale
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'voice-wave': 'wave 1.5s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

