// Hello World
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './pages/dashboard-command.css';
import './design/reboot-pages.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('PhishYou root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
