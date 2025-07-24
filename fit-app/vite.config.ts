import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@sentry/react': resolve(__dirname, 'src/services/sentryShim.ts'),
      'node:async_hooks': resolve(__dirname, 'src/services/sentryShim.ts'),
      'prom-client': resolve(__dirname, 'src/services/promClientShim.ts'),
      zlib: resolve(__dirname, 'src/services/zlibShim.ts'),
      '@langchain/core/messages': resolve(__dirname, 'src/langchain-core/messages.ts'),
      '@langchain/core': resolve(__dirname, 'src/langchain-core'),
      '@langchain/core/singletons': resolve(__dirname, 'src/langchain-core/singletons.ts'),
      '@langchain/core/setup': resolve(__dirname, 'src/langchain-core/singletons.ts'),
      '@langchain/core/utils/env': resolve(__dirname, 'src/langchain-core/utils/env.ts'),
      '@langchain/core/utils': resolve(__dirname, 'src/langchain-core/utils'),
    }
  },
})
