import * as React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

console.log('main.tsx - Starting app...');

// Render the app
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('main.tsx - App rendered successfully');
