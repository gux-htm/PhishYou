import type { ReactNode } from 'react';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import { ThemeProvider } from './design/ThemeProvider';
import { AppFrame } from './design/AppFrame';
import { Landing } from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CampaignList from './pages/CampaignList';
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
import Phase1CampaignBuilder from './pages/Phase1CampaignBuilder';
import Phase1CampaignDetail from './pages/Phase1CampaignDetail';
import Phase1LiveMonitor from './pages/Phase1LiveMonitor';
import Phase1Analytics from './pages/Phase1Analytics';
import CampaignWorkspace from './pages/CampaignWorkspace';
import AgentTools from './pages/AgentTools';
import AIChat from './pages/AIChat';

const Product = ({ children }: { children: ReactNode }) => <AppFrame>{children}</AppFrame>;

function CampaignRoute() {
  const { id = '' } = useParams();
  return id.startsWith('mock-phase1-') ? <Phase1CampaignDetail /> : <CampaignWorkspace />;
}

function CampaignLiveRoute() {
  const { id = '' } = useParams();
  return id.startsWith('mock-phase1-') ? <Phase1LiveMonitor /> : <LiveCampaignMonitor />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Product><Dashboard /></Product>} />
          <Route path="/campaigns" element={<Product><CampaignList /></Product>} />
          <Route path="/campaigns/new" element={<Product><Phase1CampaignBuilder /></Product>} />
          <Route path="/campaigns/:id" element={<Product><CampaignRoute /></Product>} />
          <Route path="/targets" element={<Product><Targets /></Product>} />
          <Route path="/targets/:id" element={<Product><TargetDetail /></Product>} />
          <Route path="/reports" element={<Product><Reports /></Product>} />
          <Route path="/analytics" element={<Product><Phase1Analytics /></Product>} />
          <Route path="/learning" element={<Product><Learning /></Product>} />
          <Route path="/campaigns/:id/live" element={<Product><CampaignLiveRoute /></Product>} />
          <Route path="/tools" element={<Product><AgentTools /></Product>} />
          <Route path="/tools/ai-chat" element={<Product><AIChat /></Product>} />
          <Route path="/organization" element={<Product><Organization /></Product>} />
          <Route path="/users" element={<Product><Users /></Product>} />
          <Route path="/settings" element={<Product><Settings /></Product>} />
          <Route path="/settings/integrations" element={<Product><Integrations /></Product>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
