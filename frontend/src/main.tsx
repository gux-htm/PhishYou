/**
 * PhishYou — application entry.
 * Spec: FRONTEND_SPEC_ENHANCED.md — Application Routes, Shared Layout Components.
 *
 * Mounts the router. The AppShell (src/App.tsx) wraps every authenticated
 * page, /login renders standalone, and /api/* requests are proxied to the
 * PhishYou backend (see vite.config.ts) so credentials never reach the browser.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>,
);
