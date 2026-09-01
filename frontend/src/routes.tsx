/**
 * PhishYou — route table.
 * Spec: FRONTEND_SPEC_ENHANCED.md — Application Routes.
 *
 * Every authenticated page renders inside the AppShell (src/App.tsx); /login
 * renders standalone. Only implemented pages are routed — CampaignList,
 * CampaignDetail, CreateCampaign, Analytics, AfterActionReport and AuditLogs
 * are still placeholder files, so those paths (and anything else unknown)
 * resolve to NotFound until they are built.
 */
import { Navigate, RouteObject, useRoutes } from 'react-router-dom';
import AppShell from './App';
import AIAssistant from './pages/AIAssistant';
import Dashboard from './pages/Dashboard';
import Integrations from './pages/Integrations';
import LiveCampaignMonitor from './pages/LiveCampaignMonitor';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Organization from './pages/Organization';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import TargetDetail from './pages/TargetDetail';
import Targets from './pages/Targets';
import Users from './pages/Users';

const routes: RouteObject[] = [
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'campaigns/:id/live', element: <LiveCampaignMonitor /> },
      { path: 'targets', element: <Targets /> },
      { path: 'targets/:id', element: <TargetDetail /> },
      { path: 'reports', element: <Reports /> },
      { path: 'organization', element: <Organization /> },
      { path: 'users', element: <Users /> },
      { path: 'ai-assistant', element: <AIAssistant /> },
      { path: 'settings', element: <Settings /> },
      { path: 'settings/integrations', element: <Integrations /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export default function AppRoutes() {
  return useRoutes(routes);
}
