import { createBrowserRouter } from 'react-router'

import { AdminOnlyRoute } from './components/auth/AdminOnlyRoute'
import { RequireAuthLayout } from './components/auth/RequireAuthLayout'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { AdminPage } from './pages/AdminPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { DatabaseDashboardPage } from './pages/DatabaseDashboardPage'
import { DataConnectorsPage } from './pages/DataConnectorsPage'
import { FacebookAdsDashboardPage } from './pages/FacebookAdsDashboardPage'
import { ForecastPage } from './pages/ForecastPage'
import { GoogleAdsDashboardPage } from './pages/GoogleAdsDashboardPage'
import { LandingPage } from './pages/LandingPage'
import { ModelsPage } from './pages/ModelsPage'
import { RFMQPage } from './pages/RFMQPage'
import { SettingsPage } from './pages/SettingsPage'

const eb = (Component: React.ComponentType) => (
  <ErrorBoundary>
    <Component />
  </ErrorBoundary>
)

export const router = createBrowserRouter([
  { path: '/', element: eb(LandingPage) },
  { path: '/auth', element: eb(AuthPage) },
  {
    path: '/',
    element: eb(RequireAuthLayout),
    children: [
      { path: 'dashboard', element: eb(DashboardPage) },
      { path: 'forecast', element: eb(ForecastPage) },
      { path: 'rfmq', element: eb(RFMQPage) },
      { path: 'analytics', element: eb(AnalyticsPage) },
      { path: 'models', element: eb(ModelsPage) },
      { path: 'connectors', element: eb(DataConnectorsPage) },
      { path: 'connectors/database', element: eb(DatabaseDashboardPage) },
      { path: 'connectors/facebook', element: eb(FacebookAdsDashboardPage) },
      { path: 'connectors/google', element: eb(GoogleAdsDashboardPage) },
      { path: 'settings', element: eb(SettingsPage) },
      {
        path: 'admin/portal',
        element: eb(() => (
          <AdminOnlyRoute>
            <AdminPage />
          </AdminOnlyRoute>
        )),
      },
    ],
  },
])
