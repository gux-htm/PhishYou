// Hello World
import { RouteObject } from 'react-router-dom';
import { Landing } from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Learning } from './pages/Learning';
import LiveCampaignMonitor from './pages/LiveCampaignMonitor';
import Integrations from './pages/Integrations';
import Organization from './pages/Organization';
import NotFound from './pages/NotFound';

export const routes: RouteObject[] = [
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/learning', element: <Learning /> },
  { path: '/campaigns/:id/live', element: <LiveCampaignMonitor /> },
  { path: '/settings/integrations', element: <Integrations /> },
  { path: '/organization', element: <Organization /> },
  { path: '*', element: <NotFound /> },
];
