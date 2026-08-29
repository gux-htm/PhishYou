// Hello World
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import './theme.css';
import './pages/dashboard-command.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('PhishYou root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
