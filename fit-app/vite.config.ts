import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
    
    // Manual chunks for better code splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            return 'vendor';
          }
          
          // Split app modules
          if (id.includes('/services/ai') || id.includes('/constants/ai')) {
            return 'ai-module';
          }
          if (id.includes('/services/voice') || id.includes('/constants/voice')) {
            return 'voice-module';
          }
          if (id.includes('/services/workout') || id.includes('/constants/exercises')) {
            return 'workout-module';
          }
        }
      }
    },
    
    // Enable minification
    minify: 'esbuild',
    
    // Enable source maps for production debugging
    sourcemap: false,
    
    // Target modern browsers for smaller bundles
    target: 'es2015'
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
    exclude: []
  },
  
  // Server configuration
  server: {
    port: 5173,
    host: true
  }
})
