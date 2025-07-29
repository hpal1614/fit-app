import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Shims for incompatible Node.js modules
      '@sentry/react': path.resolve(__dirname, 'src/services/sentryShim.ts'),
      'prom-client': path.resolve(__dirname, 'src/services/promClientShim.ts'),
      // LangChain shims
      '@langchain/openai': path.resolve(__dirname, 'src/langchain-openai.ts'),
      '@langchain/langgraph': path.resolve(__dirname, 'src/langchain-langgraph.ts'),
      '@langchain/core/messages': path.resolve(__dirname, 'src/langchain-core/messages.ts')
    }
  },
  // Only add if you have Node.js polyfill issues
  define: {
    global: 'globalThis'
  }
})
