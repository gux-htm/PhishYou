import { Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="py-theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      <span className="py-theme-toggle-label">{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
    </button>
  );
}

export function SettingsAppearancePanel() {
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();

  if (pathname !== '/settings') return null;

  return (
    <section className="py-appearance-panel" aria-label="Appearance settings">
      <div className="py-appearance-copy">
        <span className="py-system-label">INTERFACE / APPEARANCE</span>
        <h2>Choose your operating environment.</h2>
        <p>Light mode keeps the same signal language with brighter surfaces; dark mode preserves the cinematic command environment.</p>
      </div>
      <div className="py-theme-options" role="group" aria-label="Theme preference">
        <button className={`py-theme-option ${theme === 'dark' ? 'is-active' : ''}`} onClick={() => setTheme('dark')} type="button">
          <span className="py-theme-preview py-theme-preview-dark"><Moon size={18} /></span>
          <span><strong>Dark</strong><small>Command environment</small></span>
        </button>
        <button className={`py-theme-option ${theme === 'light' ? 'is-active' : ''}`} onClick={() => setTheme('light')} type="button">
          <span className="py-theme-preview py-theme-preview-light"><Sun size={18} /></span>
          <span><strong>Light</strong><small>High-clarity workspace</small></span>
        </button>
      </div>
    </section>
  );
}
