import { MonitorCog, Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();

  if (pathname === '/settings') return null;

  const isLight = theme === 'light';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="py-theme-toggle fixed right-4 top-4 z-[70] inline-flex items-center gap-2 border px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] shadow-lg backdrop-blur-xl sm:right-6 sm:top-5"
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      title={`Switch to ${isLight ? 'dark' : 'light'} theme`}
    >
      {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{isLight ? 'Dark' : 'Light'}</span>
    </button>
  );
}

export function SettingsAppearancePanel() {
  const { theme, setTheme } = useTheme();
  const { pathname } = useLocation();
  if (pathname !== '/settings') return null;

  return (
    <section className="py-theme-settings-panel mx-auto mb-6 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Appearance settings">
      <div className="py-theme-settings-inner">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center border"><MonitorCog className="h-4 w-4" /></span>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.2em]">Console appearance</p>
            <h2 className="mt-1 text-lg font-black tracking-[-.035em]">Choose your operating environment.</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 opacity-70">The theme applies to the entire PhishYou experience, including public pages, campaign workspaces and console surfaces. Your choice is saved on this device.</p>
          </div>
        </div>
        <div className="py-theme-choice mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'} className={theme === 'dark' ? 'is-active' : ''}>
            <span className="py-theme-preview py-theme-preview-dark"><Moon className="h-4 w-4" /></span>
            <span><strong>Dark signal</strong><small>Cinematic command environment</small></span>
          </button>
          <button type="button" onClick={() => setTheme('light')} aria-pressed={theme === 'light'} className={theme === 'light' ? 'is-active' : ''}>
            <span className="py-theme-preview py-theme-preview-light"><Sun className="h-4 w-4" /></span>
            <span><strong>Light intelligence</strong><small>High-clarity daylight workspace</small></span>
          </button>
        </div>
      </div>
    </section>
  );
}
