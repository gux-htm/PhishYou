// Hello World
import { RouteObject } from 'react-router-dom';
import { Landing } from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { Learning } from './pages/Learning';
import LiveCampaignMonitor from './pages/LiveCampaignMonitor';
import Integrations from './pages/Integrations';
import Organization from './pages/Organization';
import AIChat from './pages/AIChat';
import NotFound from './pages/NotFound';

export const routes: RouteObject[] = [
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/learning', element: <Learning /> },
  { path: '/campaigns/:id/live', element: <LiveCampaignMonitor /> },
  { path: '/settings/integrations', element: <Integrations /> },
  { path: '/organization', element: <Organization /> },
  { path: '/tools/ai-chat', element: <AIChat /> },
  { path: '*', element: <NotFound /> },
];
