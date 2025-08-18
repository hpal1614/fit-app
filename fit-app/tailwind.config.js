/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors - New clean palette
        'primary': '#a5e635',
        'primary-dark': '#8ac926',
        'primary-light': '#b8f44a',
        'primary-50': '#f7fdf0',
        'primary-100': '#eefad8',
        'primary-200': '#ddf4b0',
        'primary-300': '#c8ed7e',
        'primary-400': '#a5e635',
        'primary-500': '#8ac926',
        'primary-600': '#6ba01c',
        'primary-700': '#527a1a',
        'primary-800': '#43611a',
        'primary-900': '#39521a',
        
        // Secondary Colors - Clean and modern
        'secondary': '#6366f1',
        'secondary-dark': '#4f46e5',
        'accent': '#f59e0b',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
        
        // Voice States - Updated with new palette
        'voice-listening': '#a5e635',
        'voice-speaking': '#6366f1',
        'voice-processing': '#f59e0b',
        'voice-idle': '#6b7280',
        'voice-error': '#ef4444',
        
        // Legacy colors for backward compatibility
        'fitness-blue': '#3B82F6',
        'fitness-green': '#10B981',
        'fitness-orange': '#F59E0B',
        'fitness-red': '#EF4444',
        
        // Neutral Scale - Cleaner grays
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        
        // Dark mode specific colors
        'dark': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #a5e635 0%, #8ac926 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'gradient-light': 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'voice-wave': 'wave 1.5s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}

