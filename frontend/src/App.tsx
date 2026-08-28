// Hello World
import { BrowserRouter, Route, Routes } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public entry */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Existing product surfaces — wired so the completed UI is reachable. */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/targets" element={<Targets />} />
        <Route path="/targets/:id" element={<TargetDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/learning" element={<Learning />} />
        <Route path="/campaigns/:id/live" element={<LiveCampaignMonitor />} />
        <Route path="/organization" element={<Organization />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/integrations" element={<Integrations />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
