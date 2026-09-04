import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import './pages/dashboard-command.css';

const root = document.getElementById('root');
if (!root) throw new Error('PhishYou root element was not found.');

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
