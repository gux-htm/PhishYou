import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Boxes, ChevronLeft, Command, FileBarChart, LayoutDashboard, Menu, Moon, Plus, Settings, Shield, Sun, Workflow, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const nav = [
  { to: '/dashboard', label: 'Agent home', icon: LayoutDashboard },
  { to: '/campaigns/new', label: 'New campaign', icon: Plus },
  { to: '/settings/integrations', label: 'Connections', icon: Boxes },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/learning', label: 'Learning', icon: Workflow },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  return <div className="app-shell">
    <button className="shell-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
    <aside className={`shell-sidebar ${open ? 'is-open' : ''}`}>
      <div className="brand-row"><Link to="/dashboard" className="brand"><span className="brand-mark"><Shield size={17}/></span><span>PHISH<span>YOU</span></span></Link><button className="icon-button mobile-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18}/></button></div>
      <button className="new-campaign-rail" onClick={() => setOpen(false)}><Link to="/campaigns/new"><Plus size={17}/> New campaign</Link></button>
      <nav>{nav.map(({to,label,icon:Icon}) => <Link key={to} to={to} onClick={() => setOpen(false)} className={`shell-nav-item ${location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to + '/')) ? 'active' : ''}`}><Icon size={17}/><span>{label}</span></Link>)}</nav>
      <div className="shell-spacer" />
      <div className="agent-status"><span className="status-orb"/><div><b>Agent ready</b><small>Guardrails active</small></div></div>
      <button className="theme-switch" onClick={toggleTheme} aria-label="Switch color theme">{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}<span>{theme === 'dark' ? 'Light interface' : 'Dark interface'}</span><ChevronLeft size={14} className="theme-arrow"/></button>
    </aside>
    <div className="shell-scrim" onClick={() => setOpen(false)} />
    <main className="shell-content">{children}</main>
    <div className="shell-command-hint"><Command size={14}/><span>Ask the agent anything</span><kbd>⌘ K</kbd></div>
  </div>;
}
