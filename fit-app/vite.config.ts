import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress certain warnings to prevent build failures
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    }
  }
})
