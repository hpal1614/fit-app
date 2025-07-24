import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
     resolve: {
     alias: [
       { find: '@sentry/react', replacement: resolve(__dirname, 'src/services/sentryShim.ts') },
       { find: 'node:async_hooks', replacement: resolve(__dirname, 'src/services/sentryShim.ts') },
       { find: 'prom-client', replacement: resolve(__dirname, 'src/services/promClientShim.ts') },
       { find: 'zlib', replacement: resolve(__dirname, 'src/services/zlibShim.ts') },
       // Specific aliases MUST come before catch-all patterns
       { find: /^@langchain\/openai$/, replacement: resolve(__dirname, 'src/langchain-openai.ts') },
       { find: /^@langchain\/langgraph$/, replacement: resolve(__dirname, 'src/langchain-langgraph.ts') },
       { find: /^@langchain\/core\/messages$/, replacement: resolve(__dirname, 'src/langchain-core/messages.ts') },
       // Catch-all: anything starting with @langchain or @langgraph -> empty stub
       { find: /^@langchain\/.*$/, replacement: resolve(__dirname, 'src/emptyModule.ts') },
       { find: /^@langgraph\/.*$/, replacement: resolve(__dirname, 'src/emptyModule.ts') },
     ]
   },
})
