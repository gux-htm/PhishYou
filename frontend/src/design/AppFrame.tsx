import { Link, useLocation } from 'react-router-dom';
import { Bot, Command, FolderKanban, Database, Mail, Settings2, Moon, Sun, Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTheme } from './ThemeProvider';

const nav = [
  ['/dashboard', 'Command', Command],
  ['/campaigns', 'Campaigns', FolderKanban],
  ['/tool-settings#database', 'Database', Database],
  ['/tool-settings#llm', 'LLM', Bot],
  ['/tool-settings#email', 'Email', Mail],
  ['/tool-settings', 'Tool Settings', Settings2],
] as const;

export function AppFrame({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="py-app">
      <aside className={open ? 'py-sidebar is-open' : 'py-sidebar'}>
        <Link className="py-brand" to="/dashboard"><span className="py-brand-mark">P</span><span>PhishYou</span><i>AI SECURITY</i></Link>
        <nav>
          {nav.map(([to, label, Icon]) => {
            const [base, toHash] = to.split('#');
            const active = pathname === base || (base === '/tool-settings' && hash === `#${toHash ?? ''}`);
            return <Link onClick={() => setOpen(false)} className={active ? 'is-active' : ''} to={to} key={to}><Icon size={18}/><span>{label}</span></Link>;
          })}
        </nav>
        <div className="py-sidebar-footer">
          <span className="py-status"><b/> SYSTEM READY</span>
          <button className="py-theme-button" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>} {theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
        </div>
      </aside>
      <div className="py-main">
        <header className="py-topbar">
          <button className="py-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X/> : <Menu/>}</button>
          <div className="py-breadcrumb">PHISHYOU <span>/</span> INTELLIGENCE WORKSPACE</div>
          <div className="py-top-actions"><button aria-label="Toggle theme" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button><div className="py-avatar">OP</div></div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
