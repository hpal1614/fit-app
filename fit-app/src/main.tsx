// Set up error filtering IMMEDIATELY before any other imports
import { setupErrorFiltering } from './utils/errorFilter'
setupErrorFiltering();

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx loaded');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

console.log('React app rendered');
