import type { ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/AppShell';
import { Landing } from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Learning } from './pages/Learning';
import LiveCampaignMonitor from './pages/LiveCampaignMonitor';
import Integrations from './pages/Integrations';
import Organization from './pages/Organization';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Targets from './pages/Targets';
import TargetDetail from './pages/TargetDetail';
import Users from './pages/Users';
import NotFound from './pages/NotFound';
import CreateCampaign from './pages/CreateCampaign';
import CampaignWorkspace from './pages/CampaignWorkspace';

const product = (node: ReactNode) => <AppShell>{node}</AppShell>;

export default function App() {
  return <ThemeProvider><BrowserRouter><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={product(<Dashboard />)} />
    <Route path="/campaigns/new" element={product(<CreateCampaign />)} />
    <Route path="/campaigns/:id" element={product(<CampaignWorkspace />)} />
    <Route path="/campaigns/:id/live" element={product(<LiveCampaignMonitor />)} />
    <Route path="/targets" element={product(<Targets />)} />
    <Route path="/targets/:id" element={product(<TargetDetail />)} />
    <Route path="/reports" element={product(<Reports />)} />
    <Route path="/learning" element={product(<Learning />)} />
    <Route path="/organization" element={product(<Organization />)} />
    <Route path="/users" element={product(<Users />)} />
    <Route path="/settings" element={product(<Settings />)} />
    <Route path="/settings/integrations" element={product(<Integrations />)} />
    <Route path="*" element={<NotFound />} />
  </Routes></BrowserRouter></ThemeProvider>;
}
