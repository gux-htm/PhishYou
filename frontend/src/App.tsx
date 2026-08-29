// Hello World
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsAppearancePanel, ThemeToggle } from './components/ThemeControls';
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
import AgentTools from './pages/AgentTools';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ThemeToggle />
        <SettingsAppearancePanel />
        <Routes>
          {/* Public entry */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Product workspace */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/campaigns/new" element={<CreateCampaign />} />
          <Route path="/campaigns/:id" element={<CampaignWorkspace />} />
          <Route path="/campaigns/:id/live" element={<LiveCampaignMonitor />} />
          <Route path="/tools" element={<AgentTools />} />

          {/* Supporting product surfaces */}
          <Route path="/targets" element={<Targets />} />
          <Route path="/targets/:id" element={<TargetDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/organization" element={<Organization />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/integrations" element={<Integrations />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
