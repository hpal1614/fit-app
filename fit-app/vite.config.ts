import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@sentry/react': resolve(__dirname, 'src/services/sentryShim.ts'),
      'node:async_hooks': resolve(__dirname, 'src/services/sentryShim.ts')
    }
  },
})
